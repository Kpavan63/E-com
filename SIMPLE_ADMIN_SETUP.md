# Simple One Admin Setup Guide

## Quick Setup for Single Admin User

### Step 1: Create Admin User in Supabase
1. Go to your **Supabase Dashboard**
2. Click **Authentication** → **Users**
3. Click **"Add User"** button
4. Fill in:
   - **Email**: `admin@i1fashion.com`
   - **Password**: `admin123456` (change this later!)
5. Click **"Add User"**
6. **Copy the User ID** (UUID) from the users table

### Step 2: Update Database Script
1. Open `database/setup-admin-users.sql`
2. Find this line:
   ```sql
   ('YOUR_USER_ID_HERE', 'admin@i1fashion.com', 'Admin User', 'super_admin',
   ```
3. Replace `YOUR_USER_ID_HERE` with the actual User ID you copied
4. Save the file

### Step 3: Run Database Script
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire content of `database/setup-admin-users.sql`
3. Click **"Run"**
4. You should see "Admin users setup complete!" message

### Step 4: Test Admin Login
1. Go to your app: `http://localhost:3000/admin/login`
2. Login with:
   - **Email**: `admin@i1fashion.com`
   - **Password**: `admin123456`
3. You should be redirected to the admin dashboard

## That's it! 🎉

Your single admin user is now set up with full permissions to:
- ✅ Manage Products
- ✅ Manage Orders  
- ✅ View Customers
- ✅ View Analytics
- ✅ Access Settings
- ✅ Manage Admin Users

## Admin Access URLs
- **Admin Login**: `/admin/login`
- **Admin Dashboard**: `/admin`

## Change Admin Password
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find your admin user
3. Click the **"..."** menu → **"Reset Password"**
4. Set a secure password

## Troubleshooting
If admin login doesn't work:
1. Check if the User ID was correctly replaced in the SQL script
2. Verify the script ran successfully in Supabase SQL Editor
3. Check browser console for any errors
4. Try clearing browser cache/localStorage

## Quick Check
Run this in Supabase SQL Editor to verify admin setup:
```sql
SELECT * FROM admin_users_view;
```

You should see your admin user listed with `is_active = true`.