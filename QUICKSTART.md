# Quick Start Guide

## 🚀 Get Your Site Running in 5 Minutes

### Step 1: Configure MySQL Connection

Create `.env.local` in the project root:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=medconsult_liberia
```

Replace `YOUR_MYSQL_PASSWORD_HERE` with your actual MySQL password.

### Step 2: Set Up Database

Open your MySQL client (MySQL Workbench, phpMyAdmin, or terminal) and run:

```bash
mysql -u root -p < setup-database.sql
```

Or manually:
1. Open MySQL client
2. Copy and paste contents of `setup-database.sql`
3. Execute

### Step 3: Start the Server

The dev server should already be running. If not:

```bash
npm run dev
```

### Step 4: Test the Site

1. Open http://localhost:3000
2. Scroll to the contact form
3. Fill it out and submit
4. Check your MySQL database:
   ```sql
   USE medconsult_liberia;
   SELECT * FROM contact_messages;
   ```

## ✅ You're Done!

Your site is now fully functional with:
- ✅ Beautiful responsive frontend
- ✅ Working contact form
- ✅ MySQL database integration
- ✅ API endpoints ready

## 🎨 Next Steps

### Customize Content

1. **Update doctor info**: Edit `components/About.tsx`
2. **Change contact details**: Edit `components/Contact.tsx` and `components/Footer.tsx`
3. **Modify services**: Edit `components/Services.tsx`

### Add More Features

- Create an admin dashboard to view messages
- Add email notifications when forms are submitted
- Implement appointment booking form
- Add authentication for admin area

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check MySQL is running: `mysql.server status` (Mac) or `sudo service mysql status` (Linux)
- Verify credentials in `.env.local`
- Ensure database exists: `SHOW DATABASES;`

### "Table doesn't exist"
- Run `setup-database.sql` again
- Check tables: `SHOW TABLES;`

### Port 3000 already in use
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9
# Or use a different port
npm run dev -- -p 3001
```

## 📚 Documentation

- Full README: [README.md](./README.md)
- Database setup: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- Next.js docs: https://nextjs.org/docs

## 🆘 Need Help?

Check the console for error messages and verify:
1. MySQL is running
2. `.env.local` exists with correct credentials
3. Database and tables are created
4. No port conflicts
