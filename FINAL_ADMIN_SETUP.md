# Final Admin Setup - Complete Guide

## Your Admin Credentials
- **Email**: `i1agency12@gmail.com`
- **Password**: `Kpavan63#`
- **Role**: Super Admin (full access)

## Step-by-Step Setup

### Step 1: Create Admin User in Supabase
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** button
3. Fill in exactly:
   - **Email**: `i1agency12@gmail.com`
   - **Password**: `Kpavan63#`
   - **Auto Confirm User**: ✅ (check this box)
4. Click **"Add User"**

### Step 2: Run the Complete Setup Script
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire content from `database/setup-admin-complete.sql`
3. Paste it in the SQL Editor
4. Click **"Run"**

The script will:
- ✅ Create helper functions
- ✅ Find your user automatically by email
- ✅ Add admin permissions
- ✅ Verify the setup

### Step 3: Test Admin Login
1. Go to your app: `http://localhost:3000/admin/login`
2. Login with:
   - **Email**: `i1agency12@gmail.com`
   - **Password**: `Kpavan63#`
3. You should be redirected to the admin dashboard

## What You Get
✅ **Full Admin Access** to:
- Product Management (Add/Edit/Delete)
- Order Management (View/Update Status)
- Customer Management (View/Email)
- Sales Analytics (Revenue/Stats)
- Settings & Admin Management

## Admin URLs
- **Admin Login**: `/admin/login`
- **Admin Dashboard**: `/admin`
- **Regular Login**: `/auth/login` (will auto-redirect admins)

## Troubleshooting

### If the script shows "User not found":
1. Make sure you created the user in Step 1
2. Double-check the email is exactly: `i1agency12@gmail.com`
3. Wait a few seconds and run the script again

### If login doesn't work:
1. Check browser console for errors
2. Verify the user was created in Authentication → Users
3. Run this query in SQL Editor to check:
   ```sql
   SELECT * FROM admin_users_view WHERE email = 'i1agency12@gmail.com';
   ```

### Quick Verification Query
Run this in Supabase SQL Editor to verify everything is set up:
```sql
SELECT 
  u.email as auth_email,
  au.email as admin_email,
  au.role,
  au.is_active,
  au.permissions
FROM auth.users u
LEFT JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'i1agency12@gmail.com';
```

## Success! 🎉
Once setup is complete, you'll have full admin access to manage your i1Fashion store with secure authentication and session management.