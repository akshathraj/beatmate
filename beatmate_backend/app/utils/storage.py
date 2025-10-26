import os
from datetime import datetime
BASE_DIR = os.path.join(os.path.dirname(__file__), '../../files')
os.makedirs(BASE_DIR, exist_ok=True)


def timestamped_filename(prefix, ext):
    return f"{prefix}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"


def local_save_file(content_bytes, filename):
    path = os.path.join(BASE_DIR, filename)
    with open(path, 'wb') as f:
        f.write(content_bytes)
    return path