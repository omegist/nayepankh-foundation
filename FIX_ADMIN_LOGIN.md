# URGENT FIX - Admin Login Issue

## Problem
The auth page is showing "Create admin" even though an admin already exists. This is because anonymous (not logged in) users cannot query the `user_roles` table due to RLS policies.

## Solution
Apply the new migration that creates a public function to check if admin exists.

---

## Step 1: Apply the Migration to Supabase

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Migration: Allow anonymous users to check if admin exists
-- This is safe because it only returns a boolean, not any user data

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;
```

5. Click **Run** button
6. Wait for "Success. No rows returned" message

### Option B: Via Supabase CLI

If you have Supabase CLI installed:

```bash
cd d:\new
supabase db push
```

This will apply the migration file:
`supabase/migrations/20260616000000_admin_exists_function.sql`

---

## Step 2: Restart Your Dev Server

```bash
npm run dev
```

---

## Step 3: Test the Fix

1. Visit http://localhost:5173/auth
2. You should now see **"Sign in"** form (not "Create admin")
3. Enter your existing admin email and password
4. Click "Sign in"
5. You should be logged in successfully

---

## What This Does

The migration creates a **security definer function** that:
- Returns `true` if ANY admin exists in the database
- Returns `false` if NO admin exists
- Can be called by anonymous (not logged in) users
- Is SAFE because it only returns a boolean, not user data

---

## Verification

After applying the migration, you can test it works:

1. Open your browser console (F12)
2. Go to http://localhost:5173/auth
3. In the console, run:
```javascript
const { data } = await supabase.rpc('admin_exists');
console.log('Admin exists:', data);
```
4. Should see: `Admin exists: true`

---

## Alternative Quick Fix (If Migration Fails)

If you can't apply the migration immediately, temporarily edit `src/routes/auth.tsx`:

Change line 30-39 to:
```typescript
const checkAdminExists = async () => {
  // Temporary: Always show sign-in for existing users
  setAdminExists(true);
};
```

This will always show the sign-in form until you apply the proper migration.

---

## Need Help?

If the migration doesn't work:
1. Check Supabase dashboard → SQL Editor for error messages
2. Verify you're connected to the correct project
3. Make sure your Supabase project is active
4. Try the alternative quick fix above

---

## Files Changed

- ✅ `supabase/migrations/20260616000000_admin_exists_function.sql` - Created
- ✅ `src/routes/auth.tsx` - Updated to use RPC call
