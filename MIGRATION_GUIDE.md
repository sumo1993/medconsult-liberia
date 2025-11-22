# 🔧 Database Migration Guide

## Migration: Add Featured Image Support

This migration adds support for featured images and download tracking to research posts.

---

## 📋 What This Migration Does

Adds the following columns to `research_posts` table:
- `featured_image` (LONGBLOB) - Stores the image file
- `featured_image_filename` (VARCHAR(255)) - Original filename
- `featured_image_size` (INT) - File size in bytes
- `download_count` (INT) - Tracks PDF downloads

---

## 🚀 Option 1: Run with Node.js (Recommended)

### Interactive Version (Prompts for credentials):

```bash
node run-migration-interactive.js
```

You'll be prompted for:
- Database host (default: localhost)
- Database user (default: root)
- Database password
- Database name (default: medconsult_liberia)

---

## 🗄️ Option 2: Run with MySQL CLI

### If you have MySQL CLI installed:

```bash
mysql -u root -p medconsult_liberia < migrations/add-featured-image-columns.sql
```

### Or connect to MySQL first:

```bash
mysql -u root -p
```

Then run:

```sql
USE medconsult_liberia;

ALTER TABLE research_posts 
ADD COLUMN featured_image LONGBLOB AFTER pdf_size,
ADD COLUMN featured_image_filename VARCHAR(255) AFTER featured_image,
ADD COLUMN featured_image_size INT AFTER featured_image_filename,
ADD COLUMN download_count INT DEFAULT 0 AFTER views;
```

---

## 🔍 Option 3: Use Database GUI Tool

If you're using a database GUI tool (phpMyAdmin, MySQL Workbench, TablePlus, etc.):

1. Connect to your database
2. Select `medconsult_liberia` database
3. Open SQL query window
4. Copy and paste:

```sql
ALTER TABLE research_posts 
ADD COLUMN featured_image LONGBLOB AFTER pdf_size,
ADD COLUMN featured_image_filename VARCHAR(255) AFTER featured_image,
ADD COLUMN featured_image_size INT AFTER featured_image_filename,
ADD COLUMN download_count INT DEFAULT 0 AFTER views;
```

5. Execute the query

---

## ✅ Verify Migration

After running the migration, verify it worked:

```sql
DESCRIBE research_posts;
```

You should see the new columns:
- `featured_image` (longblob)
- `featured_image_filename` (varchar(255))
- `featured_image_size` (int)
- `download_count` (int)

---

## 🐛 Troubleshooting

### Error: "Column already exists"

The migration has already been run. No action needed.

### Error: "Access denied"

Check your database credentials (username/password).

### Error: "Unknown database"

Make sure `medconsult_liberia` database exists:

```sql
CREATE DATABASE IF NOT EXISTS medconsult_liberia;
```

### Error: "Table 'research_posts' doesn't exist"

Run the main database setup first:

```bash
mysql -u root -p medconsult_liberia < setup-database.sql
```

---

## 📝 Manual Verification Query

```sql
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'medconsult_liberia' 
AND TABLE_NAME = 'research_posts'
AND COLUMN_NAME IN ('featured_image', 'featured_image_filename', 'featured_image_size', 'download_count');
```

Expected output:
```
+---------------------------+-----------+-------------+----------------+
| COLUMN_NAME               | DATA_TYPE | IS_NULLABLE | COLUMN_DEFAULT |
+---------------------------+-----------+-------------+----------------+
| download_count            | int       | YES         | 0              |
| featured_image            | longblob  | YES         | NULL           |
| featured_image_filename   | varchar   | YES         | NULL           |
| featured_image_size       | int       | YES         | NULL           |
+---------------------------+-----------+-------------+----------------+
```

---

## 🎯 After Migration

Once the migration is complete:

1. ✅ Image upload will work in create/edit pages
2. ✅ Featured images will be stored in database
3. ✅ Download tracking will be available
4. ✅ All new features will be functional

---

## 🔄 Rollback (If Needed)

If you need to undo this migration:

```sql
ALTER TABLE research_posts 
DROP COLUMN featured_image,
DROP COLUMN featured_image_filename,
DROP COLUMN featured_image_size,
DROP COLUMN download_count;
```

⚠️ **Warning**: This will delete all uploaded images!

---

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify database connection settings
3. Ensure you have proper permissions
4. Make sure the `research_posts` table exists

---

**Migration File**: `migrations/add-featured-image-columns.sql`
**Created**: November 19, 2025
**Status**: Ready to run
