-- ============================================
-- BEATMATE SUPABASE STORAGE BUCKETS & POLICIES
-- ============================================
-- Run this SQL AFTER running supabase_schema.sql
-- Go to: https://qecsdctcizxlxqcmgriu.supabase.co/project/_/sql
-- ============================================

-- ============================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================

-- User Songs Bucket (private - users can only access their own)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-songs',
    'user-songs',
    false,
    52428800, -- 50MB
    ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- User Lyrics Bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-lyrics',
    'user-lyrics',
    false,
    1048576, -- 1MB
    ARRAY['text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- User Videos Bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-videos',
    'user-videos',
    false,
    104857600, -- 100MB
    ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- User Album Art Bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-album-art',
    'user-album-art',
    false,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Backgrounds Bucket (public - shared by all users)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'backgrounds',
    'backgrounds',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. USER SONGS STORAGE POLICIES
-- ============================================

-- Allow users to read their own songs
CREATE POLICY "Users can read own songs" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'user-songs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to upload their own songs
CREATE POLICY "Users can upload own songs" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'user-songs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to update their own songs
CREATE POLICY "Users can update own songs" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'user-songs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to delete their own songs
CREATE POLICY "Users can delete own songs" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'user-songs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================
-- 3. USER LYRICS STORAGE POLICIES
-- ============================================

CREATE POLICY "Users can read own lyrics" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'user-lyrics' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can upload own lyrics" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'user-lyrics' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own lyrics" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'user-lyrics' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own lyrics" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'user-lyrics' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================
-- 4. USER VIDEOS STORAGE POLICIES
-- ============================================

CREATE POLICY "Users can read own videos" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'user-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can upload own videos" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'user-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own videos" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'user-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own videos" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'user-videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================
-- 5. USER ALBUM ART STORAGE POLICIES
-- ============================================

CREATE POLICY "Users can read own album art" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'user-album-art' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can upload own album art" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'user-album-art' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own album art" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'user-album-art' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own album art" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'user-album-art' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================
-- 6. BACKGROUNDS STORAGE POLICIES (PUBLIC)
-- ============================================

-- Anyone can read backgrounds
CREATE POLICY "Anyone can read backgrounds" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'backgrounds');

-- Only authenticated users can upload backgrounds
CREATE POLICY "Authenticated users can upload backgrounds" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'backgrounds' AND
        auth.role() = 'authenticated'
    );

-- ============================================
-- STORAGE SETUP COMPLETE! ✅
-- ============================================
-- Buckets created:
-- 1. user-songs (private, per-user)
-- 2. user-lyrics (private, per-user)
-- 3. user-videos (private, per-user)
-- 4. user-album-art (private, per-user)
-- 5. backgrounds (public, shared)
--
-- Next steps:
-- 1. Configure Google OAuth in Supabase dashboard
-- 2. Update backend to use Supabase storage
-- 3. Update frontend with authentication
-- ============================================

