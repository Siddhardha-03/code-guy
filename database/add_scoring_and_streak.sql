-- Create indexes for better performance on scoring and streak calculations
-- These indexes optimize queries that calculate scores and streaks dynamically

CREATE INDEX IF NOT EXISTS idx_user_submission_date ON submissions(user_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_submission_question_passed ON submissions(question_id, passed, user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_passed ON submissions(user_id, question_id, passed);

-- Create view for dynamic leaderboard with scoring (calculated on-the-fly)
-- Scores are calculated based on difficulty at time of submission
DROP VIEW IF EXISTS user_coding_leaderboard;

CREATE VIEW user_coding_leaderboard AS
SELECT 
    u.id,
    u.name,
    u.email,
    -- Count unique questions where user has at least one passing submission
    COUNT(DISTINCT CASE 
        WHEN s.passed = 1 THEN s.question_id 
    END) as problems_solved,
    -- Count unique questions user attempted
    COUNT(DISTINCT s.question_id) as problems_attempted,
    -- Calculate success rate
    ROUND(COALESCE(
        SUM(CASE WHEN s.passed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
        0
    ), 1) as success_rate,
    -- Total submission count
    COUNT(*) as total_submissions,
    -- Calculate total points (10 for Easy, 25 for Medium, 50 for Hard)
    COALESCE(SUM(
        CASE WHEN s.passed = 1 THEN
            CASE q.difficulty
                WHEN 'Easy' THEN 10
                WHEN 'Medium' THEN 25
                WHEN 'Hard' THEN 50
                ELSE 10
            END
        ELSE 0 END
    ), 0) as total_points,
    -- Get last submission date
    MAX(s.submitted_at) as last_submission_date
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
LEFT JOIN questions q ON s.question_id = q.id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.email
ORDER BY total_points DESC, problems_solved DESC;
