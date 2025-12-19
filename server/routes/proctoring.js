const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, isAdmin } = require('../middlewares/authFirebase');

// POST /api/proctoring/violations
router.post('/violations', verifyFirebaseToken, async (req, res) => {
  const { assessmentId, assessmentType = 'assessment', violationType, meta = {} } = req.body;
  if (!assessmentId || !violationType) {
    return res.status(400).json({ status: 'error', message: 'assessmentId and violationType are required' });
  }

  try {
    await req.db.execute(
      'INSERT INTO violation_logs (user_id, assessment_id, assessment_type, violation_type, meta) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, String(assessmentId), assessmentType, violationType, JSON.stringify(meta)]
    );
    return res.status(201).json({ status: 'success', data: { assessmentId, assessmentType, violationType } });
  } catch (error) {
    console.error('[Proctoring] insert violation error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to record violation' });
  }
});

// GET /api/proctoring/violations (admin only)
router.get('/violations', verifyFirebaseToken, isAdmin, async (req, res) => {
  try {
    const { assessmentId, assessmentType, userId, limit = 200 } = req.query;
    const params = [];
    let whereClause = '';

    // Build WHERE clause dynamically
    const conditions = [];
    if (assessmentId) {
      conditions.push('assessment_id = ?');
      params.push(String(assessmentId));
    }
    if (assessmentType) {
      conditions.push('assessment_type = ?');
      params.push(String(assessmentType));
    }
    if (userId) {
      conditions.push('user_id = ?');
      params.push(Number(userId));
    }

    if (conditions.length > 0) {
      whereClause = ' WHERE ' + conditions.join(' AND ');
    }

    // Add LIMIT parameter
    params.push(Number(limit) || 200);

    const query = `SELECT id, user_id, assessment_id, assessment_type, violation_type, meta, created_at
                   FROM violation_logs${whereClause}
                   ORDER BY created_at DESC LIMIT ?`;

    console.log('[Proctoring] Query:', query);
    console.log('[Proctoring] Params:', params);

    const [rows] = await req.db.execute(query, params);
    return res.json({ status: 'success', data: rows || [] });
  } catch (error) {
    console.error('[Proctoring] fetch violations error:', error.message);
    console.error('[Proctoring] Full error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch violations', error: error.message });
  }
});

module.exports = router;
