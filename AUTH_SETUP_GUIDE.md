# Authentication System Setup Guide

## Overview

The system now has **3 user roles** with different access levels:

### 1. **Admin** 
- Full system access
- Manage all users
- View all activity logs
- System configuration

### 2. **Management (Doctor)**
- View all contact messages and emails
- Post and manage research articles
- Review assignment requests from clients
- Manage study materials
- Communicate with clients

### 3. **Client**
- Request help and assignments
- View research articles
- Access study materials
- Submit assignments
- Communicate with management

---

## Database Setup

### Step 1: Run the Authentication Schema

After running the basic `setup-database.sql`, run the authentication schema:

```bash
/usr/local/mysql/bin/mysql -u root -pGorpunadoue@95 < database-auth-schema.sql
```

This creates:
- ✅ `users` table (with roles: admin, management, client)
- ✅ `research_posts` table
- ✅ `assignment_requests` table
- ✅ `study_materials` table
- ✅ `assignment_submissions` table
- ✅ `messages` table
- ✅ `activity_logs` table

### Step 2: Add JWT Secret to Environment

Update your `.env.local` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Gorpunadoue@95
DB_NAME=medconsult_liberia

# Add this line:
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Default Accounts

### Admin Account (Created Automatically)
- **Email**: `admin@medconsult.com`
- **Password**: `Admin@123`
- **Role**: Admin

**⚠️ IMPORTANT**: Change this password immediately after first login!

---

## User Roles & Permissions

### Admin Dashboard (`/dashboard/admin`)
- **User Management**
  - View all users
  - Create/edit/delete users
  - Assign roles
  - Suspend/activate accounts
  
- **Content Management**
  - Manage all research posts
  - Manage study materials
  - View all assignment requests
  
- **System Monitoring**
  - View activity logs
  - System statistics
  - Database health

### Management Dashboard (`/dashboard/management`)
- **Communications**
  - View all contact form submissions
  - View all appointment requests
  - Internal messaging system
  
- **Research Management**
  - Create/edit/publish research articles
  - Categorize and tag research
  - View research analytics
  
- **Assignment Management**
  - View client assignment requests
  - Accept/reject assignments
  - Provide feedback and grades
  - Track assignment progress
  
- **Study Materials**
  - Upload study materials
  - Organize by category
  - Track downloads

### Client Dashboard (`/dashboard/client`)
- **Request Services**
  - Submit assignment requests
  - Request consultations
  - Track request status
  
- **Research Access**
  - Browse research articles
  - Search by category/tags
  - Bookmark favorites
  
- **Study Materials**
  - Download study materials
  - Access learning resources
  
- **Assignments**
  - View assigned work
  - Submit completed assignments
  - View feedback and grades
  
- **Communications**
  - Message management team
  - View message history

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new client account
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/logout` - Logout

### Research (Management only)
- `POST /api/research` - Create research post
- `GET /api/research` - List all research (public)
- `GET /api/research/[id]` - Get single research
- `PUT /api/research/[id]` - Update research
- `DELETE /api/research/[id]` - Delete research

### Assignments
- `POST /api/assignments` - Create assignment request (Client)
- `GET /api/assignments` - List assignments (filtered by role)
- `PUT /api/assignments/[id]` - Update assignment status (Management)
- `POST /api/assignments/[id]/submit` - Submit assignment (Client)

### Study Materials
- `POST /api/materials` - Upload material (Management/Admin)
- `GET /api/materials` - List materials
- `GET /api/materials/[id]` - Download material

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages` - Get inbox
- `PUT /api/messages/[id]/read` - Mark as read

### Admin Only
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user (any role)
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `GET /api/admin/logs` - View activity logs

---

## Testing the System

### 1. Test Registration (Client)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "Client@123",
    "full_name": "Test Client",
    "phone": "+231-555-1234"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medconsult.com",
    "password": "Admin@123"
  }'
```

### 3. Access Dashboards
- Admin: http://localhost:3000/dashboard/admin
- Management: http://localhost:3000/dashboard/management
- Client: http://localhost:3000/dashboard/client

---

## Creating Additional Users

### Via Admin Dashboard
1. Login as admin
2. Go to User Management
3. Click "Create User"
4. Fill in details and select role

### Via API (Admin only)
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "doctor@medconsult.com",
    "password": "Doctor@123",
    "full_name": "Dr. John Doe",
    "role": "management",
    "phone": "+231-555-5678"
  }'
```

---

## Security Best Practices

1. **Change Default Admin Password** immediately
2. **Use Strong JWT Secret** (32+ characters, random)
3. **Enable HTTPS** in production
4. **Regular Password Updates** for all accounts
5. **Monitor Activity Logs** for suspicious behavior
6. **Backup Database** regularly

---

## Next Steps

1. ✅ Run `database-auth-schema.sql`
2. ✅ Add `JWT_SECRET` to `.env.local`
3. ✅ Restart dev server
4. ✅ Test login at `/login`
5. ✅ Create management account
6. ✅ Build dashboard components (next phase)

---

## Troubleshooting

### "Invalid credentials"
- Check email and password
- Verify user exists in database
- Check user status is 'active'

### "Unauthorized" on dashboard
- Ensure you're logged in
- Check cookie is set
- Verify JWT_SECRET matches

### "Forbidden" error
- Check user role has permission
- Verify route protection settings

---

## Database Schema Diagram

```
users
├── id (PK)
├── email (unique)
├── password_hash
├── full_name
├── role (admin/management/client)
├── status (active/inactive/suspended)
└── timestamps

research_posts
├── id (PK)
├── title
├── content
├── author_id (FK → users)
├── status (draft/published/archived)
└── timestamps

assignment_requests
├── id (PK)
├── client_id (FK → users)
├── title
├── description
├── status (pending/accepted/completed/rejected)
├── assigned_to (FK → users)
└── timestamps

messages
├── id (PK)
├── sender_id (FK → users)
├── recipient_id (FK → users)
├── message
├── is_read
└── timestamps
```

---

**Your multi-role authentication system is ready!** 🎉
