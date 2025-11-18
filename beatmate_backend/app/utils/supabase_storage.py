"""
Supabase Storage Utility
Replaces local file storage with Supabase cloud storage
"""
import os
from datetime import datetime
from typing import Optional
from app.services.supabase_service import get_supabase_service

# Storage bucket names
BUCKETS = {
    'lyrics': 'user-lyrics',
    'songs': 'user-songs',
    'album_art': 'user-album-art',
    'videos': 'user-videos',
    'backgrounds': 'backgrounds',  # Public bucket
}


def get_file_path(user_id: str, filename: str, folder_type: str) -> str:
    """
    Generate storage path for a file
    Format: {user_id}/{filename}
    
    Args:
        user_id: User ID
        filename: File name
        folder_type: Type of folder (lyrics, songs, album_art, videos)
    
    Returns:
        Storage path
    """
    if folder_type == 'backgrounds':
        # Backgrounds are shared, no user folder
        return filename
    return f"{user_id}/{filename}"


def sanitize_title(title: str) -> str:
    """Sanitize title for filesystem/storage"""
    return "".join(ch for ch in title if ch.isalnum() or ch in (' ', '-', '_', '&', '.')).strip() or "untitled"


def timestamped_filename(prefix: str, ext: str) -> str:
    """Generate a timestamped filename"""
    return f"{prefix}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"


def upload_file(
    user_id: str,
    content_bytes: bytes,
    filename: str,
    folder_type: str = 'songs',
    content_type: Optional[str] = None
) -> dict:
    """
    Upload a file to Supabase storage
    
    Args:
        user_id: User ID
        content_bytes: File content as bytes
        filename: File name
        folder_type: Type of folder (lyrics, songs, album_art, videos, backgrounds)
        content_type: MIME type
    
    Returns:
        dict with 'path' and 'url'
    """
    supabase = get_supabase_service()
    
    bucket = BUCKETS.get(folder_type, BUCKETS['songs'])
    file_path = get_file_path(user_id, filename, folder_type)
    
    # Determine content type if not provided
    if not content_type:
        content_type = get_content_type(filename)
    
    # Upload to Supabase
    url = supabase.upload_file(bucket, file_path, content_bytes, content_type)
    
    return {
        'path': file_path,
        'url': url,
        'bucket': bucket
    }


def download_file(user_id: str, filename: str, folder_type: str = 'songs') -> bytes:
    """
    Download a file from Supabase storage
    
    Args:
        user_id: User ID
        filename: File name
        folder_type: Type of folder
    
    Returns:
        File content as bytes
    """
    supabase = get_supabase_service()
    
    bucket = BUCKETS.get(folder_type, BUCKETS['songs'])
    file_path = get_file_path(user_id, filename, folder_type)
    
    return supabase.download_file(bucket, file_path)


def delete_file(user_id: str, filename: str, folder_type: str = 'songs') -> bool:
    """
    Delete a file from Supabase storage
    
    Args:
        user_id: User ID
        filename: File name
        folder_type: Type of folder
    
    Returns:
        True if successful
    """
    supabase = get_supabase_service()
    
    bucket = BUCKETS.get(folder_type, BUCKETS['songs'])
    file_path = get_file_path(user_id, filename, folder_type)
    
    return supabase.delete_file(bucket, file_path)


def get_public_url(user_id: str, filename: str, folder_type: str = 'songs') -> str:
    """
    Get the public URL for a file
    
    Args:
        user_id: User ID
        filename: File name
        folder_type: Type of folder
    
    Returns:
        Public URL
    """
    supabase = get_supabase_service()
    
    bucket = BUCKETS.get(folder_type, BUCKETS['songs'])
    file_path = get_file_path(user_id, filename, folder_type)
    
    return supabase.get_public_url(bucket, file_path)


def list_user_files(user_id: str, folder_type: str = 'songs') -> list:
    """
    List all files for a user in a specific folder
    
    Args:
        user_id: User ID
        folder_type: Type of folder
    
    Returns:
        List of file objects
    """
    supabase = get_supabase_service()
    
    bucket = BUCKETS.get(folder_type, BUCKETS['songs'])
    folder_path = f"{user_id}/" if folder_type != 'backgrounds' else ""
    
    return supabase.list_files(bucket, folder_path)


def check_file_exists(user_id: str, filename: str, folder_type: str = 'songs') -> bool:
    """
    Check if a file exists in storage
    
    Args:
        user_id: User ID
        filename: File name
        folder_type: Type of folder
    
    Returns:
        True if file exists
    """
    try:
        files = list_user_files(user_id, folder_type)
        return any(f.get('name') == filename for f in files)
    except Exception:
        return False


def check_title_exists(user_id: str, title: str, check_types: list = None) -> bool:
    """
    Check if a title already exists in songs or videos
    
    Args:
        user_id: User ID
        title: Title to check
        check_types: List of folder types to check (default: ['songs', 'videos'])
    
    Returns:
        True if title exists
    """
    if check_types is None:
        check_types = ['songs', 'videos']
    
    safe_title = sanitize_title(title)
    
    for check_type in check_types:
        if check_type == 'songs':
            filename = f"{safe_title}.mp3"
        elif check_type == 'videos':
            filename = f"{safe_title}.mp4"
        else:
            continue
        
        if check_file_exists(user_id, filename, check_type):
            return True
    
    return False


def get_content_type(filename: str) -> str:
    """
    Determine MIME type from filename
    
    Args:
        filename: File name
    
    Returns:
        MIME type
    """
    ext = filename.lower().split('.')[-1]
    
    content_types = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'txt': 'text/plain',
    }
    
    return content_types.get(ext, 'application/octet-stream')


# Backward compatibility with old storage module
def local_save_file(content_bytes: bytes, filename: str, folder_type: str = None, user_id: str = None):
    """
    DEPRECATED: Use upload_file instead
    Kept for backward compatibility during migration
    """
    if not user_id:
        raise ValueError("user_id is required for Supabase storage")
    
    result = upload_file(user_id, content_bytes, filename, folder_type or 'songs')
    return result['path']


def get_folder_path(folder_type: str):
    """
    DEPRECATED: Returns bucket name instead of local path
    Kept for backward compatibility during migration
    """
    return BUCKETS.get(folder_type, BUCKETS['songs'])

