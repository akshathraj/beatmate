# 🚀 Beatmate Supabase Integration Setup Guide

This guide will help you set up Supabase for production-ready Beatmate deployment with Google Sign-In and per-user file storage.

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ Project URL: `https://qecsdctcizxlxqcmgriu.supabase.co`
- ✅ Supabase credentials saved in `.env`

---

## 🔧 Step 1: Add Supabase Credentials to .env

Update your `.env` file in `beatmate_backend/` directory:

```bash
# Existing API Keys
GEMINI_API_KEY=your_gemini_api_key
MUSICGPT_API_KEY=your_musicgpt_api_key
MUSICGPT_WEBHOOK_URL=http://localhost:8000/api/webhook/musicgpt
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# Supabase Configuration (NEWLY ADDED)
SUPABASE_URL=https://qecsdctcizxlxqcmgriu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY3NkY3RjaXp4bHhxY21ncml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTU1NjQsImV4cCI6MjA3ODk3MTU2NH0.VBAzt6qiILd4JhhuIbLbh858iKG8Rp0Tc5yar2aqU0Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY3NkY3RjaXp4bHhxY21ncml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM5NTU2NCwiZXhwIjoyMDc4OTcxNTY0fQ.iLGq-9zJ1dtf5hKl3iaVH-3NPtU9UHxQLUJ7ywVvl64
```

---

## 📊 Step 2: Set Up Database Schema

1. **Go to Supabase SQL Editor:**
   - Visit: https://qecsdctcizxlxqcmgriu.supabase.co/project/_/sql

2. **Run the Database Schema:**
   - Open `beatmate_backend/supabase_schema.sql`
   - Copy the entire content
   - Paste into Supabase SQL Editor
   - Click **"Run"**

This will create:
- ✅ `user_profiles` table
- ✅ `user_songs` table
- ✅ `user_videos` table
- ✅ Row Level Security (RLS) policies
- ✅ Automatic triggers

---

## 🗂️ Step 3: Set Up Storage Buckets

1. **Go to Supabase SQL Editor** (same as above)

2. **Run the Storage Setup:**
   - Open `beatmate_backend/supabase_storage.sql`
   - Copy the entire content
   - Paste into Supabase SQL Editor
   - Click **"Run"**

This will create:
- ✅ `user-songs` bucket (private)
- ✅ `user-lyrics` bucket (private)
- ✅ `user-videos` bucket (private)
- ✅ `user-album-art` bucket (private)
- ✅ `backgrounds` bucket (public)
- ✅ Storage RLS policies

---

## 🔑 Step 4: Configure Google OAuth

### 4.1: Get Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com

2. **Create/Select a Project**

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add Authorized redirect URIs:
     ```
     https://qecsdctcizxlxqcmgriu.supabase.co/auth/v1/callback
     ```
   - Click "Create"
   - **Copy the Client ID and Client Secret**

### 4.2: Configure Google Provider in Supabase

1. **Go to Supabase Authentication Settings:**
   - Visit: https://qecsdctcizxlxqcmgriu.supabase.co/project/_/auth/providers

2. **Enable Google Provider:**
   - Find "Google" in the list
   - Toggle it to "Enabled"
   - Paste your **Google Client ID**
   - Paste your **Google Client Secret**
   - Click "Save"

### 4.3: Update Redirect URLs (Important!)

In Google Cloud Console, add these additional redirect URLs:
```
http://localhost:5173/auth/callback
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback  (for production)
```

---

## 🖥️ Step 5: Install Backend Dependencies

```bash
cd beatmate_backend

# Activate your virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install new dependencies
pip install -r requirements.txt
```

New packages installed:
- ✅ `supabase>=2.0.0`
- ✅ `postgrest-py>=0.10.0`

---

## ⚙️ Step 6: Update Backend Code

The backend has been updated with:
- ✅ Supabase service layer (`app/services/supabase_service.py`)
- ✅ Authentication middleware (`app/middleware/auth.py`)
- ✅ Supabase storage utility (`app/utils/supabase_storage.py`)
- ✅ New Supabase-enabled API (`app/api_supabase.py`)

**To activate the new Supabase API:**

Update `app/main.py` to use `api_supabase.py` instead of `api.py`:

