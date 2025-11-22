-- Create ratings table for client to rate doctors after assignment completion
CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_request_id INT NOT NULL,
  client_id INT NOT NULL,
  doctor_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_request_id) REFERENCES assignment_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_rating_per_assignment (assignment_request_id, client_id)
);

-- Add index for faster queries (skip if already exists)
-- CREATE INDEX idx_ratings_doctor ON ratings(doctor_id);
-- CREATE INDEX idx_ratings_client ON ratings(client_id);
-- CREATE INDEX idx_ratings_assignment ON ratings(assignment_request_id);

-- Add average rating to users table for doctors
ALTER TABLE users ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN total_ratings INT DEFAULT 0;

-- Show the new table structure
DESCRIBE ratings;
