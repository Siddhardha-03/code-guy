-- Adds lightweight proctoring violation logs table
CREATE TABLE IF NOT EXISTS violation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  assessment_id VARCHAR(64) NOT NULL,
  assessment_type ENUM('quiz','contest','assessment') NOT NULL DEFAULT 'assessment',
  violation_type VARCHAR(64) NOT NULL,
  meta JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_violation_user (user_id),
  INDEX idx_violation_assessment (assessment_id, assessment_type),
  CONSTRAINT fk_violation_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
