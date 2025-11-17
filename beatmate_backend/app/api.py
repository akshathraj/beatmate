from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from app.models import GenerateRequest, GenerateResponse, RemixRequest
from app.services import lyrics_service, song_service
import os
import glob
import json
from app.services.video_service import generate_lyric_video_from_files
from app.utils import storage
from app.auth import get_current_user
from app.config import supabase, SUPABASE_URL
from app.utils.storage import upload_bytes, get_signed_url
import uuid
import time
import httpx
import os
from typing import Dict, Any
import asyncio

router = APIRouter()

# ---------- Minimal in-memory queue for generate-song ----------
_job_queue: "asyncio.Queue[Dict[str, Any]]" = asyncio.Queue()
_job_status: Dict[str, Dict[str, Any]] = {}
_worker_started: bool = False

async def _generate_worker():
    global LAST_GENERATE_FINISHED_AT, _per_source_last
    while True:
        job = await _job_queue.get()
        job_id = job.get("job_id")
        _job_status[job_id] = {"status": "processing"}
        try:
            req: GenerateRequest = job["req"]
            user_id_meta: str | None = job.get("user_id")
            source_key: str = user_id_meta or (job.get("ip") or "unknown")

            # Respect global and per-source cooldowns (sleep instead of rejecting)
            now = time.time()
            global_remaining = max(0, GLOBAL_BACKOFF_SECONDS - int(now - LAST_GENERATE_FINISHED_AT))
            if global_remaining > 0:
                await asyncio.sleep(global_remaining)
            now = time.time()
            per_remaining = max(0, PER_SOURCE_COOLDOWN_SECONDS - int(now - _per_source_last.get(source_key, 0.0)))
            if per_remaining > 0:
                await asyncio.sleep(per_remaining)

            # Complete lyrics
            complete_lyrics = lyrics_service.generate_complete_lyrics(req.lyrics, req.genre)
            safe_title = storage.sanitize_title(req.title or "song")
            lyrics_path = os.path.join(storage.get_folder_path('lyrics'), f"{safe_title}.txt")
            with open(lyrics_path, 'w', encoding='utf-8') as f:
                f.write(complete_lyrics)

            # Call provider
            music_task = song_service.generate_song_from_lyrics(
                complete_lyrics, req.genre, title=req.title
            )

            # Persist meta for webhook (includes user_id so we can insert DB row)
            try:
                files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
                os.makedirs(files_dir, exist_ok=True)
                task_id = music_task.get('task_id')
                if task_id:
                    temp_path = os.path.join(files_dir, f"task_{task_id}.user.txt")
                    with open(temp_path, 'w', encoding='utf-8') as f:
                        f.write(req.lyrics or '')
                    meta_path = os.path.join(files_dir, f"task_{task_id}.meta.json")
                    with open(meta_path, 'w', encoding='utf-8') as f:
                        json.dump({
                            "title": (req.title or "song"),
                            "complete_lyrics": complete_lyrics,
                            "user_id": user_id_meta
                        }, f)
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

            _job_status[job_id] = {
                "status": "submitted",
                "task_id": music_task.get("task_id"),
                "conversion_id_1": music_task.get("conversion_id_1"),
                "conversion_id_2": music_task.get("conversion_id_2"),
            }
        except Exception as e:
            _job_status[job_id] = {"status": "error", "error": str(e)}
        finally:
            LAST_GENERATE_FINISHED_AT = time.time()
            src = job.get("user_id") or job.get("ip") or "unknown"
            _per_source_last[src] = time.time()
            _job_queue.task_done()

async def ensure_queue_started():
    global _worker_started
    if not _worker_started:
        asyncio.create_task(_generate_worker())
        _worker_started = True

# Auth: return current user info
@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user

# --- Cooldowns to reduce provider rate limits ---
# Small global backoff between any two requests (seconds)
GLOBAL_BACKOFF_SECONDS: int = int(os.environ.get("GLOBAL_BACKOFF_SECONDS", "5"))
LAST_GENERATE_FINISHED_AT: float = 0.0

