const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, optionalVerifyFirebaseToken, isAdmin } = require('../middlewares/authFirebase');
const { checkContestAccess, checkContestExists } = require('../middlewares/contestAccess');
const ExcelJS = require('exceljs');
const archiver = require('archiver');

// Get all contests (public). Uses optional auth so unauthenticated users can see public contests.
router.get('/', optionalVerifyFirebaseToken, async (req, res) => {
  try {
    // If user is admin, get all contests
    if (req.user.role === 'admin') {
      const [contests] = await req.db.query(`
        SELECT * FROM contests 
        ORDER BY created_at DESC
      `);
      return res.json(contests);
    }

    // If user is authenticated (non-admin) try to return public contests and any they're registered for
    if (req.user && req.user.id) {
      const [contests] = await req.db.query(`
        SELECT DISTINCT c.*,
          cp.status as participant_status,
          cp.score as current_score
        FROM contests c
        LEFT JOIN contest_participants cp ON c.id = cp.contest_id AND cp.user_id = ?
        WHERE c.visibility = 'public' OR cp.user_id = ?
        ORDER BY c.created_at DESC
      `, [req.user.id, req.user.id]);
      return res.json(contests);
    }

    // Unauthenticated users: return only public contests
    const [publicContests] = await req.db.query(`
      SELECT * FROM contests WHERE visibility = 'public' ORDER BY created_at DESC
    `);
    res.json(publicContests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new contest
router.post('/', verifyFirebaseToken, isAdmin, async (req, res) => {
  const {
    title,
    description,
    contest_type,
    visibility,
    start_time,
    end_time,
    max_participants,
    created_by
  } = req.body;

  console.log('[POST /contests] Creating contest:', {
    title,
    contest_type,
    userId: req.user?.id,
    userRole: req.user?.role
  });

  try {
    const [result] = await req.db.query(`
      INSERT INTO contests (
        title, description, contest_type, visibility,
        start_time, end_time, max_participants, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [title, description, contest_type, visibility, start_time, end_time, max_participants, created_by]);

    console.log('[POST /contests] Contest created successfully:', result.insertId);
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('[POST /contests] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add items to a contest
router.post('/:contestId/items', verifyFirebaseToken, isAdmin, async (req, res) => {
  const { contestId } = req.params;
  const { items } = req.body;

  try {
    // Items array can now include linkedQuizId for pairing quizzes with problems
    const values = items.map(item => [
      contestId,
      item.item_type,
      item.item_id,
      item.points,
      item.position,
      item.linkedQuizId || null  // Optional: quiz paired with this problem
    ]);

    // Check if table has linked_quiz_id column, if not just use existing columns
    await req.db.query(`
      INSERT INTO contest_items (
        contest_id, item_type, item_id, points, position, linked_quiz_id
      ) VALUES ?
    `, [values]).catch(async (err) => {
      // Fallback if column doesn't exist (backward compatibility)
      if (err.message.includes('Unknown column')) {
        const valuesCompat = items.map(item => [
          contestId,
          item.item_type,
          item.item_id,
          item.points,
          item.position
        ]);
        await req.db.query(`
          INSERT INTO contest_items (
            contest_id, item_type, item_id, points, position
          ) VALUES ?
        `, [valuesCompat]);
      } else {
        throw err;
      }
    });

    res.status(201).json({ message: 'Items added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contest details
router.get('/:contestId', verifyFirebaseToken, async (req, res) => {
  const { contestId } = req.params;
  try {
    // If user is admin, get full details
    if (req.user.role === 'admin') {
      const [[contest]] = await req.db.query('SELECT * FROM contests WHERE id = ?', [contestId]);
      if (!contest) return res.status(404).json({ error: 'Contest not found' });
      // Also attach participant context for the current user so UI logic remains consistent
      const [[cp]] = await req.db.query(
        'SELECT status AS participant_status, score AS current_score, total_time_seconds FROM contest_participants WHERE contest_id = ? AND user_id = ?',
        [contestId, req.user.id]
      );
      if (cp) Object.assign(contest, cp);
      return res.json(contest);
    }

    // For participants, check access and return limited details
    const [[contest]] = await req.db.query(`
      SELECT 
        c.id, c.title, c.description, c.contest_type,
        c.start_time, c.end_time, c.status,
        cp.status as participant_status,
        cp.score as current_score,
        cp.total_time_seconds
      FROM contests c
      LEFT JOIN contest_participants cp ON c.id = cp.contest_id AND cp.user_id = ?
      WHERE c.id = ? AND (c.visibility = 'public' OR EXISTS (
        SELECT 1 FROM contest_participants 
        WHERE contest_id = c.id AND user_id = ?
      ))
    `, [req.user.id, contestId, req.user.id]);

    if (!contest) return res.status(404).json({ error: 'Contest not found or access denied' });
    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finalize contest participation for the authenticated user
router.post('/:contestId/finalize', verifyFirebaseToken, async (req, res) => {
  const { contestId } = req.params;
  const userId = req.user.id;
  console.log(`[Finalize] userId=${userId}, contestId=${contestId}`);
  const connection = await req.db.getConnection();
  try {
    await connection.beginTransaction();

    // Ensure participant exists
    const [[participant]] = await connection.query(
      'SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?',
      [contestId, userId]
    );
    console.log(`[Finalize] Participant lookup result:`, participant);
    if (!participant) {
      await connection.rollback();
      return res.status(404).json({ status: 'error', message: 'Not registered for contest' });
    }

    // Update status to completed
    await connection.query(
      'UPDATE contest_participants SET status = ?, updated_at = NOW() WHERE contest_id = ? AND user_id = ?',
      ['completed', contestId, userId]
    );

    await connection.commit();
    res.json({ status: 'success', message: 'Contest finalized for user' });
  } catch (error) {
    await connection.rollback();
    console.error('Finalize error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to finalize contest' });
  } finally {
    connection.release();
  }
});

// Delete a contest
router.delete('/:contestId', verifyFirebaseToken, isAdmin, async (req, res) => {
  const { contestId } = req.params;
  const connection = await req.db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Delete contest submissions
    await connection.query('DELETE FROM contest_submissions WHERE contest_id = ?', [contestId]);
    
    // Delete contest participants
    await connection.query('DELETE FROM contest_participants WHERE contest_id = ?', [contestId]);
    
    // Delete contest items
    await connection.query('DELETE FROM contest_items WHERE contest_id = ?', [contestId]);
    
    // Delete contest itself
    await connection.query('DELETE FROM contests WHERE id = ?', [contestId]);
    
    await connection.commit();
    res.json({ message: 'Contest deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Register for a contest
router.post('/:contestId/register', verifyFirebaseToken, async (req, res) => {
  const { contestId } = req.params;
  const userId = req.user.id;
  const connection = await req.db.getConnection();

  try {
    await connection.beginTransaction();

    // Check if contest exists
    const [[contest]] = await connection.query('SELECT * FROM contests WHERE id = ?', [contestId]);
    if (!contest) {
      await connection.rollback();
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Check if user is already registered
    const [[existing]] = await connection.query(
      'SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?',
      [contestId, userId]
    );

    if (existing) {
      await connection.rollback();
      return res.status(400).json({ error: 'Already registered for this contest' });
    }

    // Check max participants limit
    if (contest.max_participants) {
      const [[count]] = await connection.query(
        'SELECT COUNT(*) as count FROM contest_participants WHERE contest_id = ?',
        [contestId]
      );

      if (count.count >= contest.max_participants) {
        await connection.rollback();
        return res.status(400).json({ error: 'Contest is full' });
      }
    }

    // Register user for contest
    // Note: schema uses created_at/updated_at defaults; no registered_at column
    const [result] = await connection.query(
      `INSERT INTO contest_participants (
        contest_id, user_id, status, is_active
      ) VALUES (?, ?, 'active', 1)`,
      [contestId, userId]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Successfully registered for contest',
      participantId: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Get contest items (for participants)
// Uses lightweight middleware to check contest exists, but allows viewing items without strict access validation
router.get('/:contestId/items', verifyFirebaseToken, checkContestExists, async (req, res) => {
  const { contestId } = req.params;
  try {
    // Try with linked_quiz_id column (new schema), fallback to old if not available
    let items = [];
    try {
      const [result] = await req.db.query(`
        SELECT ci.id, ci.contest_id, ci.item_type, ci.item_id, ci.points, ci.position, 
          ci.linked_quiz_id,
          q.title as question_title,
          qq.title as quiz_title,
          lq.title as linked_quiz_title
        FROM contest_items ci
        LEFT JOIN questions q ON ci.item_type = 'coding' AND ci.item_id = q.id
        LEFT JOIN quizzes qq ON ci.item_type = 'quiz' AND ci.item_id = qq.id
        LEFT JOIN quizzes lq ON ci.linked_quiz_id = lq.id
        WHERE ci.contest_id = ?
        ORDER BY ci.position
      `, [contestId]);
      items = result;
    } catch (err) {
      // Fallback for older schema without linked_quiz_id
      const [result] = await req.db.query(`
        SELECT ci.id, ci.contest_id, ci.item_type, ci.item_id, ci.points, ci.position,
          q.title as question_title,
          qq.title as quiz_title
        FROM contest_items ci
        LEFT JOIN questions q ON ci.item_type = 'coding' AND ci.item_id = q.id
        LEFT JOIN quizzes qq ON ci.item_type = 'quiz' AND ci.item_id = qq.id
        WHERE ci.contest_id = ?
        ORDER BY ci.position
      `, [contestId]);
      items = result;
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit response to a contest item (requires valid contest access)
router.post('/:contestId/submit', verifyFirebaseToken, checkContestAccess, async (req, res) => {
  const { contestId } = req.params;
  const { itemId, submission } = req.body;
  const userId = req.user.id;

  const connection = await req.db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Get contest item details
    const [[item]] = await connection.query(`
      SELECT * FROM contest_items 
      WHERE id = ? AND contest_id = ?
    `, [itemId, contestId]);

    if (!item) {
      await connection.rollback();
      return res.status(404).json({ error: 'Contest item not found' });
    }

    // Save the submission
    const [result] = await connection.query(`
      INSERT INTO contest_submissions (
        contest_id, contest_item_id, user_id, 
        submission_time, code, language, status
      ) VALUES (?, ?, ?, NOW(), ?, ?, 'pending')
    `, [contestId, itemId, userId, submission.code, submission.language]);

    await connection.commit();
    
    res.status(201).json({ 
      message: 'Submission received',
      submissionId: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Submit and evaluate contest coding problem
router.post('/:contestId/submit-code', verifyFirebaseToken, checkContestAccess, async (req, res) => {
  const { contestId } = req.params;
  const { contestItemId, code, language } = req.body;
  const userId = req.user.id;
  const judge0 = require('../utils/judge0');
  const codeRunner = require('../utils/codeRunner');

  const connection = await req.db.getConnection();

  try {
    await connection.beginTransaction();

    // Get contest item details
    const [[item]] = await connection.query(
      `SELECT ci.*, q.* FROM contest_items ci
       JOIN questions q ON ci.item_id = q.id
       WHERE ci.id = ? AND ci.contest_id = ? AND ci.item_type = 'coding'`,
      [contestItemId, contestId]
    );

    if (!item) {
      await connection.rollback();
      return res.status(404).json({ error: 'Contest item not found' });
    }

    // Get all test cases for the question
    const [testCases] = await connection.query(
      'SELECT * FROM test_cases WHERE question_id = ?',
      [item.item_id]
    );

    if (!testCases || testCases.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No test cases found for this problem' });
    }

    let passedCount = 0;
    const results = [];

    // Run code against all test cases
    for (const testCase of testCases) {
      const wrappedCode = codeRunner.buildWrappedCode({
        problem: item,
        code,
        language,
        testCaseInput: testCase.input || ''
      });

      const result = await judge0.submitCode(wrappedCode, language, '');
      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = (testCase.expected_output || '').trim();
      const errorOutput = (result.stderr || result.compileOutput || result.message || '').trim();
      const passed = actualOutput === expectedOutput && !errorOutput;

      if (passed) passedCount++;

      results.push({
        testCaseId: testCase.id,
        passed,
        hidden: testCase.hidden,
        input: testCase.hidden ? 'Hidden' : testCase.input,
        expectedOutput: testCase.hidden ? 'Hidden' : expectedOutput,
        actualOutput: testCase.hidden ? 'Hidden' : actualOutput,
        error: errorOutput
      });
    }

    const allPassed = passedCount === testCases.length;
    const score = allPassed ? (item.points || 100) : 0;

    // Save contest submission
    await connection.query(
      `INSERT INTO contest_submissions 
       (contest_id, contest_item_id, user_id, item_type, item_id, code, language, score, passed, created_at)
       VALUES (?, ?, ?, 'coding', ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       code = VALUES(code), language = VALUES(language), score = VALUES(score), 
       passed = VALUES(passed), created_at = NOW()`,
      [contestId, contestItemId, userId, item.item_id, code, language, score, allPassed ? 1 : 0]
    );

    // Update participant score - sum all their contest submission scores
    await connection.query(
      `UPDATE contest_participants cp
       SET cp.score = (
         SELECT COALESCE(SUM(cs.score), 0)
         FROM contest_submissions cs
         WHERE cs.contest_id = ? AND cs.user_id = ?
       ),
       cp.last_submission_at = NOW(),
       cp.updated_at = NOW()
       WHERE cp.contest_id = ? AND cp.user_id = ?`,
      [contestId, userId, contestId, userId]
    );

    await connection.commit();

    res.json({
      status: 'success',
      passed: allPassed,
      score,
      passedCount,
      totalTests: testCases.length,
      results
    });
  } catch (error) {
    await connection.rollback();
    console.error('Contest code submission error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Get contest participants and their scores
router.get('/:contestId/participants', verifyFirebaseToken, isAdmin, async (req, res) => {
  const { contestId } = req.params;

  try {
    const [participants] = await req.db.query(`
      SELECT 
        cp.*,
        u.name,
        u.email
      FROM contest_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.contest_id = ?
      ORDER BY cp.score DESC, cp.penalty_seconds ASC
    `, [contestId]);

    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export contest results
router.get('/:contestId/export', verifyFirebaseToken, isAdmin, async (req, res) => {
  const { contestId } = req.params;

  try {
    // Fetch contest details
    const [[contest]] = await req.db.query('SELECT * FROM contests WHERE id = ?', [contestId]);
    
    // Fetch participants
    const [participants] = await req.db.query(`
      SELECT 
        cp.*,
        u.name,
        u.email
      FROM contest_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.contest_id = ?
      ORDER BY cp.score DESC, cp.penalty_seconds ASC
    `, [contestId]);

    // Fetch contest items and submissions for each participant
    // Use quizzes table for quiz titles (quiz_questions is per-question)
    const [items] = await req.db.query(`
      SELECT ci.*, q.title as question_title, qq.title as quiz_title
      FROM contest_items ci
      LEFT JOIN questions q ON ci.item_type = 'coding' AND ci.item_id = q.id
      LEFT JOIN quizzes qq ON ci.item_type = 'quiz' AND ci.item_id = qq.id
      WHERE ci.contest_id = ?
      ORDER BY ci.position
    `, [contestId]);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contest Results');

    // Add headers
    const columns = [
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Total Score', key: 'score', width: 15 },
      { header: 'Time (minutes)', key: 'time', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Is Active', key: 'is_active', width: 10 },
      { header: 'Last Submission At', key: 'last_submission_at', width: 25 }
    ];

    // Add problem-specific columns
    items.forEach((item, index) => {
      columns.push({
        header: item.item_type === 'coding' ? item.question_title : item.quiz_title,
        key: `problem${index + 1}`,
        width: 20
      });
    });

    worksheet.columns = columns;

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // For each participant
    for (const participant of participants) {
      // Get their submissions
      const [submissions] = await req.db.query(`
        SELECT 
          cs.*,
          ci.position
        FROM contest_submissions cs
        JOIN contest_items ci ON cs.contest_item_id = ci.id
        WHERE cs.contest_id = ? AND cs.user_id = ?
      `, [contestId, participant.user_id]);

      // Create submission map for easy lookup
      const submissionMap = {};
      submissions.forEach(sub => {
        submissionMap[sub.position] = sub;
      });

      // Prepare row data
      const rowData = {
        rank: participant.rankk || 'N/A',
        name: participant.name,
        email: participant.email,
        score: participant.score,
        time: participant.total_time_seconds ? Math.floor(participant.total_time_seconds / 60) : 0,
        status: participant.status,
        is_active: participant.is_active ? 'yes' : 'no',
        last_submission_at: participant.last_submission_at ? participant.last_submission_at : ''
      };

      // Add submission data for each problem
      items.forEach((item, index) => {
        const sub = submissionMap[item.position];
        rowData[`problem${index + 1}`] = sub ? `${sub.score}pts` : 'Not attempted';
      });

      worksheet.addRow(rowData);
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=contest-${contestId}-results.xlsx`);

    // Send the workbook
    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export top 20 participants' code (zip)
router.get('/:contestId/export/top20-code', verifyFirebaseToken, isAdmin, async (req, res) => {
  const { contestId } = req.params;
  try {
    // Get top 20 participants by score
    const [top] = await req.db.query(
      `SELECT cp.user_id, cp.score, u.name, u.email
       FROM contest_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.contest_id = ?
       ORDER BY cp.score DESC, cp.penalty_seconds ASC
       LIMIT 20`,
      [contestId]
    );

    if (!top || top.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No participants found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=contest_${contestId}_top20_code.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });
    archive.pipe(res);

    let filesAdded = 0;

    // For each participant, collect their submissions for this contest
    for (let i = 0; i < top.length; i++) {
      const p = top[i];
      const userFolder = `${i + 1}_score${p.score}_${(p.name || 'user').replace(/\s+/g, '_')}`;

      // Get all coding contest submissions for this user in this contest
      const [subs] = await req.db.query(
        `SELECT cs.contest_item_id, cs.code, cs.language, ci.item_id as question_id, ci.position,
                q.title as question_title
         FROM contest_submissions cs
         JOIN contest_items ci ON cs.contest_item_id = ci.id
         LEFT JOIN questions q ON ci.item_id = q.id
         WHERE cs.contest_id = ? AND cs.user_id = ? AND ci.item_type = 'coding'
         ORDER BY ci.position`,
        [contestId, p.user_id]
      );

      // Add contest submissions
      for (const s of subs) {
        if (s.code && s.code.trim().length > 0) {
          const ext = getFileExtension(s.language);
          const sanitizedTitle = (s.question_title || `problem_${s.question_id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileName = `${userFolder}/${s.position}_${sanitizedTitle}.${ext}`;
          archive.append(s.code, { name: fileName });
          filesAdded++;
        }
      }

      // Get all contest items for this contest
      const [items] = await req.db.query(
        `SELECT ci.item_id, ci.position, q.title as question_title
         FROM contest_items ci
         LEFT JOIN questions q ON ci.item_id = q.id
         WHERE ci.contest_id = ? AND ci.item_type = 'coding'
         ORDER BY ci.position`,
        [contestId]
      );

      // Add code drafts for problems without submissions
      for (const it of items) {
        const [drafts] = await req.db.query(
          `SELECT code, language FROM code_drafts WHERE user_id = ? AND question_id = ? ORDER BY updated_at DESC LIMIT 1`,
          [p.user_id, it.item_id]
        );
        if (drafts && drafts.length > 0) {
          const d = drafts[0];
          if (d.code && d.code.trim().length > 0) {
            const ext = getFileExtension(d.language);
            const sanitizedTitle = (it.question_title || `problem_${it.item_id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `${userFolder}/draft_${it.position}_${sanitizedTitle}.${ext}`;
            archive.append(d.code, { name: fileName });
            filesAdded++;
          }
        }
      }

      // Add a summary file for each participant
      const summary = `Participant: ${p.name}\nEmail: ${p.email}\nScore: ${p.score}\nRank: ${i + 1}`;
      archive.append(summary, { name: `${userFolder}/README.txt` });
      filesAdded++;
    }

    console.log(`[Export] Added ${filesAdded} files to archive for contest ${contestId}`);
    
    // Finalize the archive after all files are added
    await archive.finalize();
  } catch (error) {
    console.error('Export top20 error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to export top20 code' });
  }
});

// Export contest code submissions
router.get('/:contestId/export-code', verifyFirebaseToken, isAdmin, async (req, res) => {
  const { contestId } = req.params;

  try {
    // Fetch top 20 participants
    const [participants] = await req.db.query(`
      SELECT 
        cp.*,
        u.name,
        u.email
      FROM contest_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.contest_id = ?
      ORDER BY cp.score DESC, cp.penalty_seconds ASC
      LIMIT 20
    `, [contestId]);

    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=contest-${contestId}-code.zip`);

    // Pipe archive data to response
    archive.pipe(res);

    // For each participant
    for (const participant of participants) {
      // Fetch their submissions
      const [submissions] = await req.db.query(`
        SELECT 
          cs.*,
          COALESCE(q.title, qq.question) as problem_title,
          ci.item_type
        FROM contest_submissions cs
        JOIN contest_items ci ON cs.contest_item_id = ci.id
        LEFT JOIN questions q ON ci.item_type = 'coding' AND ci.item_id = q.id
        LEFT JOIN quiz_questions qq ON ci.item_type = 'quiz' AND ci.item_id = qq.id
        WHERE cs.contest_id = ? AND cs.user_id = ?
        ORDER BY cs.score DESC
      `, [contestId, participant.user_id]);

      // Add each submission to the archive
      submissions.forEach(submission => {
        if (submission.item_type === 'coding') {
          const fileName = `${participant.name}/${submission.problem_title}/${submission.language}`;
          archive.append(submission.code, { name: `${fileName}.${getFileExtension(submission.language)}` });
        }
      });
    }

    // Finalize archive
    await archive.finalize();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get file extension based on language
function getFileExtension(language) {
  if (!language) return 'txt';
  const extensions = {
    'javascript': 'js',
    'js': 'js',
    'python': 'py',
    'py': 'py',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c'
  };
  const key = String(language).toLowerCase();
  return extensions[key] || 'txt';
}

module.exports = router;
