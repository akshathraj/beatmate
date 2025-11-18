import os
import uuid
import tempfile
import shutil
from app.utils.aligner import align_audio_with_lyrics
from app.utils.video_generator import render_lyric_video
from app.utils import storage

FILES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../files"))

def generate_lyric_video_from_files(audio_path, lyrics_path=None, title="song", background_path=None):
    """
    Uses WhisperX alignment + MoviePy rendering to create a lyric video.
    Returns path to generated .mp4 in temp directory.
    Note: Caller is responsible for cleanup.
    """
    tmpdir = tempfile.mkdtemp()
    
    # 1️⃣ Align lyrics with audio
    print("[Video Service] Aligning lyrics...")
    fragments = align_audio_with_lyrics(audio_path, lyrics_path)

    # 2️⃣ Generate video
    output_name = f"{uuid.uuid4().hex}_{title.replace(' ', '_')}.mp4"
    temp_output = os.path.join(tmpdir, output_name)
    
    # Use provided background or default
    if background_path and os.path.exists(background_path):
        bg_path = background_path
    else:
        # Try default backgrounds in order
        bg_path = os.path.join(storage.get_folder_path('backgrounds'), "bg1.jpg")
        if not os.path.exists(bg_path):
            bg_path = os.path.join(FILES_DIR, "default_bg.jpg")
            if not os.path.exists(bg_path):
                raise FileNotFoundError("No background image found")

    print("[Video Service] Rendering lyric video...")
    render_lyric_video(audio_path, fragments, bg_path, temp_output)

    # 3️⃣ Return temp path (caller will upload to Supabase and then cleanup)
    print(f"[Video Service] Video ready at: {temp_output}")
    return temp_output
