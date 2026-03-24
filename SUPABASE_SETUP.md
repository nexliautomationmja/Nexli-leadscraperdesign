# Supabase Setup Guide

## Overview

Your Nexli Lead Scraper now uses Supabase for:
- **User Authentication** - Secure login/signup
- **Database Storage** - Persistent lead, campaign, and template data
- **Profile Photos** - Upload and store profile images
- **Multi-device Sync** - Access your data from anywhere

No more data loss on refresh! Everything is saved permanently.

---

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Click "New Project"
5. Fill in:
   - **Project Name**: `nexli-lead-scraper` (or any name)
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose closest to you
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

---

## Step 2: Run the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the contents of `supabase-schema.sql` from this project
4. Paste into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this is correct!

This creates:
- `users` table (profiles)
- `leads` table (your scraped leads)
- `campaigns` table (email campaigns)
- `email_templates` table (reusable templates)
- `email_logs` table (email history)
- `profile-photos` storage bucket (profile images)
- Row-level security policies (your data is private!)

---

## Step 3: Get Your API Keys

1. In Supabase, go to **Settings** → **API** (left sidebar)
2. Find these two values:

### Project URL
```
https://your-project-id.supabase.co
```

### Anon/Public Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 4: Add Environment Variables

1. In your project root, create a `.env` file (or update existing one)
2. Add your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** Replace with your actual values from Step 3!

---

## Step 5: Test the App

1. Start your dev server:
```bash
npm run dev
```

2. Open the app in your browser

3. You should see the **Sign Up** page with:
   - Animated gradient background
   - Nexli logo
   - Sign In / Sign Up tabs

4. Create an account:
   - Enter your name, email, password
   - Click "Create Account"

5. Once logged in:
   - Go to **Settings** to see your profile
   - Upload a profile photo by clicking the camera icon
   - Scrape some leads
   - **Refresh the page** - your leads should still be there! ✅

---

## What's Changed

### Before (localStorage):
- ❌ Data disappeared on refresh
- ❌ No user accounts
- ❌ Single device only
- ❌ No profile photos

### After (Supabase):
- ✅ Data persists forever
- ✅ Secure authentication
- ✅ Access from any device
- ✅ Profile photo upload
- ✅ Multi-user support
- ✅ Real database with backups

---

## Features Now Available

### 1. User Profiles
- Upload profile photo (appears in Settings)
- Full name and email display
- Secure sign out

### 2. Persistent Data
- All leads saved to database
- Campaigns saved with full history
- Email templates synced
- Email logs stored
- Survives page refresh, browser close, computer restart

### 3. Multi-Device Sync
- Sign in on laptop → see leads
- Sign in on desktop → same leads
- All devices stay in sync

### 4. Security
- Row-level security (users only see their own data)
- Secure authentication
- Password encryption
- Private storage buckets

---

## Troubleshooting

### "Authentication error" on startup
- Make sure `.env` file exists in project root
- Check that `VITE_` prefix is included
- Restart dev server after changing `.env`

### "Error loading data"
- Verify SQL schema was run successfully
- Check browser console for errors
- Make sure API key matches project

### Profile photo won't upload
- Check that storage bucket was created (Step 2)
- Verify file is an image (JPG, PNG, etc.)
- Try a smaller image (< 5MB)

### Leads not saving
- Open browser dev tools → Network tab
- Check for red errors
- Verify you're logged in

---

## Next Steps

Your app is now production-ready with:
- ✅ Authentication
- ✅ Database storage
- ✅ Profile management
- ✅ All 8 advanced features working

Optional enhancements:
- Deploy to Vercel (free hosting)
- Set up custom domain
- Add email verification
- Enable real-time subscriptions
- Set up database backups

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify `.env` file has correct values
3. Make sure SQL schema ran without errors
4. Restart dev server

The data persistence issue is now **completely solved**! 🎉
