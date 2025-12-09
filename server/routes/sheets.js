const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, isAdmin } = require('../middlewares/authFirebase');

/**
 * @route   GET /api/sheets/featured
 * @desc    Get featured sheets for homepage
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    // Validate limit to prevent SQL injection
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Limit must be between 1 and 100'
      });
    }
    
    const query = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.difficulty_level,
        s.category,
        s.estimated_hours,
        s.is_featured,
        s.created_by,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(DISTINCT question_id) FROM sheet_problems WHERE sheet_id = s.id) as total_problems,
        (SELECT COUNT(DISTINCT user_id) FROM user_sheet_progress WHERE sheet_id = s.id) as users_started
      FROM sheets s
      WHERE s.is_featured = 1
      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `;
    
    console.log('Fetching featured sheets with limit:', limit);
    
    const [result] = await req.db.execute(query);
    const sheets = Array.isArray(result) ? result : [];
    
    console.log('Featured sheets found:', sheets.length);
    
    res.status(200).json({
      status: 'success',
      data: sheets
    });
  } catch (error) {
    console.error('Get featured sheets error:', error.message, error.sql);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch featured sheets',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/sheets/user/progress
 * @desc    Get user's sheet progress
 * @access  Private
 */
router.get('/user/progress', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [progress] = await req.db.execute(
      `SELECT 
        usp.*,
        s.title as sheet_title,
        s.category,
        (SELECT COUNT(DISTINCT question_id) FROM sheet_problems WHERE sheet_id = s.id) as total_problems,
        (SELECT COUNT(DISTINCT sp.question_id) 
         FROM sheet_problems sp
         WHERE sp.sheet_id = s.id 
         AND EXISTS (
           SELECT 1 FROM submissions sub 
           WHERE sub.question_id = sp.question_id 
           AND sub.user_id = ? 
           AND sub.passed = 1
         )
        ) as solved_problems
      FROM user_sheet_progress usp
      JOIN sheets s ON usp.sheet_id = s.id
      WHERE usp.user_id = ?
      ORDER BY usp.last_accessed DESC`,
      [userId, userId]
    );
    
    res.status(200).json({
      status: 'success',
      data: { progress }
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user progress'
    });
  }
});

/**
 * @route   GET /api/sheets/:id
 * @desc    Get sheet details with problems
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const sheetId = req.params.id;
    const userId = req.user?.id;
    
    // Get sheet details
    const [sheets] = await req.db.execute(
      `SELECT 
        s.id,
        s.title,
        s.description,
        s.difficulty_level,
        s.category,
        s.estimated_hours,
        s.is_featured,
        s.created_by,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(DISTINCT question_id) FROM sheet_problems WHERE sheet_id = s.id) as total_problems,
        u.name as creator_name
      FROM sheets s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?`,
      [sheetId]
    );
    
    if (sheets.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Sheet not found'
      });
    }
    
    const sheet = sheets[0];
    
    // Get problems in this sheet
    const [problems] = await req.db.execute(
      `SELECT 
        q.*,
        sp.position,
        sp.is_optional,
        sp.notes,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM submissions sub 
            WHERE sub.question_id = q.id 
            AND sub.user_id = ? 
            AND sub.passed = 1
          ) THEN 1 ELSE 0 
        END as user_solved,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM submissions sub 
            WHERE sub.question_id = q.id 
            AND sub.user_id = ? 
            AND sub.passed = 0
          ) THEN 1 ELSE 0 
        END as user_attempted
      FROM sheet_problems sp
      JOIN questions q ON sp.question_id = q.id
      WHERE sp.sheet_id = ?
      ORDER BY sp.position ASC`,
      [userId || null, userId || null, sheetId]
    );
    
    // Parse JSON fields
    problems.forEach(problem => {
      if (problem.tags && typeof problem.tags === 'string') {
        try {
          const parsed = JSON.parse(problem.tags);
          problem.tags = parsed.tags || [];
        } catch (e) {
          problem.tags = [];
        }
      }
      if (problem.language_supported && typeof problem.language_supported === 'string') {
        try {
          const parsed = JSON.parse(problem.language_supported);
          problem.language_supported = parsed.languages || [];
        } catch (e) {
          problem.language_supported = [];
        }
      }
    });
    
    // Get user progress if logged in
    let userProgress = null;
    if (userId) {
      const [progress] = await req.db.execute(
        `SELECT * FROM user_sheet_progress WHERE user_id = ? AND sheet_id = ?`,
        [userId, sheetId]
      );
      userProgress = progress[0] || null;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        sheet,
        problems,
        userProgress
      }
    });
  } catch (error) {
    console.error('Get sheet error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sheet details'
    });
  }
});

/**
 * @route   POST /api/sheets/:id/start
 * @desc    Start a sheet (track user progress)
 * @access  Private
 */
