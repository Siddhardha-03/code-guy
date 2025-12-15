const express = require('express');
const router = express.Router();
const { generateScaffolds } = require('../utils/scaffoldGenerator');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { verifyFirebaseToken, isAdmin } = require('../middlewares/authFirebase');
const { processExcelImport } = require('../services/bulkQuestionService');

// Configure multer for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user (admin only)
 * @access  Private (Admin only)
 */
router.post('/users', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email and password'
      });
    }
    
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be either "student" or "admin".'
      });
    }
    
    // Check if user already exists
    const [existingUsers] = await req.db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const [result] = await req.db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: {
          id: result.insertId,
          name,
          email,
          role
        }
      }
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user. Please try again.'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only) with optional search by name/email
 * @access  Private
 */
router.get('/users', verifyFirebaseToken, isAdmin, async (req, res) => {
  const { search } = req.query;
  try {
    if (search) {
      const like = `%${search}%`;
      const [users] = await req.db.query(
        `SELECT id, name, email, role, created_at
         FROM users
         WHERE name LIKE ? OR email LIKE ?
         ORDER BY created_at DESC
         LIMIT 200`,
        [like, like]
      );
      return res.json({ success: true, data: users });
    }

    const [users] = await req.db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 200'
    );
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics (admin only)
 * @access  Private (Admin only)
 */
router.get('/stats', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    // Get total users count
    const [usersCount] = await req.db.execute('SELECT COUNT(*) as count FROM users');
    
    // Get total questions count
    const [questionsCount] = await req.db.execute('SELECT COUNT(*) as count FROM questions');
    
    // Get total quizzes count
    const [quizzesCount] = await req.db.execute('SELECT COUNT(*) as count FROM quizzes');
    
    // Get total submissions count
    const [submissionsCount] = await req.db.execute('SELECT COUNT(*) as count FROM submissions');
    
    // Get recent submissions
    const [recentSubmissions] = await req.db.execute(`
      SELECT s.id, s.passed, s.submitted_at, u.name as user_name, q.title as question_title
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN questions q ON s.question_id = q.id
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `);
    
    // Get user activity (submissions per day for last 7 days)
    const [dailyActivity] = await req.db.execute(`
      SELECT DATE(submitted_at) as date, COUNT(*) as submissions
      FROM submissions
      WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalUsers: usersCount[0].count,
        totalQuestions: questionsCount[0].count,
        totalQuizzes: quizzesCount[0].count,
        totalSubmissions: submissionsCount[0].count,
        recentSubmissions,
        dailyActivity
      }
    });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics. Please try again.'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private (Admin only)
 */
router.put('/users/:id/role', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    if (!role || !['student', 'admin'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be either "student" or "admin".'
      });
    }
    
    // Check if user exists
    const [users] = await req.db.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update user role
    await req.db.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );
    
    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user role. Please try again.'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin only)
 */
router.delete('/users/:id', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const [users] = await req.db.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Prevent deleting the last admin
    if (users[0].role === 'admin') {
      const [adminCount] = await req.db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      );
      
      if (adminCount[0].count <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete the last admin user'
        });
      }
    }
    
    // Start a transaction
    const connection = await req.db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Delete user's submissions
      await connection.execute(
        'DELETE FROM submissions WHERE user_id = ?',
        [userId]
      );
      
      // Delete user's quiz submissions
      await connection.execute(
        'DELETE FROM quiz_submissions WHERE user_id = ?',
        [userId]
      );
      
      // Delete user
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );
      
      // Commit transaction
      await connection.commit();
      
      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user. Please try again.'
    });
  }
});

/**
 * @route   GET /api/admin/leaderboard
 * @desc    Get leaderboard data (admin only)
 * @access  Private (Admin only)
 */
router.get('/leaderboard', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const type = req.query.type || 'overall'; // overall, quiz, coding
    const limit = parseInt(req.query.limit) || 10;

    console.log('Leaderboard request:', { type, limit });

    let leaderboardData = {};

    if (type === 'overall' || type === 'quiz') {
      try {
        // Quiz leaderboard using existing quiz_submissions table
        const [quizLeaderboard] = await req.db.query(`
          SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(DISTINCT qs.quiz_id) as quizzes_completed,
            ROUND(AVG(qs.score), 2) as avg_score,
            COUNT(qs.id) as total_attempts,
            MAX(qs.score) as highest_score
          FROM users u
          INNER JOIN quiz_submissions qs ON u.id = qs.user_id
          WHERE u.role = 'student'
          GROUP BY u.id, u.name, u.email
          ORDER BY avg_score DESC, quizzes_completed DESC
          LIMIT ?
        `, [limit]);
        
        console.log('Quiz leaderboard results:', quizLeaderboard.length);
        leaderboardData.quiz = (quizLeaderboard || []).map((row, index) => ({
          ...row,
          rank: index + 1
        }));
      } catch (quizError) {
        console.error('Quiz leaderboard error:', quizError.message);
        leaderboardData.quiz = [];
      }
    }

    if (type === 'overall' || type === 'coding') {
      try {
        // Coding challenges leaderboard with dynamic scoring (10 Easy, 25 Medium, 50 Hard)
        const [codingLeaderboard] = await req.db.query(`
          SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(DISTINCT CASE WHEN s.passed = 1 THEN s.question_id END) as problems_solved,
            COUNT(DISTINCT s.question_id) as problems_attempted,
            ROUND(COALESCE(
              SUM(CASE WHEN s.passed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
              0
            ), 1) as success_rate,
            COUNT(s.id) as total_submissions,
            COALESCE(SUM(
              CASE WHEN s.passed = 1 THEN
                CASE q.difficulty
                  WHEN 'Easy' THEN 10
                  WHEN 'Medium' THEN 25
                  WHEN 'Hard' THEN 50
                  ELSE 10
                END
              ELSE 0 END
            ), 0) as total_points
          FROM users u
          LEFT JOIN submissions s ON u.id = s.user_id
          LEFT JOIN questions q ON s.question_id = q.id
          WHERE u.role = 'student'
          GROUP BY u.id, u.name, u.email
          ORDER BY total_points DESC, problems_solved DESC
          LIMIT ?
        `, [limit]);
        
        console.log('Coding leaderboard results:', codingLeaderboard.length);
        leaderboardData.coding = (codingLeaderboard || []).map((row, index) => ({
          ...row,
          rank: index + 1
        }));
      } catch (codingError) {
        console.error('Coding leaderboard error:', codingError.message);
        leaderboardData.coding = [];
      }
    }

    // Overall stats
    if (type === 'overall') {
      try {
        const [userStats] = await req.db.execute(`SELECT COUNT(*) as total_active_users FROM users WHERE role = 'student'`);
        const [quizStats] = await req.db.execute(`SELECT COUNT(*) as total_quizzes FROM quizzes`);
        const [questionStats] = await req.db.execute(`SELECT COUNT(*) as total_questions FROM questions`);
        const [submissionStats] = await req.db.execute(`SELECT COUNT(*) as total_submissions FROM submissions`);
        
        leaderboardData.stats = {
          total_active_users: userStats[0].total_active_users,
          total_quizzes: quizStats[0].total_quizzes,
          total_questions: questionStats[0].total_questions,
          total_submissions: submissionStats[0].total_submissions
        };
        console.log('Overall stats:', leaderboardData.stats);
      } catch (statsError) {
        console.error('Stats error:', statsError.message);
        leaderboardData.stats = {
          total_active_users: 0,
          total_quizzes: 0,
          total_questions: 0,
          total_submissions: 0
        };
      }
    }

    console.log('Sending leaderboard data:', Object.keys(leaderboardData));
    res.status(200).json({
      status: 'success',
      data: leaderboardData
    });
  } catch (error) {
    console.error('Get leaderboard error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch leaderboard data. Please try again.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/leaderboard/recent-activity
 * @desc    Get recent user activity for leaderboard (admin only)
 * @access  Private (Admin only)
 */
router.get('/leaderboard/recent-activity', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    console.log('Recent activity request, limit:', limit);

    let recentQuizzes = [];
    let recentCoding = [];

    // Recent quiz submissions
    try {
      const [quizResults] = await req.db.execute(`
        SELECT 
          u.name as user_name,
          q.title as quiz_title,
          qs.score,
          qs.submitted_at,
          'quiz' as activity_type
        FROM quiz_submissions qs
        JOIN users u ON qs.user_id = u.id
        JOIN quizzes q ON qs.quiz_id = q.id
        ORDER BY qs.submitted_at DESC
        LIMIT ?
      `, [Math.floor(limit / 2)]);
      recentQuizzes = quizResults || [];
      console.log('Recent quiz submissions:', recentQuizzes.length);
    } catch (quizError) {
      console.error('Recent quiz error:', quizError.message);
    }

    // Recent coding submissions
    try {
      const [codingResults] = await req.db.execute(`
        SELECT 
          u.name as user_name,
          qu.title as question_title,
          s.passed,
          s.submitted_at,
          'coding' as activity_type
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        JOIN questions qu ON s.question_id = qu.id
        ORDER BY s.submitted_at DESC
        LIMIT ?
      `, [Math.ceil(limit / 2)]);
      recentCoding = codingResults || [];
      console.log('Recent coding submissions:', recentCoding.length);
    } catch (codingError) {
      console.error('Recent coding error:', codingError.message);
    }

    // Combine and sort by timestamp
    const recentActivity = [...recentQuizzes, ...recentCoding]
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
      .slice(0, limit);

    console.log('Total recent activity items:', recentActivity.length);

    res.status(200).json({
      status: 'success',
      data: {
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get recent activity error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recent activity. Please try again.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/questions/bulk-upload
 * @desc    Bulk upload questions from Excel file (admin only)
 * @access  Private (Admin only)
 */
router.post('/questions/bulk-upload', verifyFirebaseToken, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded. Please upload an Excel file.'
      });
    }

    console.log('Processing Excel file:', req.file.originalname, 'Size:', req.file.size, 'bytes');

    // Process the Excel file
    const result = await processExcelImport(req.db, req.file.buffer);

    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result, null, 2));
      return res.status(400).json({
        status: 'error',
        message: 'Validation errors found in Excel file',
        data: result
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully imported ${result.successful} question(s)`,
      data: result
    });
  } catch (error) {
    console.error('Bulk upload error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process Excel file. Please try again.'
    });
  }
});