```python
# Change this line:
from app.api import router

# To this:
from app.api_supabase import router
```

---

## 🌐 Step 7: Frontend Setup

### 7.1: Add Supabase Credentials to Frontend

Create a `.env` file in `beatmate_frontend/`:

```bash
VITE_SUPABASE_URL=https://qecsdctcizxlxqcmgriu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY3NkY3RjaXp4bHhxY21ncml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTU1NjQsImV4cCI6MjA3ODk3MTU2NH0.VBAzt6qiILd4JhhuIbLbh858iKG8Rp0Tc5yar2aqU0Q
VITE_API_URL=http://localhost:8000/api
```

### 7.2: Install Frontend Dependencies

```bash
cd beatmate_frontend
npm install @supabase/supabase-js
```

---

## 🧪 Step 8: Test the Setup

### 8.1: Start Backend

```bash
cd beatmate_backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 8.2: Start Frontend

```bash
cd beatmate_frontend
npm run dev
```

### 8.3: Test Authentication

1. Open http://localhost:5173
2. Click "Sign in with Google"
3. Complete Google authentication
4. You should be redirected to the dashboard

### 8.4: Test File Upload

1. Generate a new song
2. Check Supabase Storage to see the file uploaded
3. Check Supabase Database to see the record created

---

## 🔍 Verify Setup

### Check Database Tables

```sql
-- Run in Supabase SQL Editor
SELECT * FROM user_profiles;
SELECT * FROM user_songs;
SELECT * FROM user_videos;
```

### Check Storage Buckets

1. Go to: https://qecsdctcizxlxqcmgriu.supabase.co/project/_/storage/buckets
2. You should see:
   - ✅ user-songs
   - ✅ user-lyrics
   - ✅ user-videos
   - ✅ user-album-art
   - ✅ backgrounds

### Check Authentication

1. Go to: https://qecsdctcizxlxqcmgriu.supabase.co/project/_/auth/users
2. After signing in, you should see your user listed

---

## 🚨 Troubleshooting

### Issue: Google Sign-In Fails

**Solution:**
- Verify redirect URLs in Google Cloud Console
- Check Google Client ID/Secret in Supabase
- Clear browser cookies and try again

### Issue: "Invalid authentication token"

**Solution:**
- Check if SUPABASE_SERVICE_ROLE_KEY is set in .env
- Restart backend server
- Clear localStorage in browser

### Issue: "Permission denied" when uploading files

**Solution:**
- Verify storage policies are created (run supabase_storage.sql)
- Check if user is authenticated
- Verify bucket names in code match Supabase

### Issue: Backend can't connect to Supabase

**Solution:**
- Check SUPABASE_URL and keys in .env
- Run `pip install supabase` to ensure SDK is installed
- Check internet connection

---

## 🎉 Migration from Local Storage

If you have existing files in `beatmate_backend/files/`, you can migrate them to Supabase:

1. **Create a test user** by signing in with Google
2. **Run the migration script** (will be provided separately)
3. **Verify files in Supabase Storage**

---

## 📝 Key Changes Summary

### Backend Changes
- ✅ All endpoints now require authentication
- ✅ Files stored in Supabase Storage (not local)
- ✅ Metadata stored in Supabase Database
- ✅ Per-user isolation with RLS

### Frontend Changes
- ✅ Google Sign-In only (no username/password)
- ✅ JWT tokens sent with all API requests
- ✅ Protected routes (redirect to login if not authenticated)
- ✅ User profile from Supabase Auth

---

## 🔒 Security Features

- ✅ **Row Level Security (RLS)** - Users can only access their own data
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Storage Policies** - File access restricted by user
- ✅ **Google OAuth** - No password storage
- ✅ **HTTPS Required** - For production deployment

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

---

## 🎯 Next Steps

After setup:
1. ✅ Test all features (song generation, video creation, etc.)
2. ✅ Upload background images to `backgrounds` bucket
3. ✅ Customize frontend theme/branding
4. ✅ Deploy to production (Vercel/Netlify for frontend, Railway/Render for backend)

---

**Need Help?** Check the troubleshooting section or refer to Supabase documentation.

**Ready for Production!** 🚀

