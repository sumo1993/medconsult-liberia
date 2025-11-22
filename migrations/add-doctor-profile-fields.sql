-- Add professional profile fields for doctors/management
ALTER TABLE users
ADD COLUMN title VARCHAR(50),
ADD COLUMN country VARCHAR(100),
ADD COLUMN specialization VARCHAR(200),
ADD COLUMN years_of_experience INT,
ADD COLUMN license_number VARCHAR(100),
ADD COLUMN research_interests TEXT,
ADD COLUMN current_projects TEXT,
ADD COLUMN bio TEXT;