router.post('/:id/start', verifyFirebaseToken, async (req, res) => {
  try {
    const sheetId = req.params.id;
    const userId = req.user.id;
    
    // Check if already started
    const [existing] = await req.db.execute(
      'SELECT id FROM user_sheet_progress WHERE user_id = ? AND sheet_id = ?',
      [userId, sheetId]
    );
    
    if (existing.length > 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Sheet already started'
      });
    }
    
    // Create progress record
    await req.db.execute(
      'INSERT INTO user_sheet_progress (user_id, sheet_id) VALUES (?, ?)',
      [userId, sheetId]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Sheet started successfully'
    });
  } catch (error) {
    console.error('Start sheet error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start sheet'
    });
  }
});

/**
 * @route   POST /api/sheets
 * @desc    Create a new sheet
 * @access  Private (Admin only)
 */
router.post('/', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const { title, description, difficulty_level, category, estimated_hours, is_featured, problems } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and description are required'
      });
    }
    
    const connection = await req.db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create sheet
      const [result] = await connection.execute(
        `INSERT INTO sheets (title, description, difficulty_level, category, estimated_hours, is_featured, created_by, total_problems)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          description,
          difficulty_level || 'mixed',
          category || 'other',
          estimated_hours || null,
          is_featured || false,
          req.user.id,
          problems?.length || 0
        ]
      );
      
      const sheetId = result.insertId;
      
      // Add problems to sheet
      if (problems && Array.isArray(problems) && problems.length > 0) {
        for (let i = 0; i < problems.length; i++) {
          const problem = problems[i];
          await connection.execute(
            `INSERT INTO sheet_problems (sheet_id, question_id, position, is_optional, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [sheetId, problem.question_id, i + 1, problem.is_optional || false, problem.notes || null]
          );
        }
      }
      
      await connection.commit();
      connection.release();
      
      res.status(201).json({
        status: 'success',
        message: 'Sheet created successfully',
        data: { sheetId }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create sheet error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create sheet'
    });
  }
});

/**
 * @route   PUT /api/sheets/:id
 * @desc    Update a sheet
 * @access  Private (Admin only)
 */
router.put('/:id', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const sheetId = req.params.id;
    const { title, description, difficulty_level, category, estimated_hours, is_featured, problems } = req.body;
    
    const connection = await req.db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update sheet
      await connection.execute(
        `UPDATE sheets 
         SET title = ?, description = ?, difficulty_level = ?, category = ?, 
             estimated_hours = ?, is_featured = ?, total_problems = ?
         WHERE id = ?`,
        [
          title,
          description,
          difficulty_level || 'mixed',
          category || 'other',
          estimated_hours || null,
          is_featured || false,
          problems?.length || 0,
          sheetId
        ]
      );
      
      // Update problems (remove and re-add)
      if (problems && Array.isArray(problems)) {
        await connection.execute('DELETE FROM sheet_problems WHERE sheet_id = ?', [sheetId]);
        
        for (let i = 0; i < problems.length; i++) {
          const problem = problems[i];
          await connection.execute(
            `INSERT INTO sheet_problems (sheet_id, question_id, position, is_optional, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [sheetId, problem.question_id, i + 1, problem.is_optional || false, problem.notes || null]
          );
        }
      }
      
      await connection.commit();
      connection.release();
      
      res.status(200).json({
        status: 'success',
        message: 'Sheet updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update sheet error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update sheet'
    });
  }
});

/**
 * @route   DELETE /api/sheets/:id
 * @desc    Delete a sheet
 * @access  Private (Admin only)
 */
router.delete('/:id', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const sheetId = req.params.id;
    
    await req.db.execute('DELETE FROM sheets WHERE id = ?', [sheetId]);
    
    res.status(200).json({
      status: 'success',
      message: 'Sheet deleted successfully'
    });
  } catch (error) {
    console.error('Delete sheet error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete sheet'
    });
  }
});

/**
 * @route   GET /api/sheets
 * @desc    Get all sheets with optional filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const category = req.query.category;
    const featured = req.query.featured;
    const limit = Math.min(parseInt(req.query.limit) || 100, 100);
    
    let query = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.difficulty_level,
        s.category,
        s.estimated_hours,
        s.is_featured,
        s.created_by,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(DISTINCT question_id) FROM sheet_problems WHERE sheet_id = s.id) as total_problems,
        (SELECT COUNT(DISTINCT user_id) FROM user_sheet_progress WHERE sheet_id = s.id) as users_started
      FROM sheets s
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (category) {
      query += ` AND s.category = ?`;
      queryParams.push(category);
    }
    
    if (featured === 'true') {
      query += ` AND s.is_featured = 1`;
    }
    
    query += ` ORDER BY s.is_featured DESC, s.created_at DESC LIMIT ${limit}`;
    
    console.log('Executing query:', query, 'with params:', queryParams);
    
    const [result] = await req.db.execute(query, queryParams);
    const sheets = Array.isArray(result) ? result : [];
    
    console.log('Query result:', sheets.length, 'sheets found');
    
    res.status(200).json({
      status: 'success',
      data: sheets
    });
  } catch (error) {
    console.error('Get sheets error:', error.message, error.sql);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sheets',
      error: error.message
    });
  }
});

module.exports = router;
