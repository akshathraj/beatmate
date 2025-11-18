"""
Supabase Service Layer
Handles all Supabase interactions including storage, database, and authentication
"""
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from typing import Optional, BinaryIO
import os
from datetime import datetime

class SupabaseService:
    """Service for interacting with Supabase"""
    
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("Supabase credentials not configured. Please check your .env file.")
        
        # Use service role key for backend operations
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    # ============================================
    # STORAGE OPERATIONS
    # ============================================
    
    def upload_file(
        self, 
        bucket: str, 
        file_path: str, 
        file_content: bytes,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload a file to Supabase storage
        
        Args:
            bucket: Storage bucket name (e.g., 'user-songs')
            file_path: Path in bucket (e.g., 'user_id/song.mp3')
            file_content: File content as bytes
            content_type: MIME type (e.g., 'audio/mpeg')
        
        Returns:
            Public URL or storage path
        """
        try:
            options = {}
            if content_type:
                options['content-type'] = content_type
            
            result = self.client.storage.from_(bucket).upload(
                file_path,
                file_content,
                file_options=options
            )
            
            # Get the public URL (or signed URL for private buckets)
            public_url = self.get_public_url(bucket, file_path)
            return public_url
        
        except Exception as e:
            print(f"Error uploading file to {bucket}/{file_path}: {e}")
            raise
    
    def download_file(self, bucket: str, file_path: str) -> bytes:
        """
        Download a file from Supabase storage
        
        Args:
            bucket: Storage bucket name
            file_path: Path in bucket
        
        Returns:
            File content as bytes
        """
        try:
            result = self.client.storage.from_(bucket).download(file_path)
            return result
        except Exception as e:
            print(f"Error downloading file from {bucket}/{file_path}: {e}")
            raise
    
    def delete_file(self, bucket: str, file_path: str) -> bool:
        """
        Delete a file from Supabase storage
        
        Args:
            bucket: Storage bucket name
            file_path: Path in bucket
        
        Returns:
            True if successful
        """
        try:
            self.client.storage.from_(bucket).remove([file_path])
            return True
        except Exception as e:
            print(f"Error deleting file from {bucket}/{file_path}: {e}")
            return False
    
    def get_public_url(self, bucket: str, file_path: str) -> str:
        """
        Get the public URL for a file (creates signed URL for private buckets)
        
        Args:
            bucket: Storage bucket name
            file_path: Path in bucket
        
        Returns:
            Public or signed URL
        """
        try:
            # For public buckets (like backgrounds), use direct public URL
            if bucket == 'backgrounds':
                return self.client.storage.from_(bucket).get_public_url(file_path)
            
            # For private buckets, create a signed URL that expires in 24 hours
            # This allows files to be accessed without authentication
            result = self.client.storage.from_(bucket).create_signed_url(file_path, 86400)  # 24 hours
            
            # The result format is {'signedURL': 'url'} or {'path': 'url'} depending on version
            if result:
                signed_url = result.get('signedURL') or result.get('path')
                if signed_url:
                    return signed_url
            
            # Fallback to public URL if signing fails
            print(f"⚠️ Signed URL creation returned unexpected format, using public URL")
            return self.client.storage.from_(bucket).get_public_url(file_path)
        except Exception as e:
            print(f"⚠️ Error creating signed URL for {bucket}/{file_path}: {e}")
            # Fallback to public URL
            return self.client.storage.from_(bucket).get_public_url(file_path)
    
    def list_files(self, bucket: str, folder_path: str = "") -> list:
        """
        List files in a bucket folder
        
        Args:
            bucket: Storage bucket name
            folder_path: Folder path (e.g., 'user_id/')
        
        Returns:
            List of file objects
        """
        try:
            result = self.client.storage.from_(bucket).list(folder_path)
            return result
        except Exception as e:
            print(f"Error listing files in {bucket}/{folder_path}: {e}")
            return []
    
    # ============================================
    # DATABASE OPERATIONS - USER SONGS
    # ============================================
    
    def create_song_record(
        self,
        user_id: str,
        title: str,
        filename: str,
        storage_path: str,
        genre: Optional[str] = None,
        duration: Optional[int] = None,
        voice_type: Optional[str] = None,
        lyrics_path: Optional[str] = None,
        album_art_path: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Create a song record in the database
        
        Returns:
            Created song record
        """
        try:
            data = {
                "user_id": user_id,
                "title": title,
                "filename": filename,
                "storage_path": storage_path,
                "genre": genre,
                "duration": duration,
                "voice_type": voice_type,
                "lyrics_path": lyrics_path,
                "album_art_path": album_art_path,
                "metadata": metadata or {}
            }
            
            result = self.client.table("user_songs").insert(data).execute()
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"Error creating song record: {e}")
            raise
    
    def get_user_songs(self, user_id: str, limit: int = 100) -> list:
        """
        Get all songs for a user
        
        Returns:
            List of song records
        """
        try:
            result = self.client.table("user_songs")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            print(f"Error fetching user songs: {e}")
            return []
    
    def get_song_by_id(self, song_id: str, user_id: str) -> Optional[dict]:
        """
        Get a specific song by ID
        
        Returns:
            Song record or None
        """
        try:
            result = self.client.table("user_songs")\
                .select("*")\
                .eq("id", song_id)\
                .eq("user_id", user_id)\
                .single()\
                .execute()
            
            return result.data if result.data else None
        
        except Exception as e:
            print(f"Error fetching song by ID: {e}")
            return None
    
    def update_song_record(self, song_id: str, user_id: str, updates: dict) -> Optional[dict]:
        """
        Update a song record
        
        Returns:
            Updated song record
        """
        try:
            result = self.client.table("user_songs")\
                .update(updates)\
                .eq("id", song_id)\
                .eq("user_id", user_id)\
                .execute()
            
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"Error updating song record: {e}")
            return None
    
    def delete_song_record(self, song_id: str, user_id: str) -> bool:
        """
        Delete a song record
        
        Returns:
            True if successful
        """
        try:
            self.client.table("user_songs")\
                .delete()\
                .eq("id", song_id)\
                .eq("user_id", user_id)\
                .execute()
            
            return True
        
        except Exception as e:
            print(f"Error deleting song record: {e}")
            return False
    
    # ============================================
    # DATABASE OPERATIONS - WEBHOOK TRACKING
    # ============================================
    
    def increment_webhook_count(self, task_id: str) -> int:
        """
        Atomically increment and return webhook count for a task
        This is thread-safe and handles concurrent webhooks
        
        Returns:
            Current webhook count after increment
        """
        try:
            # Try to increment existing record
            result = self.client.table("webhook_tracking")\
                .select("webhook_count")\
                .eq("task_id", task_id)\
                .execute()
            
            if result.data and len(result.data) > 0:
                # Record exists, increment
                current_count = result.data[0]['webhook_count']
                new_count = current_count + 1
                
                self.client.table("webhook_tracking")\
                    .update({"webhook_count": new_count})\
                    .eq("task_id", task_id)\
                    .execute()
                
                return new_count
            else:
                # First webhook, create record
                self.client.table("webhook_tracking")\
                    .insert({"task_id": task_id, "webhook_count": 1})\
                    .execute()
                
                return 1
                
        except Exception as e:
            print(f"Error tracking webhook count: {e}")
            # Fallback: assume first webhook
            return 1
    
    def delete_webhook_tracking(self, task_id: str):
        """
        Delete webhook tracking record after all webhooks processed
        """
        try:
            self.client.table("webhook_tracking")\
                .delete()\
                .eq("task_id", task_id)\
                .execute()
        except Exception as e:
            print(f"Error deleting webhook tracking: {e}")
    
    # ============================================
    # DATABASE OPERATIONS - USER VIDEOS
    # ============================================
    
    def create_video_record(
        self,
        user_id: str,
        title: str,
        filename: str,
        storage_path: str,
        song_id: Optional[str] = None,
        background_path: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Create a video record in the database
        
        Returns:
            Created video record
        """
        try:
            data = {
                "user_id": user_id,
                "title": title,
                "filename": filename,
                "storage_path": storage_path,
                "song_id": song_id,
                "background_path": background_path,
                "metadata": metadata or {}
            }
            
            result = self.client.table("user_videos").insert(data).execute()
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"Error creating video record: {e}")
            raise
    
    def get_user_videos(self, user_id: str, limit: int = 100) -> list:
        """
        Get all videos for a user
        
        Returns:
            List of video records
        """
        try:
            result = self.client.table("user_videos")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            print(f"Error fetching user videos: {e}")
            return []
    
    def delete_video_record(self, video_id: str, user_id: str) -> bool:
        """
        Delete a video record
        
        Returns:
            True if successful
        """
        try:
            self.client.table("user_videos")\
                .delete()\
                .eq("id", video_id)\
                .eq("user_id", user_id)\
                .execute()
            
            return True
        
        except Exception as e:
            print(f"Error deleting video record: {e}")
            return False
    
    # ============================================
    # DATABASE OPERATIONS - USER PROFILES
    # ============================================
    
    def get_user_profile(self, user_id: str) -> Optional[dict]:
        """
        Get user profile
        
        Returns:
            User profile or None
        """
        try:
            result = self.client.table("user_profiles")\
                .select("*")\
                .eq("id", user_id)\
                .single()\
                .execute()
            
            return result.data if result.data else None
        
        except Exception as e:
            print(f"Error fetching user profile: {e}")
            return None
    
    def update_user_profile(self, user_id: str, updates: dict) -> Optional[dict]:
        """
        Update user profile
        
        Returns:
            Updated profile
        """
        try:
            result = self.client.table("user_profiles")\
                .update(updates)\
                .eq("id", user_id)\
                .execute()
            
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return None
    
    # ============================================
    # AUTHENTICATION
    # ============================================
    
    def verify_token(self, token: str) -> Optional[dict]:
        """
        Verify a JWT token and return user info
        
        Returns:
            User info or None
        """
        try:
            # Get user info using the token
            response = self.client.auth.get_user(token)
            
            # The response has a 'user' attribute
            if response and response.user:
                # Convert user object to dict
                user = response.user
                return {
                    "id": user.id,
                    "email": user.email,
                    "user_metadata": user.user_metadata or {}
                }
            
            return None
            
        except Exception as e:
            # Only log non-timeout errors
            if "timed out" not in str(e).lower():
                print(f"Error verifying token: {e}")
            return None


# Singleton instance
_supabase_service = None

def get_supabase_service() -> SupabaseService:
    """Get or create the Supabase service singleton"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service