/**
 * @route   POST /api/admin/questions/:questionId/test-cases
 * @desc    Add a single test case to a question (admin only)
 * @access  Private (Admin only)
 */
router.post('/questions/:questionId/test-cases', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { input, expected_output, hidden } = req.body;

    if (!input || !expected_output) {
      return res.status(400).json({
        status: 'error',
        message: 'Input and expected output are required'
      });
    }

    const [result] = await req.db.execute(
      'INSERT INTO test_cases (question_id, input, expected_output, hidden) VALUES (?, ?, ?, ?)',
      [questionId, input, expected_output, hidden ? 1 : 0]
    );

    res.status(201).json({
      status: 'success',
      message: 'Test case added successfully',
      data: {
        id: result.insertId,
        question_id: questionId,
        input,
        expected_output,
        hidden: hidden ? true : false
      }
    });
  } catch (error) {
    console.error('Add test case error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add test case. Please try again.'
    });
  }
});

/**
 * @route   PUT /api/admin/test-cases/:testCaseId
 * @desc    Update a test case (admin only)
 * @access  Private (Admin only)
 */
router.put('/test-cases/:testCaseId', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { input, expected_output, hidden } = req.body;

    if (!input || !expected_output) {
      return res.status(400).json({
        status: 'error',
        message: 'Input and expected output are required'
      });
    }

    await req.db.execute(
      'UPDATE test_cases SET input = ?, expected_output = ?, hidden = ? WHERE id = ?',
      [input, expected_output, hidden ? 1 : 0, testCaseId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Test case updated successfully'
    });
  } catch (error) {
    console.error('Update test case error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update test case. Please try again.'
    });
  }
});

