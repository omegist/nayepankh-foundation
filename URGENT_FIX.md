# 🚨 URGENT FIX - RLS Issues

## Problem
1. Admin account creation doesn't redirect to dashboard
2. Public volunteer registration shows RLS policy violation

## Solution - Run This SQL NOW

### Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/ozpljocdmgaocdvhucdv/sql

### Step 2: Copy and Run This SQL

Open file: `FIXED_COMPLETE_MIGRATION.sql`

**OR copy this shortened version:**

```sql
-- Fix RLS policies for volunteer registration
DROP POLICY IF EXISTS "Public can register" ON public.volunteers;
DROP POLICY IF EXISTS "Anyone can insert volunteers" ON public.volunteers;

CREATE POLICY "Anyone can insert volunteers" 
ON public.volunteers 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Make sure grants are correct
GRANT INSERT ON public.volunteers TO anon;
GRANT INSERT ON public.volunteers TO authenticated;

SELECT 'Fix applied!' as status;
```

### Step 3: Restart Dev Server

```bash
# Press Ctrl+C to stop
npm run dev
```

### Step 4: Test Again

1. **Test Public Registration:**
   - Go to: http://localhost:5173/
   - Fill out volunteer form
   - Submit
   - Should work without RLS error

2. **Test Admin Creation:**
   - Go to: http://localhost:5173/auth
   - Create admin account
   - Should redirect to dashboard
   - Check browser console (F12) for any errors

---

## If Still Having Issues

### Option A: Fresh Database

Run the complete fresh migration:
1. Copy ALL of `FIXED_COMPLETE_MIGRATION.sql`
2. Paste in Supabase SQL Editor
3. Click RUN
4. This will drop and recreate everything properly

### Option B: Manual Steps

1. **Delete existing admin account:**
   - Go to Supabase Dashboard → Authentication → Users
   - Delete any existing users

2. **Check Table Permissions:**
   - Go to: Table Editor → volunteers → Settings
   - Ensure RLS is enabled
   - Check policies exist

3. **Re-run migration:**
   - Use `FIXED_COMPLETE_MIGRATION.sql`

---

## Debug Info

Open browser console (F12) on:
- http://localhost:5173/auth (when creating admin)
- http://localhost:5173/ (when registering volunteer)

Look for errors like:
- "new row violates row-level security policy"
- "permission denied"
- "function does not exist"

Share these errors if still having issues.

---

## Quick Verification

Run this in Supabase SQL Editor to check setup:

```sql
-- Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('volunteers', 'user_roles');

-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created_bootstrap';

-- Check if functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('admin_exists', 'has_role', 'handle_new_user_admin_bootstrap');
```

Should return:
- 5 policies (1 for user_roles, 4 for volunteers)
- 1 trigger (enabled)
- 3 functions
