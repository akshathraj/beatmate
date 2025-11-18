# 🚀 Quick Start - Beatmate Supabase Integration

## ⚡ 5-Minute Setup Checklist

Follow these steps in order to get your Beatmate application running with Supabase:

---

### ✅ Step 1: Environment Variables (2 minutes)

#### Backend `.env`
**File:** `beatmate_backend/.env`

Add these lines (or create the file if it doesn't exist):
```bash
SUPABASE_URL=https://qecsdctcizxlxqcmgriu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY3NkY3RjaXp4bHhxY21ncml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTU1NjQsImV4cCI6MjA3ODk3MTU2NH0.VBAzt6qiILd4JhhuIbLbh858iKG8Rp0Tc5yar2aqU0Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY3NkY3RjaXp4bHhxY21ncml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM5NTU2NCwiZXhwIjoyMDc4OTcxNTY0fQ.iLGq-9zJ1dtf5hKl3iaVH-3NPtU9UHxQLUJ7ywVvl64
```

#### Frontend `.env`
**File:** `beatmate_frontend/.env` (create this file)

```bash
VITE_SUPABASE_URL=https://qecsdctcizxlxqcmgriu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY3NkY3RjaXp4bHhxY21ncml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTU1NjQsImV4cCI6MjA3ODk3MTU2NH0.VBAzt6qiILd4JhhuIbLbh858iKG8Rp0Tc5yar2aqU0Q
VITE_API_URL=http://localhost:8000/api
```

---

### ✅ Step 2: Run SQL Scripts (1 minute)

1. **Open Supabase SQL Editor:**
   ```
   https://qecsdctcizxlxqcmgriu.supabase.co/project/_/sql
   ```

2. **Run Schema SQL:**
   - Open file: `beatmate_backend/supabase_schema.sql`
   - Copy all content
   - Paste in SQL Editor
   - Click **"Run"**

3. **Run Storage SQL:**
   - Open file: `beatmate_backend/supabase_storage.sql`
   - Copy all content
   - Paste in SQL Editor
   - Click **"Run"**

---

### ✅ Step 3: Configure Google OAuth (3-5 minutes)

#### Part A: Google Cloud Console

1. Go to: https://console.cloud.google.com
2. Create a new project or select existing
3. Search for "Google+ API" → Enable it
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: **Web application**
6. Authorized redirect URIs - Add:
   ```
   https://qecsdctcizxlxqcmgriu.supabase.co/auth/v1/callback
   ```
7. Click **Create**
8. **Copy** the Client ID and Client Secret

#### Part B: Supabase Dashboard

1. Go to: https://qecsdctcizxlxqcmgriu.supabase.co/project/_/auth/providers
2. Find "Google" in the list
3. Toggle to **Enabled**
4. Paste your **Client ID**
5. Paste your **Client Secret**
6. Click **Save**

---

### ✅ Step 4: Install Dependencies (2 minutes)

#### Backend
```bash
cd beatmate_backend
pip install -r requirements.txt
```

#### Frontend
```bash
cd beatmate_frontend
npm install
```

---

### ✅ Step 5: Start Application (1 minute)

#### Terminal 1 - Backend
```bash
cd beatmate_backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend
```bash
cd beatmate_frontend
npm run dev
```

---

### ✅ Step 6: Test! (1 minute)

1. Open: http://localhost:5173
2. Click **"Sign in with Google"**
3. Complete Google authentication
4. You should see the dashboard!

---

## 🎉 Done!

Your app is now running with:
- ✅ Google Sign-In
- ✅ Per-user file storage
- ✅ Secure authentication
- ✅ Production-ready infrastructure

---

## 📚 Need More Details?

- **Complete Setup Guide:** `SUPABASE_SETUP_GUIDE.md`
- **Integration Summary:** `INTEGRATION_COMPLETE.md`
- **Troubleshooting:** See "Troubleshooting" section in `INTEGRATION_COMPLETE.md`

---

## 🔍 Verify Setup

Check if everything is working:

1. **Database Tables** - Go to Supabase Dashboard → Database → Tables
   - Should see: `user_profiles`, `user_songs`, `user_videos`

2. **Storage Buckets** - Go to Supabase Dashboard → Storage
   - Should see: `user-songs`, `user-lyrics`, `user-videos`, `user-album-art`, `backgrounds`

3. **Authentication** - Sign in with Google
   - Check: Supabase Dashboard → Authentication → Users
   - Your account should appear

---

## 🚨 Common Issues

**"Missing Supabase environment variables"**
→ Make sure `.env` files are created in both `beatmate_backend` and `beatmate_frontend`

**Google Sign-In not working**
→ Double-check the redirect URI in Google Cloud Console matches exactly:
```
https://qecsdctcizxlxqcmgriu.supabase.co/auth/v1/callback
```

**Backend errors about Supabase**
→ Run: `pip install supabase postgrest-py`

**Frontend build errors**
→ Run: `npm install @supabase/supabase-js`

---

## 🎯 What Changed?

**Old System:**
- No login required
- Files on local server
- Everyone shares the same files

**New System:**
- Google Sign-In required
- Files on Supabase cloud
- Each user has their own isolated files

---

**Ready to create music! 🎵**

