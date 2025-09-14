# i1Fashion Admin Panel Setup Guide

This guide will help you set up the admin authentication system with proper session management and local storage handling.

## Features Fixed

✅ **Admin Authentication**: Separate admin login with role-based access  
✅ **Session Management**: Proper session handling with 7-day expiry  
✅ **Local Storage**: Secure storage with encryption for sensitive data  
✅ **Auto Sign-out**: Automatic sign-out when session expires  
✅ **Admin Dashboard**: Full-featured admin panel with product/order management  
✅ **Role-based Access**: Different permission levels for admin users  

## Setup Instructions

### 1. Database Setup

First, run the main database schema:

```sql
-- Run this in Supabase SQL Editor
-- File: database/complete-ecommerce-schema.sql
```

Then set up admin users:

```sql
-- Run this in Supabase SQL Editor  
-- File: database/setup-admin-users.sql
```

### 2. Create Admin Users

1. **Go to Supabase Dashboard** → Authentication → Users
2. **Create new users** with admin emails (e.g., admin@i1fashion.com)
3. **Note the User IDs** from the users table
4. **Update the SQL script** `database/setup-admin-users.sql` with real user IDs
5. **Run the updated script** in Supabase SQL Editor

### 3. Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Admin Access URLs

- **Admin Login**: `/admin/login`
- **Admin Dashboard**: `/admin`
- **Regular Login**: `/auth/login`

## Admin User Management

### Adding New Admin Users

```sql
-- Use this function to add new admin users
SELECT add_admin_user(
  'user-uuid-from-auth-users', 
  'admin@example.com', 
  'Admin Full Name', 
  'admin'  -- Role: super_admin, admin, manager, staff
);
```

### Admin Roles & Permissions

| Role | Products | Orders | Customers | Analytics | Settings | Admin Management |
|------|----------|--------|-----------|-----------|----------|------------------|
| **super_admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **manager** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **staff** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Managing Admin Users

```sql
-- View all admin users
SELECT * FROM admin_users_view;

-- Deactivate an admin user
UPDATE admin_users SET is_active = false WHERE email = 'admin@example.com';

-- Update admin permissions
UPDATE admin_users 
SET permissions = '{"products": true, "orders": false, "customers": true, "analytics": false, "settings": false, "admin_management": false}' 
WHERE email = 'admin@example.com';
```

## Authentication Flow

### Regular Users
1. Login at `/auth/login`
2. System checks if user is admin
3. If admin → redirect to `/admin`
4. If regular user → redirect to `/products`

### Admin Users
1. Can login at `/auth/login` OR `/admin/login`
2. Admin login page has enhanced security
3. Validates admin status before allowing access
4. Redirects to admin dashboard

## Session Management

### Features
- **7-day session expiry** (configurable)
- **Automatic session refresh** on token refresh
- **Session validation** every 5 minutes
- **Secure local storage** with encryption
- **Complete sign-out** clears all storage

### Sign-out Process
When admin clicks "Sign Out":
1. Signs out from Supabase Auth
2. Clears all local storage data
3. Resets application state
4. Redirects to admin login

## Security Features

### Data Encryption
- User email, name, and phone are encrypted in local storage
- Admin session data is securely stored
- Automatic cleanup on sign-out

### Access Control
- Admin routes protected by authentication check
- Role-based permissions for different admin levels
- Session expiry validation

### Storage Management
- Secure storage implementation
- Automatic cleanup of expired sessions
- Protection against XSS attacks

## Troubleshooting

### Admin Can't Access Dashboard
1. Check if user exists in `admin_users` table
2. Verify `is_active = true`
3. Confirm user_id matches auth.users table
4. Check browser console for errors

### Session Issues
1. Clear browser local storage
2. Check session expiry settings
3. Verify Supabase connection
4. Check network requests in dev tools

### Login Redirects
1. Regular users go to `/products`
2. Admin users go to `/admin`
3. Check admin_users table for user classification

## Database Queries for Debugging

```sql
-- Check admin users
SELECT au.*, u.email as auth_email 
FROM admin_users au 
LEFT JOIN auth.users u ON au.user_id = u.id;

-- Check user authentication
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'admin@example.com';

-- Check admin permissions
SELECT email, role, permissions, is_active 
FROM admin_users 
WHERE email = 'admin@example.com';
```

## Admin Dashboard Features

### Dashboard Tab
- Overview statistics
- Recent orders
- Quick metrics

### Products Management
- Add/Edit/Delete products
- Image upload to Supabase Storage
- Stock management
- Category filtering

### Order Management
- View all orders
- Update order status
- Customer information
- Order details

### Sales Analytics
- Revenue tracking
- Low stock alerts
- Performance metrics

### User Control
- Customer management
- Email communication
- User statistics

## Next Steps

1. **Test the admin login** with created admin users
2. **Verify session management** by checking expiry
3. **Test sign-out functionality** to ensure clean logout
4. **Add more admin users** as needed
5. **Customize permissions** based on your requirements

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database setup is complete
3. Ensure environment variables are correct
4. Test with a fresh browser session

The admin system is now fully functional with proper authentication, session management, and secure local storage handling!