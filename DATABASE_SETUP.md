# Database Setup Guide

## 1. Create Environment Variables

Create a `.env.local` file in the root directory with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=medconsult_liberia
```

## 2. Create the Database

Run this SQL command in your MySQL client:

```sql
CREATE DATABASE IF NOT EXISTS medconsult_liberia;
USE medconsult_liberia;
```

## 3. Create Tables

### Contact Messages Table
```sql
CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  preferred_date DATE,
  preferred_time TIME,
  reason TEXT,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_preferred_date (preferred_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 4. Test Connection

After setting up the database and environment variables, restart your Next.js dev server:

```bash
npm run dev
```

## 5. Verify Tables

Check that tables were created successfully:

```sql
SHOW TABLES;
DESCRIBE contact_messages;
DESCRIBE appointments;
```

## Optional: Sample Data

Insert test data to verify everything works:

```sql
INSERT INTO contact_messages (name, email, subject, message) 
VALUES ('Test User', 'test@example.com', 'general', 'This is a test message');

INSERT INTO appointments (name, email, phone, preferred_date, preferred_time, reason)
VALUES ('John Doe', 'john@example.com', '+231-XXX-XXXX', '2024-01-15', '10:00:00', 'General checkup');
```