# Per-source (user or IP) cooldown (seconds). Override via env if needed.
PER_SOURCE_COOLDOWN_SECONDS: int = int(os.environ.get("PER_SOURCE_COOLDOWN_SECONDS", "45"))
_per_source_last: Dict[str, float] = {}

# Step 1 + 2: Generate a song request (async)
@router.post('/generate-song', response_model=GenerateResponse)
async def generate_song(req: GenerateRequest, request: Request):
    try:
        await ensure_queue_started()
        # Determine user (optional) for ownership and cooldown key
        user_id_meta = None
        try:
            auth = request.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                token = auth.split(" ", 1)[1]
                client = httpx.Client(base_url=SUPABASE_URL, timeout=10.0)
                try:
                    r = client.get("/auth/v1/user", headers={"Authorization": f"Bearer {token}"})
                    if r.status_code == 200:
                        user_id_meta = (r.json() or {}).get("id")
                finally:
                    client.close()
        except Exception:
            user_id_meta = None
        # Check if title already exists
        if storage.check_title_exists(req.title or "song"):
            raise HTTPException(
                status_code=400,
                detail=f"Title '{req.title}' already exists. Please choose a different title."
            )
        # Enqueue job
        job_id = str(uuid.uuid4())
        job = {
            "job_id": job_id,
            "req": req,
            "user_id": user_id_meta,
            "ip": request.client.host if request.client else None,
        }
        _job_status[job_id] = {"status": "queued"}
        await _job_queue.put(job)
        position = _job_queue.qsize()
        # Return a placeholder response compatible with current UI
        return GenerateResponse(
            song_url=f"Queued job_id: {job_id}",
            local_path=f"Queue position: {position}"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/queue/{job_id}")
async def queue_status(job_id: str):
    return _job_status.get(job_id, {"status": "unknown"})

@router.get("/health/supabase")
def supabase_health():
    """
    Returns the Supabase project the backend is using and a simple storage check.
    """
    try:
        project_ref = None
        if SUPABASE_URL and "https://" in SUPABASE_URL and ".supabase.co" in SUPABASE_URL:
            try:
                project_ref = SUPABASE_URL.split("https://", 1)[1].split(".supabase.co", 1)[0]
            except Exception:
                project_ref = None
        info = {
            "configured": bool(supabase),
            "supabase_url": SUPABASE_URL,
            "project_ref": project_ref,
            "storage_list_ok": False,
        }
        if not supabase:
            return info
        try:
            # Try listing 'songs/public' to verify storage access
            supabase.storage.from_("songs").list("public")
            info["storage_list_ok"] = True
        except Exception as e:
            info["storage_error"] = str(e)
        return info
    except Exception as e:
        return {"configured": False, "error": str(e)}

@router.get("/my-songs")
async def my_songs(user=Depends(get_current_user)):
    """
    Returns the authenticated user's songs from Supabase DB with signed URLs.
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        user_id = user["id"]
        # Fetch rows for this user
        resp = supabase.table("songs").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        rows = resp.data or []
        results = []
        for row in rows:
            storage_path = row.get("storage_path") or ""
            album_art_path = row.get("album_art_path") or None
            # Generate signed URLs
            signed_url = None
            art_url = None
            try:
                if storage_path:
                    signed_url = get_signed_url("songs", storage_path, 3600)
            except Exception:
                signed_url = None
            try:
                if album_art_path:
                    art_url = get_signed_url("album_art", album_art_path, 3600)
            except Exception:
                art_url = None
            results.append({
                "title": row.get("title"),
                "created_at": row.get("created_at"),
                "size": row.get("size_bytes"),
                "download_url": signed_url,
                "album_art_url": art_url,
                "storage_path": storage_path,
            })
        return {"songs": results}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/resolve-username")
async def resolve_username(payload: dict):
    """
    Resolve username -> email from profiles. If input looks like an email, return it directly.
    Body: { "username": "<username or email>" }
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        username = (payload or {}).get("username", "").strip()
        if not username:
            raise HTTPException(status_code=400, detail="username is required")
        # If user typed an email, just return it
        if "@" in username:
            return {"email": username}
        # Lookup in profiles
        resp = supabase.table("profiles").select("email").eq("username", username).limit(1).execute()
        rows = resp.data or []
        if not rows or not rows[0].get("email"):
            raise HTTPException(status_code=404, detail="Username not found")
        return {"email": rows[0]["email"]}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public-songs")
async def public_songs():
    """
    Lists songs stored under the 'public/' prefix in Supabase Storage.
    Useful for generations that happened while the user was not logged in.
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        # List objects in 'public' folder of 'songs' bucket
        files = supabase.storage.from_("songs").list("public")
        items = files or []
        results = []
        for f in items:
            name = f.get("name") or ""
            # Only .mp3 files
            if not name.lower().endswith(".mp3"):
                continue
            storage_path = f"public/{name}"
            try:
                signed = get_signed_url("songs", storage_path, 3600)
            except Exception:
                signed = None
            base = os.path.splitext(name)[0]
            # Parse title from "<safe_title>__<uuid>"
            title = base.split("__")[0] if "__" in base else base
            results.append({
                "filename": name,
                "title": title,
                "size": f.get("metadata", {}).get("size") if isinstance(f.get("metadata"), dict) else 0,
                "created_at": None,
                "download_url": signed or "",
                "album_art_url": None,
            })
        # newest first by name timestamp if any (best-effort)
        results.sort(key=lambda x: x.get("filename",""), reverse=True)
        return {"songs": results}
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

            r = requests.get(conversion_path)
            audio_bytes = r.content

            # If Supabase configured, upload there; else save locally (legacy)
            uploaded_storage_path = None
            album_art_storage_path = None
            if supabase:
                try:
                    # Try to recover user_id from saved meta
                    files_dir_meta = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
                    task_id_meta = payload.get('task_id') or payload.get('conversion_task_id')
                    user_id_saved = None
                    if task_id_meta:
                        meta_path = os.path.join(files_dir_meta, f"task_{task_id_meta}.meta.json")
                        if os.path.exists(meta_path):
                            with open(meta_path, 'r', encoding='utf-8') as mf:
                                meta = json.load(mf)
                                user_id_saved = (meta.get('user_id') or '').strip() or None

                    # Upload song bytes
                    song_uuid = str(uuid.uuid4())
                    prefix = (user_id_saved or "public")
                    file_base = f"{storage.sanitize_title(title)}__{song_uuid}"
                    uploaded_storage_path = f"{prefix}/{file_base}.mp3"
                    upload_bytes("songs", uploaded_storage_path, audio_bytes, content_type="audio/mpeg")
                    print(f"✅ Uploaded song to Supabase: {uploaded_storage_path}")

                    # Save album art if provided
                    try:
                        album_art_url = payload.get("album_art") or payload.get("image_url")
                        if album_art_url:
                            art_response = requests.get(album_art_url)
                            if art_response.status_code == 200:
                                album_art_storage_path = f"{prefix}/{file_base}.jpg"
                                upload_bytes("album_art", album_art_storage_path, art_response.content, content_type="image/jpeg")
                                print(f"✅ Uploaded album art: {album_art_storage_path}")
                    except Exception as ae:
                        print(f"Could not upload album art: {ae}")

                    # Insert DB row if we have a user_id (RLS requires non-null)
                    try:
                        if user_id_saved:
                            supabase.table("songs").insert({
                                "user_id": user_id_saved,
                                "title": safe_title,
                                "storage_path": uploaded_storage_path,
                                "album_art_path": album_art_storage_path,
                                "size_bytes": len(audio_bytes)
                            }).execute()
                            print(f"✅ Inserted DB row for song: {safe_title}")
                    except Exception as de:
                        print(f"DB insert failed: {de}")
                except Exception as ue:
                    print(f"Supabase upload failed, falling back to local save: {ue}")
                    uploaded_storage_path = None

            if not uploaded_storage_path:
                # Legacy local save path
                base_filename = f"{safe_title}.mp3"
                alt_filename = f"{safe_title}_ignore.mp3"
                songs_folder = storage.get_folder_path('songs')
                base_path = os.path.join(songs_folder, base_filename)
                alt_path = os.path.join(songs_folder, alt_filename)
                if not os.path.exists(base_path):
                    chosen_filename = base_filename
                    local_path = storage.local_save_file(audio_bytes, chosen_filename, folder_type='songs')
                elif not os.path.exists(alt_path):
                    chosen_filename = alt_filename
                    local_path = storage.local_save_file(audio_bytes, chosen_filename, folder_type='songs')
                else:
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

            # If a temp user-lyrics file exists for this task, push to Supabase 'lyrics' (or promote locally)
            try:
                task_id = payload.get('task_id') or payload.get('conversion_task_id')
                if task_id:
                    files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
                    temp_path = os.path.join(files_dir, f"task_{task_id}.user.txt")
                    if os.path.exists(temp_path):
                        try:
                            with open(temp_path, 'rb') as tf:
                                lyrics_bytes = tf.read()
                            if uploaded_storage_path and supabase:
                                # Store next to the song prefix with same uuid
                                prefix = "/".join(uploaded_storage_path.split("/")[:-1])
                                file_base = os.path.splitext(os.path.basename(uploaded_storage_path))[0]
                                lyrics_path_sb = f"{prefix}/{file_base}.txt"
                                upload_bytes("lyrics", lyrics_path_sb, lyrics_bytes, content_type="text/plain; charset=utf-8")
                                print(f"✅ Uploaded lyrics to Supabase: {lyrics_path_sb}")
                            else:
                                base_no_ext = os.path.splitext(os.path.basename(local_path))[0]
                                lyrics_folder = storage.get_folder_path('lyrics')
                                lyrics_path = os.path.join(lyrics_folder, f"{base_no_ext}.txt")
                                os.replace(temp_path, lyrics_path)
                                print(f"✅ Promoted user lyrics to: {lyrics_path}")
                        except Exception as pe:
                            print(f"Lyrics promotion failed: {pe}")
                        # Cleanup meta files for this task and its conversions
                        meta_path = os.path.join(files_dir, f"task_{task_id}.meta.json")
                        try:
                            if os.path.exists(meta_path):
                                os.remove(meta_path)
                                print(f"🗑️  Deleted task metadata: task_{task_id}.meta.json")
                        except Exception as e:
                            print(f"⚠️  Failed to delete task metadata: {e}")
                        # Remove conversion-indexed meta if present
                        try:
                            conv_id = payload.get('conversion_id') or ''
                            if conv_id:
                                conv_meta_path = os.path.join(files_dir, f"conv_{conv_id}.meta.json")
                                if os.path.exists(conv_meta_path):
                                    os.remove(conv_meta_path)
                                    print(f"🗑️  Deleted conversion metadata: conv_{conv_id}.meta.json")
                        except Exception as e:
                            print(f"⚠️  Failed to delete conversion metadata: {e}")
            except Exception as le:
                print(f"Could not promote user lyrics to final file: {le}")
            # Try to save lyrics to storage (or local) for future remixing
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
                    try:
                        if uploaded_storage_path and supabase:
                            prefix = "/".join(uploaded_storage_path.split("/")[:-1])
                            file_base = os.path.splitext(os.path.basename(uploaded_storage_path))[0]
                            lyrics_path_sb = f"{prefix}/{file_base}.txt"
                            upload_bytes("lyrics", lyrics_path_sb, lyrics_text.encode("utf-8"), content_type="text/plain; charset=utf-8")
                            print(f"✅ Uploaded lyrics text to: {lyrics_path_sb}")
                        else:
                            base_no_ext = os.path.splitext(os.path.basename(local_path))[0]
                            # Skip saving lyrics for _ignore variants (they have same lyrics as primary)
                            if not base_no_ext.endswith('_ignore'):
                                lyrics_folder = storage.get_folder_path('lyrics')
                                lyrics_path = os.path.join(lyrics_folder, f"{base_no_ext}.txt")
                                with open(lyrics_path, 'w', encoding='utf-8') as f:
                                    f.write(lyrics_text)
                                print(f"✅ Saved lyrics to: {lyrics_path}")
                            else:
                                print(f"⏭️  Skipped saving duplicate lyrics for _ignore variant")
                    except Exception as le2:
                        print(f"⚠️ Could not store lyrics text: {le2}")
            except Exception as le:
                print(f"⚠️ Could not save lyrics text: {le}")
        return {"success": True}

    except Exception as e:
        print(f"Webhook processing error: {e}")
        return {"success": False, "error": str(e)}


# Remix two songs by extracting/mashing-up lyrics then generating new track
@router.post('/remix', response_model=GenerateResponse)
def remix_songs(req: RemixRequest):
    try:
        # Locate songs in songs folder
        songs_folder = storage.get_folder_path('songs')
        lyrics_folder = storage.get_folder_path('lyrics')
        path_a = os.path.join(songs_folder, req.song_a)
        path_b = os.path.join(songs_folder, req.song_b)
        if not os.path.exists(path_a) or not os.path.exists(path_b):
            raise HTTPException(status_code=404, detail="One or both songs not found")

        # Try to load saved lyrics from lyrics folder; fallback to filename as seed
        def load_lyrics_for(fn: str) -> str:
            base = os.path.splitext(fn)[0]
            txt_path = os.path.join(lyrics_folder, f"{base}.txt")
            if os.path.exists(txt_path):
                try:
                    with open(txt_path, 'r', encoding='utf-8') as f:
                        return f.read()
                except Exception:
                    pass
            return f"Title: {base}"

        lyrics_a = load_lyrics_for(req.song_a)
        lyrics_b = load_lyrics_for(req.song_b)

        # Use Gemini AI to create an intelligent, creative mashup
        print(f"🎵 Creating intelligent mashup for: {req.title}")
        print(f"   Song A: {req.song_a}")
        print(f"   Song B: {req.song_b}")
        print(f"   Genre: {req.genre}")
        
        mashup = lyrics_service.mashup_lyrics(
            lyrics_a=lyrics_a,
            lyrics_b=lyrics_b,
            genre=req.genre,
            title=req.title
        )
        
        # Save mashup lyrics to lyrics folder
        lyrics_folder = storage.get_folder_path('lyrics')
        safe_title = storage.sanitize_title(req.title)
        mashup_lyrics_path = os.path.join(lyrics_folder, f"{safe_title}.txt")
        with open(mashup_lyrics_path, 'w', encoding='utf-8') as f:
            f.write(mashup)
        print(f"✅ Saved remix lyrics to: {mashup_lyrics_path}")

        music_task = song_service.generate_song_from_lyrics(
            mashup, req.genre, title=req.title, duration=60, voice_type=req.voiceType
        )
        
        # Save metadata so webhook can use the correct title
        try:
            files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
            task_id = music_task.get('task_id')
            if task_id:
                # Save meta (title) so webhook can use user title instead of provider's
                meta_path = os.path.join(files_dir, f"task_{task_id}.meta.json")
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        "title": req.title,
                        "complete_lyrics": mashup
                    }, f)
                print(f"✅ Saved remix metadata: {meta_path}")
                
                # Also index by conversion IDs so the webhook can resolve by either
                conv1 = (music_task.get('conversion_id_1') or '').strip()
                conv2 = (music_task.get('conversion_id_2') or '').strip()
                if conv1:
                    with open(os.path.join(files_dir, f"conv_{conv1}.meta.json"), 'w', encoding='utf-8') as f:
                        json.dump({"title": req.title}, f)
                if conv2:
                    with open(os.path.join(files_dir, f"conv_{conv2}.meta.json"), 'w', encoding='utf-8') as f:
                        json.dump({"title": req.title}, f)
        except Exception as se:
            print(f"⚠️ Could not save remix metadata: {se}")

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
            # Hide the '_ignore' alternate in UI by skipping it from listing
            if base_no_ext.endswith('_ignore'):
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
    user=Depends(get_current_user),
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
        
        # Handle audio source + lyrics detection
        lyrics_path = None
        
        if song_filename:
            # 🎵 Use existing song from library
            songs_folder = storage.get_folder_path('songs')
            audio_path = os.path.join(songs_folder, song_filename)
            if not os.path.exists(audio_path):
                raise HTTPException(status_code=404, detail="Selected song not found")
            
            # 🎯 Check for corresponding lyrics file (will be mapped with AssemblyAI timing!)
            lyrics_folder = storage.get_folder_path('lyrics')
            song_base = os.path.splitext(song_filename)[0]
            potential_lyrics = os.path.join(lyrics_folder, f"{song_base}.txt")
            
            if os.path.exists(potential_lyrics):
                lyrics_path = potential_lyrics
                print(f"✅ Found lyrics file for {song_filename}: {potential_lyrics}")
                print(f"   -> Will map AssemblyAI timing to your formatted lyrics!")
                print(f"   -> (Preserves punctuation, capitalization, formatting)")
            else:
                print(f"ℹ️  No lyrics file found for {song_filename}")
                print(f"   -> Will use AssemblyAI transcription directly")
                
        elif audio_file:
            # 📤 Upload new audio file (user-provided)
            audio_bytes = await audio_file.read()
            audio_path = storage.local_save_file(audio_bytes, f"{safe_title}_temp.mp3", folder_type='songs')
            print(f"📤 User uploaded audio file")
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
        
        # Generate the video
        result_path = generate_lyric_video_from_files(audio_path, lyrics_path, safe_title, background_path)
        
        # Move the generated video to videos folder
        video_filename = f"{safe_title}.mp4"
        final_video_path = os.path.join(storage.get_folder_path('videos'), video_filename)
        
        # Move result to videos folder
        if os.path.exists(result_path):
            import shutil
            shutil.move(result_path, final_video_path)
        
        # If Supabase is not configured, return local file reference
        if not supabase:
            return {
                "status": "success",
                "video_path": final_video_path,
                "video_url": f"/api/video/{video_filename}",
                "title": title
            }

        # Upload to Supabase Storage and insert DB row
        user_id = user["id"]
        with open(final_video_path, "rb") as f:
            video_bytes = f.read()
        storage_path = f"{user_id}/{uuid.uuid4()}.mp4"
        upload_bytes("videos", storage_path, video_bytes, content_type="video/mp4")
        supabase.table("videos").insert({
            "user_id": user_id,
            "title": title,
            "storage_path": storage_path
        }).execute()
        signed = get_signed_url("videos", storage_path, 3600)
        return {
            "status": "success",
            "storage_path": storage_path,
            "signed_url": signed,
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

# Upload a user song and save metadata
@router.post("/upload/song")
async def upload_song(
    title: str = Form(...),
    audio_file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    user_id = user["id"]
    data = await audio_file.read()
    storage_path = f"{user_id}/{uuid.uuid4()}.mp3"
    upload_bytes("songs", storage_path, data, content_type="audio/mpeg")
    supabase.table("songs").insert({
        "user_id": user_id,
        "title": title,
        "storage_path": storage_path,
        "size_bytes": len(data)
    }).execute()
    url = get_signed_url("songs", storage_path, 3600)
    return {"title": title, "path": storage_path, "url": url}