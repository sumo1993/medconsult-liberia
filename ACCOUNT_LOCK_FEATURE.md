# Account Lock/Unlock Feature

## Overview
Admin users can now lock and unlock any user account from the Users Management page.

## Features Implemented

### 1. Lock/Unlock Functionality
- Lock Account: Changes user status from active to suspended
- Unlock Account: Changes user status from suspended to active
- Visual Indicators: 
  - Orange Lock icon for active accounts (click to lock)
  - Green Unlock icon for suspended accounts (click to unlock)

### 2. Safety Features
- Confirmation dialog before locking/unlocking
- Admin cannot lock their own account
- Status badge shows current account status

### 3. Site Settings Link
- Added Site Settings button to admin dashboard
- Located in Quick Actions section
- Direct access to manage WhatsApp and Facebook Messenger links

## How to Use

### Lock an Account
1. Go to Admin Dashboard > Manage Users
2. Find the user you want to lock
3. Click the orange Lock icon in the Actions column
4. Confirm the action
5. Account status changes to suspended

### Unlock an Account
1. Go to Admin Dashboard > Manage Users
2. Find the suspended user
3. Click the green Unlock icon in the Actions column
4. Confirm the action
5. Account status changes to active

### Access Site Settings
1. Go to Admin Dashboard
2. Click Site Settings button in Quick Actions
3. Manage social media links

## Technical Details

### API Endpoint
- URL: /api/admin/users/[id]/status
- Method: PATCH
- Body: { status: "active" | "suspended" | "inactive" }
- Auth: Admin only

### Database
- Table: users
- Column: status (ENUM: active, inactive, suspended)

### Files Modified
1. app/dashboard/admin/page.tsx - Added Site Settings button
2. app/dashboard/admin/users/page.tsx - Added lock/unlock functionality
3. app/api/admin/users/[id]/status/route.ts - New API endpoint

## Status Types
- active: User can log in and use the system
- suspended: User is locked out (cannot log in)
- inactive: User account is inactive but not locked
