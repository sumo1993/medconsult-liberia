# Role Display in Dashboards

## ✅ What Was Added

Each dashboard now displays the user's role in the header with a colored badge.

### **Consultant/Researcher Dashboard**
- **Location**: `/dashboard/consultant`
- **Display**: 
  - Badge shows "Researcher" (teal) or "Consultant" (blue)
  - Subtitle shows "Researcher Portal" or "Consultant Portal"
- **Users**: Both consultants and researchers use this dashboard

### **Management Dashboard**
- **Location**: `/dashboard/management`
- **Display**:
  - Badge shows "CEO" for management role (blue)
  - Subtitle shows "Management Portal"
- **Users**: CEO/Management users

### **Visual Examples**

**Researcher:**
```
Dashboard [Researcher]
Researcher Portal
```

**Consultant:**
```
Dashboard [Consultant]
Consultant Portal
```

**CEO/Management:**
```
Dashboard [CEO]
Management Portal
```

## Badge Colors

- **Researcher**: Teal background (`bg-teal-100 text-teal-800`)
- **Consultant**: Blue background (`bg-blue-100 text-blue-800`)
- **Management/CEO**: Blue background (`bg-blue-100 text-blue-800`)
- **Admin**: Red background (`bg-red-100 text-red-800`)
- **Accountant**: Purple background (`bg-purple-100 text-purple-800`)
- **Client**: Green background (`bg-green-100 text-green-800`)

## How It Works

1. The dashboard fetches the user's profile from `/api/profile`
2. The profile includes the `role` field
3. The header dynamically displays:
   - A colored badge with the role name
   - A subtitle with the portal name
4. The display updates automatically based on the user's role

## Files Modified

- `/app/dashboard/consultant/page.tsx` - Added role badge and dynamic portal name
- `/app/dashboard/management/page.tsx` - Added role badge with CEO display

## Testing

To see the role display:

1. **For Researcher**:
   - Update a user's role to 'researcher' in Admin Dashboard
   - Login as that user
   - You'll see "Researcher" badge and "Researcher Portal"

2. **For Consultant**:
   - Login as a consultant user
   - You'll see "Consultant" badge and "Consultant Portal"

3. **For Management**:
   - Login as a management user
   - You'll see "CEO" badge and "Management Portal"

## Benefits

✅ Users can immediately see their role  
✅ Clear distinction between Researcher and Consultant  
✅ Professional badge display  
✅ Consistent with admin user management colors  
✅ Mobile-responsive design  
