# 🚀 NEW SUPABASE PROJECT SETUP

## ✅ Credentials Updated

Your new Supabase credentials have been integrated:
- **Project URL:** https://ozpljocdmgaocdvhucdv.supabase.co
- **Project ID:** ozpljocdmgaocdvhucdv
- **Status:** Ready to go!

---

## 📋 STEP-BY-STEP SETUP

### Step 1: Run the Database Migration

1. **Open your Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/ozpljocdmgaocdvhucdv
   - (Or click "SQL Editor" from your project dashboard)

2. **Open SQL Editor:**
   - Click **"SQL Editor"** in the left sidebar (icon looks like `</>`)
   - Click **"New Query"** button at the top

3. **Copy the Migration SQL:**
   - Open the file: `d:\new\COMPLETE_MIGRATION.sql`
   - Copy the ENTIRE contents (all 200+ lines)

4. **Paste and Run:**
   - Paste into the SQL Editor
   - Click the green **"RUN"** button (or press Ctrl+Enter)
   - Wait 5-10 seconds

5. **Verify Success:**
   - You should see: **"Success. No rows returned"** or similar
   - Check the Table Editor to see `volunteers` and `user_roles` tables created

---

### Step 2: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C if running)
npm run dev
```

---

### Step 3: Create Your First Admin Account

1. **Visit:** http://localhost:5173/auth
2. **You'll see:** "Create the first admin account to get started" with a warning badge
3. **Fill in:**
   - Email: (your email)
   - Password: (min 6 characters)
4. **Click:** "Create admin account"
5. **Result:** Automatically logged in → redirected to /admin

---

### Step 4: Verify Everything Works

**Dashboard should show:**
- ✅ Total volunteers: 12 (dummy data)
- ✅ Active: Some volunteers marked as active
- ✅ Pending: Some volunteers marked as pending
- ✅ 3 charts with data
- ✅ Searchable table with 12 volunteers

**Try these features:**
- Search for a volunteer name
- Filter by interest or status
- Click on a volunteer ID to view details
- Update a volunteer's status
- Export CSV

---

## 🎯 What Was Set Up

### Database Tables
✅ **user_roles** - Admin and user roles  
✅ **volunteers** - Volunteer registrations  

### Functions
✅ **has_role()** - Check if user has admin role  
✅ **admin_exists()** - Check if any admin exists (for auth page)  
✅ **set_updated_at()** - Auto-update timestamps  

### Triggers
✅ **on_auth_user_created_bootstrap** - First user becomes admin automatically  
✅ **volunteers_set_updated_at** - Update timestamp on volunteer changes  

### Security (RLS Policies)
✅ Anyone can insert volunteers (public registration)  
✅ Only admins can read/update/delete volunteers  
✅ Users can view their own roles  
✅ Anonymous users can check if admin exists  

### Sample Data
✅ 12 dummy volunteers with varied:
- Names, emails, phones
- Ages, addresses
- Interests (education, healthcare, fundraising, events, social media)
- Availability days and hours
- Prior experience
- Different statuses (Pending, Contacted, Active, Inactive)
- Registration dates spread over 90 days

---

## 🔧 All Code Changes Made

### 1. Updated `.env` File
```
✅ New Supabase URL
✅ New Anon Key
✅ New Project ID
```

### 2. Updated `src/routes/auth.tsx`
```
✅ Uses admin_exists() RPC function
✅ Shows "Create admin" only if no admin exists
✅ Shows "Sign in" once admin is created
✅ First user gets admin role automatically
✅ Subsequent signups don't get admin role
```

### 3. Created Migration Files
```
✅ COMPLETE_MIGRATION.sql - All-in-one setup file
✅ Contains all tables, functions, triggers, policies, and seed data
```

---

## 🎉 What You Get

After setup, you'll have:
- ✅ Fresh database with proper structure
- ✅ 12 sample volunteers for testing
- ✅ Admin account ready to create
- ✅ All security policies in place
- ✅ All features working perfectly
- ✅ No Lovable dependencies

---

## 🆘 Troubleshooting

### If SQL Migration Fails

**Error: "relation already exists"**
- Some tables might already exist
- Drop existing tables first or create a brand new project

**Error: "permission denied"**
- Make sure you're logged into the correct Supabase account
- Verify you're on the project: ozpljocdmgaocdvhucdv

**Error: "function does not exist"**
- Copy the ENTIRE migration file, don't skip any sections

### If Auth Page Shows Error

**"admin_exists() does not exist"**
- Migration didn't complete successfully
- Re-run the COMPLETE_MIGRATION.sql

**Still showing "Create admin" after you created one**
- Refresh the page (Ctrl+R)
- Check browser console (F12) for errors
- Verify migration ran successfully in Supabase

### If Dashboard Shows Empty

**No volunteers visible**
- Migration didn't complete fully
- Re-run the COMPLETE_MIGRATION.sql
- Check if you're logged in as admin

---

## 📝 Next Steps After Setup

1. ✅ Test the public registration form at http://localhost:5173/
2. ✅ Register a real volunteer to test the flow
3. ✅ Test all dashboard features (search, filter, export)
4. ✅ Test volunteer detail page
5. ✅ Test status updates
6. ✅ Deploy to production when ready

---

## 🎯 Quick Command Reference

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint
```

---

**Ready to go! Start with Step 1 above.** 🚀
