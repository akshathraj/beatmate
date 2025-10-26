import os
import uuid
import tempfile
import shutil
from app.utils.aligner import align_audio_with_lyrics
from app.utils.video_generator import render_lyric_video
from app.utils import storage

FILES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../files"))

def generate_lyric_video_from_files(audio_path, lyrics_path=None, title="song"):
    """
    Uses WhisperX alignment + MoviePy rendering to create a lyric video.
    Returns path to generated .mp4 in /files/.
    """
    tmpdir = tempfile.mkdtemp()
    try:
        # 1️⃣ Align lyrics with audio
        print("[Video Service] Aligning lyrics...")
        fragments = align_audio_with_lyrics(audio_path, lyrics_path)

        # 2️⃣ Generate video
        output_name = f"{uuid.uuid4().hex}_{title.replace(' ', '_')}.mp4"
        temp_output = os.path.join(tmpdir, output_name)
        bg_path = os.path.join(FILES_DIR, "default_bg.jpg")
        if not os.path.exists(bg_path):
            raise FileNotFoundError("Background image not found: files/default_bg.jpg")

        print("[Video Service] Rendering lyric video...")
        render_lyric_video(audio_path, fragments, bg_path, temp_output)

        # 3️⃣ Save final file to /files/
        with open(temp_output, "rb") as f:
            data = f.read()
        saved_path = storage.local_save_file(data, output_name)
        print(f"[Video Service] Video saved at: {saved_path}")
        return saved_path

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
