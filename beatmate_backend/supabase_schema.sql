-- ============================================
-- BEATMATE SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/qecsdctcizxlxqcmgriu/sql/new
-- ============================================

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
-- Extends the default auth.users table with custom profile data
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. USER SONGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    genre TEXT,
    duration INTEGER, -- in seconds
    voice_type TEXT, -- male, female, duet
    lyrics_path TEXT, -- path to lyrics file in storage
    album_art_path TEXT, -- path to album art in storage
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_songs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own songs
CREATE POLICY "Users can view own songs" ON public.user_songs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own songs
CREATE POLICY "Users can insert own songs" ON public.user_songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own songs
CREATE POLICY "Users can update own songs" ON public.user_songs
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own songs
CREATE POLICY "Users can delete own songs" ON public.user_songs
    FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_user_songs_user_id ON public.user_songs(user_id);
CREATE INDEX idx_user_songs_created_at ON public.user_songs(created_at DESC);

-- ============================================
-- 3. USER VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    song_id UUID REFERENCES public.user_songs(id) ON DELETE SET NULL,
    background_path TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own videos
CREATE POLICY "Users can view own videos" ON public.user_videos
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own videos
CREATE POLICY "Users can insert own videos" ON public.user_videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own videos
CREATE POLICY "Users can update own videos" ON public.user_videos
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON public.user_videos
    FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_user_videos_user_id ON public.user_videos(user_id);
CREATE INDEX idx_user_videos_created_at ON public.user_videos(created_at DESC);

-- ============================================
-- 4. AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================
-- This trigger automatically creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, username)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. UPDATED_AT TRIGGER FUNCTION
-- ============================================
-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_songs_updated_at
    BEFORE UPDATE ON public.user_songs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_videos_updated_at
    BEFORE UPDATE ON public.user_videos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SCHEMA SETUP COMPLETE! ✅
-- ============================================
-- Next steps:
-- 1. Run the storage bucket creation script (supabase_storage.sql)
-- 2. Configure Google OAuth in Supabase dashboard
-- 3. Test the backend integration
-- ============================================

