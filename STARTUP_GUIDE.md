# 🚀 NayePankh Foundation - Volunteer Registration System

**Status:** ✅ Fully Lovable-Free & Production Ready

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

### Production Build
```bash
npm run build
npm run preview
```

## Project Stack

- **Frontend:** React 19 + TanStack Router + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Row-Level Security)
- **Validation:** Zod + React Hook Form
- **Charts:** Recharts
- **Notifications:** Sonner
- **Icons:** Lucide React

## Features

### Public Pages
- **Landing Page** (`/`) - Volunteer registration form
  - Multi-step form with validation
  - Generates unique Volunteer ID on submission
  - Responsive design for all devices

### Admin Pages
- **Login** (`/auth`) - Admin authentication
  - First account created becomes admin
  - Email & password authentication via Supabase

- **Dashboard** (`/admin`)
  - 4 summary stat cards (Total, Active, Pending, Last 30 days)
  - 3 interactive charts (Interests pie, Availability bar, Time trend line)
  - Searchable, filterable, sortable volunteer table
  - CSV export functionality
  - Responsive layout for mobile/tablet/desktop

- **Volunteer Detail** (`/admin/:id`)
  - View complete volunteer information
  - Update status (Pending → Contacted → Active → Inactive)
  - Archive or delete records
  - Back navigation to dashboard

## Environment Configuration

Create a `.env` file in the project root with Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

All keys are public and RLS-protected. No secrets required in .env.

## Database Schema

### volunteers table
- `id` - UUID primary key
- `volunteer_code` - Unique alphanumeric code (generated)
- `full_name` - Volunteer's full name
- `email` - Contact email
- `phone` - Contact phone
- `age` - Age in years
- `address` - Full address
- `areas_of_interest` - JSON array of interest areas
- `availability_days` - JSON array of available days
- `availability_hours` - Time availability string
- `prior_experience` - Optional text
- `heard_from` - How they found us
- `status` - Pending | Contacted | Active | Inactive | Archived
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### Row-Level Security (RLS)
- **Public**: Can insert new volunteer records
- **Authenticated (Admin)**: Can read, update, delete all records
- **Role-based**: Admin role determined by Supabase Auth trigger

## File Structure

```
src/
├── routes/                          # TanStack Router pages
│   ├── __root.tsx                   # Root layout & error boundaries
│   ├── index.tsx                    # Public registration form
│   ├── auth.tsx                     # Admin sign in/up
│   └── _authenticated/
│       ├── route.tsx                # Auth guard
│       ├── admin.tsx                # Admin shell/header
│       ├── admin.index.tsx          # Dashboard
│       └── admin.$id.tsx            # Volunteer detail
├── components/
│   └── ui/                          # shadcn/ui components (40+)
├── integrations/
│   └── supabase/                    # Supabase client & types
├── lib/
│   ├── csv.ts                       # CSV export utility
│   ├── utils.ts                     # Tailwind cn() helper
│   ├── error-page.ts                # Error page HTML
│   └── lovable-error-reporting.ts   # Error logging (no-op)
├── hooks/
│   └── use-mobile.tsx               # Mobile breakpoint hook
├── main.tsx                         # React entry point
├── router.tsx                       # Router configuration
├── routeTree.gen.ts                 # Auto-generated route tree
└── style.css                        # Tailwind & global styles
```

## Key Dependencies

- `@tanstack/react-router` - File-based routing
- `@tanstack/react-query` - Server state management
- `@supabase/supabase-js` - Backend & auth
- `react-hook-form` + `zod` - Form validation
- `recharts` - Data visualization
- `@radix-ui/*` - Accessible UI primitives
- `tailwindcss` - Utility-first CSS
- `lucide-react` - Icons
- `sonner` - Toast notifications

## Code Quality

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety
- **Tailwind CSS** - Responsive design

Run checks:
```bash
npm run lint      # ESLint
npm run format    # Prettier
```

## Build Output

**Production Build Stats:**
- Bundle size: ~1.3 MB (360 KB gzipped)
- Build time: <1 second
- All assets minified & optimized

## Support & Troubleshooting

### Dev Server Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Build Issues
```bash
npm run build -- --verbose
```

### Environment Issues
- Verify Supabase credentials in `.env`
- Check browser console for errors
- Ensure Supabase project is active

## Deployment

This is a standard Vite + React application. Deploy to:
- **Vercel** - Recommended, auto-deployment from Git
- **Netlify** - Connect to your repository
- **AWS S3 + CloudFront** - Manual upload
- **Traditional hosting** - Build and serve `dist/` folder

### Deployment Command
```bash
npm run build
# Upload `dist/` folder to your hosting
```

## Security Notes

- ✅ All database access is RLS-protected
- ✅ Public/private keys are Supabase managed
- ✅ No credentials stored in code
- ✅ Authentication via Supabase (industry standard)
- ✅ HTTPS only for production
- ✅ CORS configured via Supabase

## License

This project is part of NayePankh Foundation.

---

**Last Updated:** 2026  
**Status:** Production Ready - No Lovable Dependencies
