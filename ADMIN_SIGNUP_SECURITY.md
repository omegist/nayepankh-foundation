# Admin Signup Security Update

## Changes Made

The `/auth` page has been updated to improve security and prevent unauthorized admin access.

### What Changed

1. **Dynamic UI Based on Admin Existence**
   - The page now checks if an admin account already exists in the database
   - Shows different UI based on whether this is the first-time setup or not

2. **First-Time Setup (No Admin Exists)**
   - Shows a single form for creating the first admin account
   - Displays a clear warning badge explaining this is the first admin
   - Button says "Create admin account"
   - After creation, user is automatically signed in and redirected to /admin

3. **Normal Operation (Admin Exists)**
   - Only shows the "Sign in" form
   - No "Create admin" tab visible
   - No way to create admin accounts through the UI
   - Description updated to say "Sign in to manage volunteer registrations"

4. **Security Improvements**
   - Database trigger ensures only the first user gets admin role automatically
   - Any subsequent signups through the auth page (if they somehow access it) will NOT receive admin privileges
   - Clear messaging to users about what they're creating

### Technical Implementation

```typescript
// Check if admin exists on page load
const checkAdminExists = async () => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("role", "admin")
    .limit(1);
  
  if (!error) {
    setAdminExists(data && data.length > 0);
  }
};
```

### User Experience

**First Visit (No Admin):**
1. Page loads with "Loading..." message
2. Checks database for existing admin
3. Shows "First-time setup" warning badge
4. User creates admin account
5. Automatically signed in → redirected to /admin

**Subsequent Visits (Admin Exists):**
1. Page loads with "Loading..." message
2. Checks database for existing admin
3. Shows only "Sign in" form
4. No create account option visible
5. User signs in → redirected to /admin

### Database Security

The database trigger (`handle_new_user_admin_bootstrap`) ensures:
- Only the FIRST user in the system gets admin role
- All subsequent users get no role by default
- Admins must manually grant roles to other users (if needed)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only grant admin if NO admin exists yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
```

### Visual Feedback

**First-Time Setup Badge:**
```
┌─────────────────────────────────────────┐
│ ⚠ First-time setup                      │
│ You're creating the first admin account.│
│ This account will have full access to   │
│ manage volunteers.                       │
└─────────────────────────────────────────┘
```

**Success Messages:**
- First admin: "Admin account created - You are the first admin. Signing you in..."
- Subsequent signup (if somehow accessed): "Account created - Your account has been created. Please contact an admin for access."

### Files Modified

- `src/routes/auth.tsx` - Complete rewrite of authentication UI logic

### Testing Checklist

- [x] First visit shows create admin form
- [x] After admin creation, page shows sign in form on refresh
- [x] Sign in form works correctly
- [x] First admin gets redirected to /admin
- [x] Subsequent signups don't get admin access
- [x] Loading state displays correctly
- [x] Error messages display properly
- [x] Success toasts show correct messages

### Benefits

1. **Security**: No accidental admin privilege escalation
2. **Clarity**: Users know exactly what they're creating
3. **UX**: Clean, single-purpose interface per scenario
4. **Safety**: Database-level protection via trigger
5. **Maintainability**: Clear code with conditional rendering

### Deployment Notes

No database changes required - existing trigger already handles this logic.
Simply deploy the updated `auth.tsx` file.
