/**
 * Seed a few passed submissions to demonstrate dynamic coding points
 * Uses existing tables: users, questions, submissions
 * - Finds up to 3 students
 * - Finds one Easy, one Medium, one Hard question
 * - Inserts passed submissions per user to generate points: 10/25/50
 */

const { pool } = require('./utils/db');

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Seeding demo coding points...');

    const [users] = await conn.query(
      "SELECT id FROM users WHERE role='student' ORDER BY id LIMIT 3"
    );
    if (users.length === 0) {
      console.log('No student users found. Aborting.');
      return;
    }

    const [easyQ] = await conn.query(
      "SELECT id FROM questions WHERE difficulty='Easy' ORDER BY id LIMIT 1"
    );
    const [mediumQ] = await conn.query(
      "SELECT id FROM questions WHERE difficulty='Medium' ORDER BY id LIMIT 1"
    );
    const [hardQ] = await conn.query(
      "SELECT id FROM questions WHERE difficulty='Hard' ORDER BY id LIMIT 1"
    );

    const picked = [easyQ[0]?.id, mediumQ[0]?.id, hardQ[0]?.id].filter(Boolean);
    if (picked.length === 0) {
      console.log('No questions with difficulty found. Please set difficulty on some questions.');
      return;
    }

    // For each user, insert a passed submission for each available difficulty once
    for (const u of users) {
      for (const qid of picked) {
        // Avoid duplicates: check if a passed submission already exists
        const [exists] = await conn.query(
          'SELECT id FROM submissions WHERE user_id=? AND question_id=? AND passed=1 LIMIT 1',
          [u.id, qid]
        );
        if (exists.length > 0) {
          continue;
        }

        await conn.query(
          `INSERT INTO submissions (user_id, question_id, code, language, passed, test_case_results, submitted_at, status)
           VALUES (?, ?, '/* demo */', 'javascript', 1, JSON_ARRAY(), NOW(), 'accepted')`,
          [u.id, qid]
        );
        console.log(`Inserted passed submission: user ${u.id} question ${qid}`);
      }
    }

    console.log('Done. Refresh the admin leaderboard to see points.');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
