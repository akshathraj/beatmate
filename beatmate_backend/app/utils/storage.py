import os
from datetime import datetime

BASE_DIR = os.path.join(os.path.dirname(__file__), '../../files')

# Create organized folder structure
FOLDERS = {
    'lyrics': os.path.join(BASE_DIR, 'lyrics'),
    'songs': os.path.join(BASE_DIR, 'songs'),
    'album_art': os.path.join(BASE_DIR, 'album_art'),
    'videos': os.path.join(BASE_DIR, 'videos'),
    'backgrounds': os.path.join(BASE_DIR, 'backgrounds'),
}

# Create all folders
os.makedirs(BASE_DIR, exist_ok=True)
for folder in FOLDERS.values():
    os.makedirs(folder, exist_ok=True)


def timestamped_filename(prefix, ext):
    return f"{prefix}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"


def local_save_file(content_bytes, filename, folder_type=None):
    """
    Save file to appropriate folder.
    folder_type: 'lyrics', 'songs', 'album_art', 'videos', 'backgrounds', or None for base
    """
    if folder_type and folder_type in FOLDERS:
        path = os.path.join(FOLDERS[folder_type], filename)
    else:
        path = os.path.join(BASE_DIR, filename)
    
    with open(path, 'wb') as f:
        f.write(content_bytes)
    return path


def check_title_exists(title, check_types=['songs', 'videos']):
    """
    Check if a title already exists in songs or videos folders.
    Returns True if title exists.
    """
    safe_title = sanitize_title(title)
    
    for check_type in check_types:
        if check_type not in FOLDERS:
            continue
        
        folder_path = FOLDERS[check_type]
        
        if check_type == 'songs':
            # Check for .mp3 files
            if os.path.exists(os.path.join(folder_path, f"{safe_title}.mp3")):
                return True
        elif check_type == 'videos':
            # Check for .mp4 files
            if os.path.exists(os.path.join(folder_path, f"{safe_title}.mp4")):
                return True
    
    return False


def sanitize_title(title):
    """Sanitize title for filesystem"""
    return "".join(ch for ch in title if ch.isalnum() or ch in (' ', '-', '_', '&', '.')).strip() or "untitled"


def get_folder_path(folder_type):
    """Get the absolute path for a folder type"""
    return FOLDERS.get(folder_type, BASE_DIR)