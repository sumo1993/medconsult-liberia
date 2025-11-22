-- Add comprehensive profile fields for clients
ALTER TABLE users
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
ADD COLUMN city VARCHAR(100),
ADD COLUMN county VARCHAR(100),
ADD COLUMN educational_level ENUM('no_formal_education', 'primary', 'junior_high', 'senior_high', 'vocational', 'associate_degree', 'bachelor_degree', 'master_degree', 'doctoral_degree'),
ADD COLUMN marital_status ENUM('single', 'married', 'divorced', 'widowed', 'separated'),
ADD COLUMN employment_status ENUM('student', 'employed', 'self_employed', 'unemployed', 'retired'),
ADD COLUMN occupation VARCHAR(100),
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN emergency_contact_name VARCHAR(100),
ADD COLUMN emergency_contact_phone VARCHAR(20),
ADD COLUMN emergency_contact_relationship VARCHAR(50);