/**
 * @route   DELETE /api/admin/test-cases/:testCaseId
 * @desc    Delete a test case (admin only)
 * @access  Private (Admin only)
 */
router.delete('/test-cases/:testCaseId', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const { testCaseId } = req.params;

    await req.db.execute('DELETE FROM test_cases WHERE id = ?', [testCaseId]);

    res.status(200).json({
      status: 'success',
      message: 'Test case deleted successfully'
    });
  } catch (error) {
    console.error('Delete test case error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete test case. Please try again.'
    });
  }
});

/**
 * @route   GET /api/admin/questions/:id/scaffold
 * @desc    Generate language-specific scaffolding for a question
 * @access  Private (Admin only)
 */
router.get('/questions/:id/scaffold', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const questionId = Number(req.params.id);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid question id' });
    }

    const [rows] = await req.db.execute('SELECT id, title, function_name, question_type, parameter_schema FROM questions WHERE id = ?', [questionId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const q = rows[0];
    let schema = null;
    try {
      schema = typeof q.parameter_schema === 'string' ? JSON.parse(q.parameter_schema) : q.parameter_schema;
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid parameter_schema JSON' });
    }

    const problem = {
      title: q.title,
      function_name: q.function_name,
      question_type: q.question_type,
      parameter_schema: schema
    };

    const scaffolds = generateScaffolds(problem, ['java','python','javascript','cpp']);
    return res.json({ success: true, data: scaffolds });
  } catch (error) {
    console.error('Scaffold generation error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
