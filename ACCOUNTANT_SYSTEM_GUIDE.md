# Accountant & Financial Management System

## Overview
Complete financial tracking system with accountant dashboard, consultant earnings management, and transaction tracking.

## Database Tables Created

### 1. `transactions`
Tracks all financial transactions in the system.
- **Fields**: id, transaction_type, amount, currency, description, consultant_id, client_id, partnership_id, payment_method, payment_status, transaction_date, created_by
- **Transaction Types**: consultation_fee, partnership_payment, expense, refund, other
- **Payment Status**: pending, completed, failed, refunded

### 2. `consultant_earnings`
Tracks consultant commissions (70% of consultation fees).
- **Fields**: id, consultant_id, transaction_id, amount, commission_rate, net_earning, payment_status, payment_date, notes
- **Payment Status**: pending, paid, on_hold

### 3. `expenses`
Tracks business expenses.
- **Fields**: id, category, amount, description, expense_date, receipt_url, approved_by, status, created_by
- **Status**: pending, approved, rejected

### 4. User Roles Updated
Added new roles: `accountant` and `consultant` to the users table.

## API Endpoints

### Transactions API (`/api/transactions`)
- **GET**: Fetch all transactions (with filters: startDate, endDate, type, status)
- **POST**: Create new transaction (auto-creates consultant earning for consultation fees)

### Consultant Earnings API (`/api/consultant-earnings`)
- **GET**: Fetch earnings (consultants see only their own, accountants see all)
- **PUT**: Update payment status (mark as paid)

### Expenses API (`/api/expenses`)
- **GET**: Fetch expenses (with filters: status, startDate, endDate)
- **POST**: Create new expense

### Users API (`/api/users`)
- **GET**: Fetch users (with role filter)
- **POST**: Create new user (admin only)

## Dashboards

### 1. Accountant Dashboard (`/dashboard/accountant`)
**Access**: Users with role='accountant'

**Features**:
- **Stats Cards**:
  - Total Revenue
  - Monthly Revenue
  - Total Expenses
  - Pending Earnings

- **Tabs**:
  - **Transactions**: View all transactions, export to CSV
  - **Earnings**: Manage consultant earnings, mark as paid
  - **Expenses**: Track business expenses

- **Actions**:
  - Export transactions to CSV
  - Mark consultant earnings as paid
  - View detailed transaction history

### 2. Consultant Dashboard (`/dashboard/consultant`)
**Access**: Users with role='consultant'

**Features**:
- **Stats Cards**:
  - Total Earnings
  - Paid Earnings
  - Pending Earnings
  - This Month's Earnings

- **Earnings History Table**:
  - Date, Description, Amount, Commission %, Net Earning
  - Payment Status, Payment Date
  - Export to CSV

- **Commission Info**: 70% commission on all consultation fees

### 3. Admin Users Management (`/dashboard/admin/users`)
**Access**: Admin only

**Features**:
- Create users with roles: client, management, consultant, accountant, admin
- View all users with role badges
- Manage user status

## How to Use

### Creating an Accountant User
1. Login as admin
2. Go to `/dashboard/admin/users`
3. Click "Add User"
4. Fill in details:
   - Name
   - Email
   - Password
   - **Role**: Select "Accountant"
5. Click "Create User"

### Creating a Consultant User
1. Login as admin
2. Go to `/dashboard/admin/users`
3. Click "Add User"
4. Fill in details:
   - Name
   - Email
   - Password
   - **Role**: Select "Consultant"
5. Click "Create User"

### Recording a Consultation Transaction
1. Login as accountant
2. Go to `/dashboard/accountant`
3. Click "Add Transaction"
4. Fill in:
   - Type: "Consultation Fee"
   - Amount: $100
   - Consultant: Select consultant
   - Payment Method: cash/mobile_money/bank_transfer/card
   - Status: completed
   - Date: Transaction date
5. Click "Add Transaction"
6. **System automatically**:
   - Creates transaction record
   - Calculates 70% commission ($70)
   - Creates consultant earning record with "pending" status

### Paying Consultant Earnings
1. Login as accountant
2. Go to `/dashboard/accountant`
3. Click "Earnings" tab
4. Find pending earning
5. Click "Pay" button
6. Status changes to "paid" and payment date is recorded

### Consultant Viewing Earnings
1. Login as consultant
2. Go to `/dashboard/consultant`
3. View:
   - Total earnings
   - Paid vs pending amounts
   - Detailed earnings history
4. Export earnings to CSV

### Recording Expenses
1. Login as accountant
2. Go to `/dashboard/accountant`
3. Click "Expenses" tab
4. Click "Add Expense"
5. Fill in:
   - Category: office_supplies/utilities/salaries/etc
   - Amount
   - Description
   - Date
6. Click "Add Expense"

## Commission Structure
- **Consultants earn**: 70% of consultation fees
- **Platform retains**: 30% of consultation fees
- **Payment cycle**: Typically 7-14 business days
- **Payment methods**: Cash, Mobile Money, Bank Transfer

## Financial Reports
- **Export to CSV**: Available on both accountant and consultant dashboards
- **Filters**: Date range, transaction type, payment status
- **Data included**: All transaction details, earnings, expenses

## Security
- **Role-based access**: Only accountants and admins can access financial data
- **Consultants**: Can only view their own earnings
- **Authentication**: JWT token-based authentication
- **Authorization**: Middleware checks user role before granting access

## Database Queries

### Get Total Revenue
```sql
SELECT SUM(amount) as total_revenue 
FROM transactions 
WHERE payment_status = 'completed';
```

### Get Consultant Earnings
```sql
SELECT ce.*, u.name as consultant_name, u.email 
FROM consultant_earnings ce
JOIN users u ON ce.consultant_id = u.id
WHERE ce.payment_status = 'pending';
```

### Get Monthly Revenue
```sql
SELECT SUM(amount) as monthly_revenue 
FROM transactions 
WHERE payment_status = 'completed'
AND MONTH(transaction_date) = MONTH(CURRENT_DATE())
AND YEAR(transaction_date) = YEAR(CURRENT_DATE());
```

## Future Enhancements
- [ ] Automated payment reminders
- [ ] Bulk payment processing
- [ ] Advanced financial reports (PDF)
- [ ] Tax calculations
- [ ] Invoice generation
- [ ] Payment gateway integration
- [ ] Mobile app for consultants
- [ ] Real-time notifications
- [ ] Expense approval workflow
- [ ] Budget tracking

## Support
For issues or questions:
- Check API logs in browser console
- Verify user role is correct
- Ensure JWT token is valid
- Contact system administrator

## Version
- **Created**: November 2024
- **Version**: 1.0.0
- **Status**: Production Ready ✅
