# Client Profile - Comprehensive Guide

## Overview
The client profile page has been completely redesigned to capture comprehensive user information including personal details, education, employment, and emergency contacts.

## Features Added

### 1. Profile Photo Management
- Upload profile picture
- Maximum size: 5MB
- Supported formats: JPG, PNG, GIF
- Displays in dashboard header

### 2. Basic Information
- **Full Name** (Required)
- **Email Address** (Read-only, cannot be changed)
- **Date of Birth**
- **Gender** (Male, Female, Other, Prefer not to say)
- **Phone Number**
- **Marital Status** (Single, Married, Divorced, Widowed, Separated)

### 3. Location Information
- **County** (Dropdown with all 15 Liberian counties)
  - Bomi, Bong, Gbarpolu, Grand Bassa, Grand Cape Mount
  - Grand Gedeh, Grand Kru, Lofa, Margibi, Maryland
  - Montserrado, Nimba, River Cess, River Gee, Sinoe
- **City/Town** (Free text)

### 4. Education & Employment
- **Educational Level**
  - No Formal Education
  - Primary School
  - Junior High School
  - Senior High School
  - Vocational/Technical Training
  - Associate Degree
  - Bachelor's Degree
  - Master's Degree
  - Doctoral Degree (PhD)

- **Employment Status**
  - Student
  - Employed
  - Self-Employed
  - Unemployed
  - Retired

- **Occupation/Field of Study**
  - Job title if employed
  - Field of study if student

### 5. Emergency Contact
- **Contact Name**
- **Contact Phone**
- **Relationship** (e.g., Spouse, Parent, Sibling, Friend)

### 6. Security
- **Change Password** section
- Requires current password
- Minimum 6 characters for new password
- Password confirmation

## How to Use

### Accessing the Profile
1. Log in as a client
2. Click on your profile avatar in the dashboard header
3. Select "My Profile" or navigate to `/dashboard/client/profile`

### Updating Profile Information
1. Fill in or update any fields
2. All fields except Full Name are optional
3. Click "Save Profile" button at the bottom
4. Success notification will appear

### Changing Password
1. Scroll to the "Change Password" section
2. Enter your current password
3. Enter new password (minimum 6 characters)
4. Confirm new password
5. Click "Change Password"

### Uploading Profile Photo
1. Click "Upload New Photo" button
2. Select an image file (max 5MB)
3. Photo will be uploaded and displayed immediately
4. Page will refresh to show new photo

## Database Structure

### New Fields in `users` Table
```sql
- date_of_birth (DATE)
- gender (ENUM)
- city (VARCHAR 100)
- county (VARCHAR 100)
- educational_level (ENUM)
- marital_status (ENUM)
- employment_status (ENUM)
- occupation (VARCHAR 100)
- phone_number (VARCHAR 20)
- emergency_contact_name (VARCHAR 100)
- emergency_contact_phone (VARCHAR 20)
- emergency_contact_relationship (VARCHAR 50)
```

## API Endpoints

### GET /api/profile
- Fetches current user profile
- Returns all profile fields
- Authentication required

### PUT /api/profile/update
- Updates user profile information
- Accepts all profile fields
- Authentication required
- Returns success/error message

### POST /api/profile/update-photo
- Uploads profile photo
- Accepts base64 encoded image
- Max size: 5MB
- Authentication required

### POST /api/profile/change-password
- Changes user password
- Requires current password
- Minimum 6 characters for new password
- Authentication required

## Features

### User Experience
- ✅ Clean, organized sections with icons
- ✅ Responsive design (mobile-friendly)
- ✅ Form validation
- ✅ Success/error notifications
- ✅ Loading states
- ✅ Disabled fields for non-editable data
- ✅ Helpful placeholder text
- ✅ Password visibility toggle

### Data Management
- ✅ All data is editable (except email)
- ✅ Data persists in database
- ✅ Automatic data fetching on page load
- ✅ Real-time updates

### Security
- ✅ Authentication required
- ✅ Password hashing
- ✅ Secure photo upload
- ✅ Input validation

## Benefits

1. **Comprehensive Data Collection**: Captures all necessary client information
2. **Better Healthcare**: Doctors can see complete patient profiles
3. **Emergency Preparedness**: Emergency contact information readily available
4. **Demographics**: Educational and employment data for analytics
5. **Location-Based Services**: County and city information for service delivery
6. **Professional**: Modern, clean interface matching medical standards

## Next Steps

Clients should:
1. Complete their profile after first login
2. Keep emergency contact information up to date
3. Update profile when circumstances change
4. Use a strong password and change it periodically

The comprehensive profile ensures better healthcare delivery and emergency response!
