from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import FileResponse
from app.models import GenerateRequest, GenerateResponse, RemixRequest
from app.services import lyrics_service, song_service
import os
import glob
import json
from app.services.video_service import generate_lyric_video_from_files
from app.utils import storage

router = APIRouter()

# Step 1 + 2: Generate a song request (async)
@router.post('/generate-song', response_model=GenerateResponse)
def generate_song(req: GenerateRequest):
    try:
        # Check if title already exists
        if storage.check_title_exists(req.title or "song"):
            raise HTTPException(
                status_code=400,
                detail=f"Title '{req.title}' already exists. Please choose a different title."
            )
        
        # Complete lyrics using Gemini
        complete_lyrics = lyrics_service.generate_complete_lyrics(req.lyrics, req.genre)
        
        # Save generated lyrics immediately to lyrics folder
        safe_title = storage.sanitize_title(req.title or "song")
        lyrics_path = os.path.join(storage.get_folder_path('lyrics'), f"{safe_title}.txt")
        with open(lyrics_path, 'w', encoding='utf-8') as f:
            f.write(complete_lyrics)

        # Generate song (async task)
        music_task = song_service.generate_song_from_lyrics(
            complete_lyrics, req.genre, title=req.title
        )

        # Persist user-provided data temporarily keyed by task id for later association in webhook
        try:
            files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
            os.makedirs(files_dir, exist_ok=True)
            task_id = music_task.get('task_id')
            if task_id:
                temp_path = os.path.join(files_dir, f"task_{task_id}.user.txt")
                with open(temp_path, 'w', encoding='utf-8') as f:
                    f.write(req.lyrics or '')
                # Save meta (title) so webhook can use user title instead of provider's
                meta_path = os.path.join(files_dir, f"task_{task_id}.meta.json")
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        "title": (req.title or "song"),
                        "complete_lyrics": complete_lyrics
                    }, f)
                # Also index by conversion IDs so the webhook can resolve by either
                conv1 = (music_task.get('conversion_id_1') or '').strip()
                conv2 = (music_task.get('conversion_id_2') or '').strip()
                if conv1:
                    with open(os.path.join(files_dir, f"conv_{conv1}.meta.json"), 'w', encoding='utf-8') as f:
                        json.dump({"title": (req.title or "song")}, f)
                if conv2:
                    with open(os.path.join(files_dir, f"conv_{conv2}.meta.json"), 'w', encoding='utf-8') as f:
                        json.dump({"title": (req.title or "song")}, f)
        except Exception as se:
            print(f"Could not save temp user lyrics: {se}")

        # Return task info
        return GenerateResponse(
            song_url=f"MusicGPT task_id: {music_task['task_id']}",
            local_path=f"Conversion IDs: {music_task['conversion_id_1']}, {music_task['conversion_id_2']}"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# Step 3: Webhook endpoint to receive final mp3/audio
@router.post('/webhook/musicgpt')
async def musicgpt_webhook(request: Request):
    """
    MusicGPT calls this webhook with final song info.
    Saves the mp3 locally.
    """
    payload = await request.json()
    print("=== MusicGPT Webhook Received ===")
    print(payload)

    try:
        conversion_path = payload.get("conversion_path")
        # Prefer user-provided title saved earlier, fallback to provider title
        title = payload.get("title", "song")
        try:
            files_dir_meta = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
            task_id_meta = payload.get('task_id') or payload.get('conversion_task_id')
            if task_id_meta:
                meta_path = os.path.join(files_dir_meta, f"task_{task_id_meta}.meta.json")
                if os.path.exists(meta_path):
                    with open(meta_path, 'r', encoding='utf-8') as mf:
                        meta = json.load(mf)
                        user_title = (meta.get('title') or '').strip()
                        if user_title:
                            title = user_title
            # If not found by a task, attempt by conversion id
            if not title or title == payload.get('title'):
                conv_id_meta = payload.get('conversion_id') or ''
                if conv_id_meta:
                    conv_meta_path = os.path.join(files_dir_meta, f"conv_{conv_id_meta}.meta.json")
                    if os.path.exists(conv_meta_path):
                        with open(conv_meta_path, 'r', encoding='utf-8') as mf:
                            meta = json.load(mf)
                            user_title = (meta.get('title') or '').strip()
                            if user_title:
                                title = user_title
        except Exception:
            pass

        if conversion_path:
            import requests
            from .utils import storage

            # Sanitize title for filesystem
            safe_title = storage.sanitize_title(title)
            base_filename = f"{safe_title}.mp3"
            alt_filename = f"{safe_title}_1.mp3"

            songs_folder = storage.get_folder_path('songs')
            base_path = os.path.join(songs_folder, base_filename)
            alt_path = os.path.join(songs_folder, alt_filename)

            r = requests.get(conversion_path)
            audio_bytes = r.content

            # Decide which filename to use: first save -> base, second -> _1, else skip
            if not os.path.exists(base_path):
                chosen_filename = base_filename
                local_path = storage.local_save_file(audio_bytes, chosen_filename, folder_type='songs')
            elif not os.path.exists(alt_path):
                chosen_filename = alt_filename
                local_path = storage.local_save_file(audio_bytes, chosen_filename, folder_type='songs')
            else:
                # Already saved both variants for this title; ignore extra
                return {"success": True}

            print(f"Saved song locally: {local_path}")
            
            # Save album art if provided
            try:
                album_art_url = payload.get("album_art") or payload.get("image_url")
                if album_art_url:
                    art_response = requests.get(album_art_url)
                    if art_response.status_code == 200:
                        art_filename = f"{safe_title}.jpg"
                        storage.local_save_file(art_response.content, art_filename, folder_type='album_art')
                        print(f"Saved album art: {art_filename}")
            except Exception as ae:
                print(f"Could not save album art: {ae}")

            # If a temp user-lyrics file exists for this task, promote it to final .txt next to mp3
            try:
                task_id = payload.get('task_id') or payload.get('conversion_task_id')
                if task_id:
                    files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
                    temp_path = os.path.join(files_dir, f"task_{task_id}.user.txt")
                    if os.path.exists(temp_path):
                        base_no_ext = os.path.splitext(os.path.basename(local_path))[0]
                        lyrics_path = os.path.join(files_dir, f"{base_no_ext}.txt")
                        os.replace(temp_path, lyrics_path)
                        # Cleanup meta files for this task and its conversions
                        meta_path = os.path.join(files_dir, f"task_{task_id}.meta.json")
                        try:
                            if os.path.exists(meta_path):
                                os.remove(meta_path)
                        except Exception:
                            pass
                        # Remove conversion-indexed meta if present
                        try:
                            conv_id = payload.get('conversion_id') or ''
                            if conv_id:
                                conv_meta_path = os.path.join(files_dir, f"conv_{conv_id}.meta.json")
                                if os.path.exists(conv_meta_path):
                                    os.remove(conv_meta_path)
                        except Exception:
                            pass
            except Exception as le:
                print(f"Could not promote user lyrics to final file: {le}")
            # Try to save lyrics alongside the mp3 (for future remixing)
            try:
                lyrics_text = payload.get("lyrics")
                if not lyrics_text and payload.get("lyrics_timestamped"):
                    ts = payload.get("lyrics_timestamped")
                    if isinstance(ts, str):
                        try:
                            ts_list = json.loads(ts)
                        except Exception:
                            ts_list = []
                    else:
                        ts_list = ts
                    if isinstance(ts_list, list):
                        lyrics_text = "\n".join([item.get("text", "") for item in ts_list if isinstance(item, dict) and item.get("text")])
                if lyrics_text:
                    files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
                    base_no_ext = os.path.splitext(os.path.basename(local_path))[0]
                    lyrics_path = os.path.join(files_dir, f"{base_no_ext}.txt")
                    with open(lyrics_path, 'w', encoding='utf-8') as f:
                        f.write(lyrics_text)
            except Exception as le:
                print(f"Could not save lyrics text: {le}")
        return {"success": True}

    except Exception as e:
        print(f"Webhook processing error: {e}")
        return {"success": False, "error": str(e)}


# Remix two songs by extracting/mashing-up lyrics then generating new track
@router.post('/remix', response_model=GenerateResponse)
def remix_songs(req: RemixRequest):
    try:
        # Locate songs in files dir
        files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
        path_a = os.path.join(files_dir, req.song_a)
        path_b = os.path.join(files_dir, req.song_b)
        if not os.path.exists(path_a) or not os.path.exists(path_b):
            raise HTTPException(status_code=404, detail="One or both songs not found")

        # Try to load saved lyrics .txt next to mp3; fallback to filename as seed
        def load_lyrics_for(fn: str) -> str:
            base = os.path.splitext(fn)[0]
            txt_path = os.path.join(files_dir, f"{base}.txt")
            if os.path.exists(txt_path):
                try:
                    with open(txt_path, 'r', encoding='utf-8') as f:
                        return f.read()
                except Exception:
                    pass
            return f"Title: {base}"

        lyrics_a = load_lyrics_for(req.song_a)
        lyrics_b = load_lyrics_for(req.song_b)

        # Build a mashup that guarantees at least one verse and one chorus from EACH song
        def parse_sections(text: str):
            sections = {"verse": [], "chorus": [], "other": []}
            current_label = None
            current_buffer: list[str] = []

            def flush():
                nonlocal current_label, current_buffer
                if not current_buffer:
                    return
                target = "other"
                if current_label:
                    lower = current_label.lower()
                    if "chorus" in lower:
                        target = "chorus"
                    elif "verse" in lower:
                        target = "verse"
                sections[target].append(current_buffer)
                current_buffer = []

            for raw in text.splitlines():
                line = raw.strip()
                if not line:
                    continue
                if line.startswith("[") and line.endswith("]"):
                    # new section label
                    flush()
                    current_label = line[1:-1]
                else:
                    current_buffer.append(line)
            flush()
            return sections

        def fallback_lines(text: str, n: int) -> list[str]:
            lines = [ln.strip() for ln in text.splitlines() if ln.strip() and not ln.strip().startswith('[')]
            if not lines:
                return [text.strip()]
            return lines[:n]

        sec_a = parse_sections(lyrics_a)
        sec_b = parse_sections(lyrics_b)

        a_verse = (sec_a["verse"][0] if sec_a["verse"] else fallback_lines(lyrics_a, 6))
        a_chorus = (sec_a["chorus"][0] if sec_a["chorus"] else fallback_lines(lyrics_a, 4))
        b_verse = (sec_b["verse"][0] if sec_b["verse"] else fallback_lines(lyrics_b, 6))
        b_chorus = (sec_b["chorus"][0] if sec_b["chorus"] else fallback_lines(lyrics_b, 4))

        mashup_lines: list[str] = []
        mashup_lines.append("[Intro]")
        mashup_lines.extend((a_verse[:2] if isinstance(a_verse, list) else a_verse))
        mashup_lines.append("[Verse 1]")
        mashup_lines.extend(a_verse if isinstance(a_verse, list) else [a_verse])
        mashup_lines.append("[Chorus]")
        mashup_lines.extend(a_chorus if isinstance(a_chorus, list) else [a_chorus])
        mashup_lines.append("[Verse 2]")
        mashup_lines.extend(b_verse if isinstance(b_verse, list) else [b_verse])
        mashup_lines.append("[Chorus]")
        mashup_lines.extend(b_chorus if isinstance(b_chorus, list) else [b_chorus])
        mashup_lines.append("[Outro]")
        # simple blended outro with last lines of both
        mashup_lines.extend((a_chorus[-2:] if isinstance(a_chorus, list) else [str(a_chorus)])[:2])

        mashup = "\n".join(mashup_lines)

        music_task = song_service.generate_song_from_lyrics(
            mashup, req.genre, title=req.title, duration=60, voice_type=req.voiceType
        )

        return GenerateResponse(
            song_url=f"MusicGPT task_id: {music_task['task_id']}",
            local_path=f"Conversion IDs: {music_task['conversion_id_1']}, {music_task['conversion_id_2']}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a list of generated songs
@router.get('/songs')
def list_songs():
    """
    Returns a list of all generated songs in the songs folder, newest first.
    Each item includes filename, derived title, size, created_at (timestamp), download_url, and album_art_url.
    """
    try:
        songs_folder = storage.get_folder_path('songs')
        album_art_folder = storage.get_folder_path('album_art')
        
        if not os.path.exists(songs_folder):
            return {"songs": []}

        mp3_files = glob.glob(os.path.join(songs_folder, '*.mp3'))
        songs = []

        for file_path in mp3_files:
            file_name = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            created_ts = os.path.getmtime(file_path)

            base_no_ext = os.path.splitext(file_name)[0]
            # Hide the '_1' alternate in UI by skipping it from listing
            if base_no_ext.endswith('_1'):
                continue
            # Title is the base filename without extension
            title = base_no_ext
            
            # Check if album art exists
            album_art_path = os.path.join(album_art_folder, f"{base_no_ext}.jpg")
            album_art_url = f"/api/album-art/{base_no_ext}.jpg" if os.path.exists(album_art_path) else None

            songs.append({
                "filename": file_name,
                "title": title,
                "size": file_size,
                "created_at": created_ts,
                "download_url": f"/api/download/song/{file_name}",
                "album_art_url": album_art_url
            })

        songs.sort(key=lambda s: s.get('created_at', 0), reverse=True)
        return {"songs": songs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Download/stream a generated song
@router.get('/download/song/{filename}')
def download_song(filename: str):
    """
    Serves a generated song file for download or streaming from songs folder.
    """
    try:
        songs_folder = storage.get_folder_path('songs')
        file_path = os.path.join(songs_folder, filename)

        if not os.path.exists(file_path) or not filename.endswith('.mp3'):
            raise HTTPException(status_code=404, detail="Song not found")

        return FileResponse(file_path, media_type='audio/mpeg', filename=filename)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# Serve album art
@router.get('/album-art/{filename}')
def get_album_art(filename: str):
    """
    Serves album art for a song.
    """
    try:
        album_art_folder = storage.get_folder_path('album_art')
        file_path = os.path.join(album_art_folder, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Album art not found")

        return FileResponse(file_path, media_type='image/jpeg', filename=filename)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# List background images
@router.get('/backgrounds')
def list_backgrounds():
    """
    Returns a list of available background images.
    """
    try:
        backgrounds_folder = storage.get_folder_path('backgrounds')
        if not os.path.exists(backgrounds_folder):
            return {"backgrounds": []}
        
        bg_files = glob.glob(os.path.join(backgrounds_folder, '*.jpg')) + \
                   glob.glob(os.path.join(backgrounds_folder, '*.png'))
        
        backgrounds = []
        for file_path in bg_files:
            filename = os.path.basename(file_path)
            backgrounds.append({
                "filename": filename,
                "url": f"/api/background/{filename}"
            })
        
        return {"backgrounds": backgrounds}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve background image
@router.get('/background/{filename}')
def get_background(filename: str):
    """
    Serves a background image.
    """
    try:
        backgrounds_folder = storage.get_folder_path('backgrounds')
        file_path = os.path.join(backgrounds_folder, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Background not found")

        media_type = 'image/jpeg' if filename.endswith('.jpg') else 'image/png'
        return FileResponse(file_path, media_type=media_type, filename=filename)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-lyric-video")
async def generate_lyric_video(
    title: str = Form(...),
    song_filename: str = Form(None),
    background_filename: str = Form(None),
    lyrics: str = Form(None),
    audio_file: UploadFile = File(None),
    background_file: UploadFile = File(None),
):
    """
    Generates a lyric video.
    Can either select existing song or upload new one.
    Can either select existing background or upload new one.
    """
    try:
        # Check if title already exists for videos
        if storage.check_title_exists(title, check_types=['videos']):
            raise HTTPException(
                status_code=400,
                detail=f"Video title '{title}' already exists. Please choose a different title."
            )
        
        safe_title = storage.sanitize_title(title)
        
        # Handle audio source
        if song_filename:
            # Use existing song from library
            songs_folder = storage.get_folder_path('songs')
            audio_path = os.path.join(songs_folder, song_filename)
            if not os.path.exists(audio_path):
                raise HTTPException(status_code=404, detail="Selected song not found")
        elif audio_file:
            # Upload new audio file
            audio_bytes = await audio_file.read()
            audio_path = storage.local_save_file(audio_bytes, f"{safe_title}_temp.mp3", folder_type='songs')
        else:
            raise HTTPException(status_code=400, detail="Either song_filename or audio_file must be provided")
        
        # Handle background source
        if background_filename:
            # Use existing background
            backgrounds_folder = storage.get_folder_path('backgrounds')
            background_path = os.path.join(backgrounds_folder, background_filename)
            if not os.path.exists(background_path):
                raise HTTPException(status_code=404, detail="Selected background not found")
        elif background_file:
            # Upload new background
            bg_bytes = await background_file.read()
            bg_ext = background_file.filename.split('.')[-1] if '.' in background_file.filename else 'jpg'
            background_path = storage.local_save_file(bg_bytes, f"{safe_title}_bg.{bg_ext}", folder_type='backgrounds')
        else:
            # Use default background if none provided
            backgrounds_folder = storage.get_folder_path('backgrounds')
            default_bg = os.path.join(backgrounds_folder, 'bg1.jpg')
            if os.path.exists(default_bg):
                background_path = default_bg
            else:
                background_path = None
        
        # Handle lyrics - get from existing file or use provided
        lyrics_path = None
        if lyrics:
            # Save provided lyrics
            lyrics_path = storage.local_save_file(lyrics.encode('utf-8'), f"{safe_title}.txt", folder_type='lyrics')
        elif song_filename:
            # Try to find existing lyrics for the song
            lyrics_folder = storage.get_folder_path('lyrics')
            song_base = os.path.splitext(song_filename)[0]
            potential_lyrics = os.path.join(lyrics_folder, f"{song_base}.txt")
            if os.path.exists(potential_lyrics):
                lyrics_path = potential_lyrics
        
        # Generate the video
        result_path = generate_lyric_video_from_files(audio_path, lyrics_path, safe_title, background_path)
        
        # Move the generated video to videos folder
        video_filename = f"{safe_title}.mp4"
        final_video_path = os.path.join(storage.get_folder_path('videos'), video_filename)
        
        # Move result to videos folder
        if os.path.exists(result_path):
            import shutil
            shutil.move(result_path, final_video_path)
        
        return {
            "status": "success",
            "video_path": final_video_path,
            "video_url": f"/api/video/{video_filename}",
            "title": title
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve generated video
@router.get('/video/{filename}')
def get_video(filename: str):
    """
    Serves a generated lyric video.
    """
    try:
        videos_folder = storage.get_folder_path('videos')
        file_path = os.path.join(videos_folder, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video not found")

        return FileResponse(file_path, media_type='video/mp4', filename=filename)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))