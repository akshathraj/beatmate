"""
Supabase-Enabled API Endpoints
All endpoints now require authentication and use Supabase storage
"""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from app.models import GenerateRequest, GenerateResponse, RemixRequest
from app.services import lyrics_service, song_service
from app.services.video_service import generate_lyric_video_from_files
from app.services.supabase_service import get_supabase_service
from app.middleware.auth import get_current_user, AuthUser
from app.utils import supabase_storage
import os
import json
import tempfile
from typing import Optional
import requests

router = APIRouter()

# ============================================
# SONG GENERATION ENDPOINTS
# ============================================

@router.post('/generate-song', response_model=GenerateResponse)
async def generate_song(
    req: GenerateRequest,
    user: AuthUser = Depends(get_current_user)
):
    """
    Generate a new song from lyrics
    Requires authentication
    """
    try:
        # Check if title already exists for this user
        safe_title = supabase_storage.sanitize_title(req.title or "song")
        if supabase_storage.check_title_exists(user.user_id, safe_title):
            raise HTTPException(
                status_code=400,
                detail=f"Title '{req.title}' already exists. Please choose a different title."
            )
        
        # Complete lyrics using Gemini
        complete_lyrics = lyrics_service.generate_complete_lyrics(req.lyrics, req.genre)
        
        # Save generated lyrics to Supabase storage
        lyrics_filename = f"{safe_title}.txt"
        lyrics_result = supabase_storage.upload_file(
            user_id=user.user_id,
            content_bytes=complete_lyrics.encode('utf-8'),
            filename=lyrics_filename,
            folder_type='lyrics',
            content_type='text/plain'
        )
        
        # Generate song (async task with MusicGPT)
        music_task = song_service.generate_song_from_lyrics(
            complete_lyrics, req.genre, title=req.title, voice_type=req.voiceType
        )
        
        # Persist metadata in temp folder for webhook lookup
        try:
            temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            task_id = music_task.get('task_id')
            
            if task_id:
                # Save metadata including user_id for webhook
                meta_path = os.path.join(temp_dir, f"task_{task_id}.meta.json")
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        "title": req.title or "song",
                        "complete_lyrics": complete_lyrics,
                        "user_id": user.user_id,
                        "genre": req.genre,
                        "voice_type": req.voiceType,
                        "lyrics_path": lyrics_result['path']
                    }, f)
                print(f"✅ Metadata saved for task {task_id}")
                
                # Index by conversion IDs
                for conv_id in [music_task.get('conversion_id_1'), music_task.get('conversion_id_2')]:
                    if conv_id and conv_id.strip():
                        conv_path = os.path.join(temp_dir, f"conv_{conv_id.strip()}.meta.json")
                        with open(conv_path, 'w', encoding='utf-8') as f:
                            json.dump({
                                "title": req.title or "song",
                                "task_id": task_id,
                                "user_id": user.user_id
                            }, f)
        except Exception as e:
            print(f"Could not save temp metadata: {e}")
        
        # Return task info
        return GenerateResponse(
            song_url=f"MusicGPT task_id: {music_task['task_id']}",
            local_path=f"Conversion IDs: {music_task['conversion_id_1']}, {music_task['conversion_id_2']}"
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/webhook/musicgpt')
async def musicgpt_webhook(request: Request):
    """
    MusicGPT webhook endpoint
    Receives generated songs and saves to Supabase storage
    """
    payload = await request.json()
    print("=== MusicGPT Webhook Received ===")
    print(payload)
    
    try:
        # Check for failure
        if not payload.get("success", True):
            print(f"❌ MusicGPT generation FAILED")
            failure_reason = payload.get("reason", "Unknown error")
            print(f"   Reason: {failure_reason}")
            
            # Cleanup temp metadata
            task_id = payload.get('task_id')
            if task_id:
                temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp')
                for meta_file in [f"task_{task_id}.meta.json", f"task_{task_id}.user.txt"]:
                    meta_path = os.path.join(temp_dir, meta_file)
                    if os.path.exists(meta_path):
                        os.remove(meta_path)
            
            return {"success": False, "message": "Generation failed", "reason": failure_reason}
        
        # Get metadata from temp folder
        task_id = payload.get('task_id') or payload.get('conversion_task_id')
        if not task_id:
            print("⚠️ No task_id in webhook payload")
            return {"success": False, "error": "No task_id"}
        
        temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp')
        meta_path = os.path.join(temp_dir, f"task_{task_id}.meta.json")
        
        if not os.path.exists(meta_path):
            print(f"⚠️ Metadata not found for task {task_id}")
            return {"success": False, "error": "Metadata not found"}
        
        with open(meta_path, 'r') as f:
            metadata = json.load(f)
        
        user_id = metadata.get('user_id')
        title = metadata.get('title', 'song')
        genre = metadata.get('genre')
        voice_type = metadata.get('voice_type')
        lyrics_path = metadata.get('lyrics_path')
        
        if not user_id:
            print("⚠️ No user_id in metadata")
            return {"success": False, "error": "No user_id"}
        
        # Handle album cover
        subtype = payload.get("subtype", "")
        if subtype == "album_cover_generation":
            album_art_url = payload.get("image_path") or payload.get("album_art") or payload.get("image_url")
            if album_art_url:
                try:
                    response = requests.get(album_art_url)
                    if response.status_code == 200:
                        safe_title = supabase_storage.sanitize_title(title)
                        album_art_filename = f"{safe_title}.jpg"
                        
                        supabase_storage.upload_file(
                            user_id=user_id,
                            content_bytes=response.content,
                            filename=album_art_filename,
                            folder_type='album_art',
                            content_type='image/jpeg'
                        )
                        print(f"✅ Saved album cover: {album_art_filename}")
                        return {"success": True, "message": "Album cover saved"}
                except Exception as e:
                    print(f"⚠️ Error saving album cover: {e}")
            
            return {"success": False, "error": "No album cover URL"}
        
        # Handle song audio
        conversion_path = payload.get("conversion_path")
        if not conversion_path:
            print("⚠️ No conversion_path in payload")
            return {"success": False, "error": "No conversion_path"}
        
        # Download the audio
        audio_response = requests.get(conversion_path)
        if audio_response.status_code != 200:
            print(f"⚠️ Failed to download audio: HTTP {audio_response.status_code}")
            return {"success": False, "error": "Failed to download audio"}
        
        audio_bytes = audio_response.content
        safe_title = supabase_storage.sanitize_title(title)
        supabase = get_supabase_service()
        
        # Use clean filename
        filename = f"{safe_title}.mp3"
        
        # Check if file already exists
        if supabase_storage.check_file_exists(user_id, filename, 'songs'):
            print(f"⏭️ Song already exists: {filename}")
            return {"success": True, "message": "Song already exists"}
        
        # Upload song to Supabase
        song_result = supabase_storage.upload_file(
            user_id=user_id,
            content_bytes=audio_bytes,
            filename=filename,
            folder_type='songs',
            content_type='audio/mpeg'
        )
        print(f"✅ Saved song: {filename}")
        
        # Upload album art if provided
        album_art_path = None
        album_art_filename = f"{safe_title}.jpg"
        
        # Check if album art already exists (might have been saved by album_cover_generation webhook)
        try:
            if supabase_storage.check_file_exists(user_id, album_art_filename, 'album_art'):
                # Album art already exists, just get the path
                album_art_path = f"{user_id}/{album_art_filename}"
                print(f"✅ Album art already exists: {album_art_filename}")
            else:
                # Try to download and save album art
                album_art_url = payload.get("image_path") or payload.get("album_art") or payload.get("image_url")
                if album_art_url:
                    art_response = requests.get(album_art_url)
                    if art_response.status_code == 200:
                        art_result = supabase_storage.upload_file(
                            user_id=user_id,
                            content_bytes=art_response.content,
                            filename=album_art_filename,
                            folder_type='album_art',
                            content_type='image/jpeg'
                        )
                        album_art_path = art_result['path']
                        print(f"✅ Saved album art: {album_art_filename}")
        except Exception as e:
            print(f"⚠️ Could not handle album art: {e}")
        
        # Create database record
        try:
            supabase.create_song_record(
                user_id=user_id,
                title=title,
                filename=filename,
                storage_path=song_result['path'],
                genre=genre,
                voice_type=voice_type,
                lyrics_path=lyrics_path,
                album_art_path=album_art_path
            )
            print(f"✅ Created database record for {title}")
        except Exception as e:
            print(f"⚠️ Could not create database record: {e}")
        
        # Track webhook count to delete metadata after both variants are processed
        # Uses database for atomic operations (production-safe)
        try:
            webhook_count = supabase.increment_webhook_count(task_id)
            print(f"✅ Processed song webhook #{webhook_count} for task {task_id}")
            
            if webhook_count >= 2:
                # Both variants processed, cleanup metadata now
                if os.path.exists(meta_path):
                    os.remove(meta_path)
                    print(f"🗑️ Deleted metadata after processing both variants")
                
                # Cleanup conversion metadata
                for conv_id in [payload.get('conversion_id')]:
                    if conv_id:
                        conv_path = os.path.join(temp_dir, f"conv_{conv_id}.meta.json")
                        if os.path.exists(conv_path):
                            os.remove(conv_path)
                
                # Cleanup webhook tracking from database
                supabase.delete_webhook_tracking(task_id)
        except Exception as e:
            print(f"⚠️ Cleanup error: {e}")
        
        return {"success": True, "message": "Song saved successfully"}
        
    except Exception as e:
        print(f"Webhook processing error: {e}")
        return {"success": False, "error": str(e)}


# ============================================
# SONG LISTING AND DOWNLOAD ENDPOINTS
# ============================================

@router.get('/songs')
async def list_songs(user: AuthUser = Depends(get_current_user)):
    """
    Get all songs for the authenticated user
    """
    try:
        supabase = get_supabase_service()
        songs = supabase.get_user_songs(user.user_id)
        
        # Format response
        formatted_songs = []
        for song in songs:
            # Get album art URL if available
            album_art_url = None
            if song.get('album_art_path'):
                album_art_url = supabase.get_public_url('user-album-art', song['album_art_path'])
            
            # Get lyrics URL if available
            lyrics_url = None
            if song.get('lyrics_path'):
                lyrics_url = supabase.get_public_url('user-lyrics', song['lyrics_path'])
            
            # Get song URL
            song_url = supabase.get_public_url('user-songs', song['storage_path'])
            
            formatted_songs.append({
                "id": song['id'],
                "filename": song['filename'],
                "title": song['title'],
                "genre": song.get('genre'),
                "duration": song.get('duration'),
                "voice_type": song.get('voice_type'),
                "created_at": song['created_at'],
                "download_url": f"/api/download/song/{song['id']}",
                "stream_url": song_url,
                "album_art_url": album_art_url,
                "lyrics_url": lyrics_url
            })
        
        return {"songs": formatted_songs}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/download/song/{song_id}')
async def download_song(
    song_id: str,
    user: AuthUser = Depends(get_current_user)
):
    """
    Download a specific song
    """
    try:
        supabase = get_supabase_service()
        
        # Get song record
        song = supabase.get_song_by_id(song_id, user.user_id)
        if not song:
            raise HTTPException(status_code=404, detail="Song not found")
        
        # Download from Supabase storage
        audio_bytes = supabase.download_file('user-songs', song['storage_path'])
        
        # Return as streaming response
        return StreamingResponse(
            iter([audio_bytes]),
            media_type='audio/mpeg',
            headers={
                'Content-Disposition': f'attachment; filename="{song["filename"]}"'
            }
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/songs/{song_id}')
async def delete_song(
    song_id: str,
    user: AuthUser = Depends(get_current_user)
):
    """
    Delete a song and all its associated files (audio, lyrics, album art)
    """
    try:
        supabase = get_supabase_service()
        
        # Get song record to verify ownership and get file paths
        song = supabase.get_song_by_id(song_id, user.user_id)
        if not song:
            raise HTTPException(status_code=404, detail="Song not found")
        
        # Delete files from Supabase storage
        # Delete song audio
        if song.get('storage_path'):
            try:
                supabase.delete_file('user-songs', song['storage_path'])
            except Exception as e:
                print(f"Error deleting song file: {e}")
        
        # Delete lyrics if exists
        if song.get('lyrics_path'):
            try:
                supabase.delete_file('user-lyrics', song['lyrics_path'])
            except Exception as e:
                print(f"Error deleting lyrics file: {e}")
        
        # Delete album art if exists
        if song.get('album_art_path'):
            try:
                supabase.delete_file('user-album-art', song['album_art_path'])
            except Exception as e:
                print(f"Error deleting album art file: {e}")
        
        # Delete database record
        supabase.delete_song_record(song_id, user.user_id)
        
        return {"message": "Song deleted successfully", "song_id": song_id}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/album-art/{song_id}')
async def get_album_art(
    song_id: str,
    user: AuthUser = Depends(get_current_user)
):
    """
    Get album art for a song
    """
    try:
        supabase = get_supabase_service()
        
        # Get song record
        song = supabase.get_song_by_id(song_id, user.user_id)
        if not song or not song.get('album_art_path'):
            raise HTTPException(status_code=404, detail="Album art not found")
        
        # Download from Supabase storage
        image_bytes = supabase.download_file('user-album-art', song['album_art_path'])
        
        return StreamingResponse(
            iter([image_bytes]),
            media_type='image/jpeg'
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# REMIX ENDPOINT
# ============================================

@router.post('/remix', response_model=GenerateResponse)
async def remix_songs(
    req: RemixRequest,
    user: AuthUser = Depends(get_current_user)
):
    """
    Remix two songs together
    """
    try:
        supabase = get_supabase_service()
        
        # Get both songs
        songs = supabase.get_user_songs(user.user_id)
        song_dict = {s['filename']: s for s in songs}
        
        if req.song_a not in song_dict or req.song_b not in song_dict:
            raise HTTPException(status_code=404, detail="One or both songs not found")
        
        # Load lyrics
        def load_lyrics(song):
            if song.get('lyrics_path'):
                try:
                    lyrics_bytes = supabase.download_file('user-lyrics', song['lyrics_path'])
                    return lyrics_bytes.decode('utf-8')
                except:
                    pass
            return f"Title: {song['title']}"
        
        lyrics_a = load_lyrics(song_dict[req.song_a])
        lyrics_b = load_lyrics(song_dict[req.song_b])
        
        # Create mashup using Gemini AI
        print(f"🎵 Creating intelligent mashup: {req.title}")
        mashup = lyrics_service.mashup_lyrics(
            lyrics_a=lyrics_a,
            lyrics_b=lyrics_b,
            genre=req.genre,
            title=req.title
        )
        
        # Save mashup lyrics
        safe_title = supabase_storage.sanitize_title(req.title)
        lyrics_filename = f"{safe_title}.txt"
        lyrics_result = supabase_storage.upload_file(
            user_id=user.user_id,
            content_bytes=mashup.encode('utf-8'),
            filename=lyrics_filename,
            folder_type='lyrics',
            content_type='text/plain'
        )
        print(f"✅ Saved remix lyrics: {lyrics_filename}")
        
        # Generate song
        music_task = song_service.generate_song_from_lyrics(
            mashup, req.genre, title=req.title, duration=60, voice_type=req.voiceType
        )
        
        # Save metadata for webhook
        try:
            temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            task_id = music_task.get('task_id')
            
            if task_id:
                meta_path = os.path.join(temp_dir, f"task_{task_id}.meta.json")
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        "title": req.title,
                        "complete_lyrics": mashup,
                        "user_id": user.user_id,
                        "genre": req.genre,
                        "voice_type": req.voiceType,
                        "lyrics_path": lyrics_result['path']
                    }, f)
                
                # Index by conversion IDs
                for conv_id in [music_task.get('conversion_id_1'), music_task.get('conversion_id_2')]:
                    if conv_id and conv_id.strip():
                        conv_path = os.path.join(temp_dir, f"conv_{conv_id.strip()}.meta.json")
                        with open(conv_path, 'w', encoding='utf-8') as f:
                            json.dump({
                                "title": req.title,
                                "task_id": task_id,
                                "user_id": user.user_id
                            }, f)
        except Exception as e:
            print(f"⚠️ Could not save remix metadata: {e}")
        
        return GenerateResponse(
            song_url=f"MusicGPT task_id: {music_task['task_id']}",
            local_path=f"Conversion IDs: {music_task['conversion_id_1']}, {music_task['conversion_id_2']}"
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# VIDEO GENERATION ENDPOINTS
# ============================================

@router.post("/generate-lyric-video")
async def generate_lyric_video(
    title: str = Form(...),
    song_filename: str = Form(None),
    background_filename: str = Form(None),
    lyrics: str = Form(None),
    audio_file: UploadFile = File(None),
    background_file: UploadFile = File(None),
    user: AuthUser = Depends(get_current_user)
):
    """
    Generate a lyric video
    """
    try:
        # Check if video title already exists
        safe_title = supabase_storage.sanitize_title(title)
        if supabase_storage.check_title_exists(user.user_id, safe_title, check_types=['videos']):
            raise HTTPException(
                status_code=400,
                detail=f"Video title '{title}' already exists. Please choose a different title."
            )
        
        supabase = get_supabase_service()
        
        # Handle audio source
        audio_path = None
        lyrics_path = None
        song_id = None
        
        if song_filename:
            # Use existing song
            songs = supabase.get_user_songs(user.user_id)
            song = next((s for s in songs if s['filename'] == song_filename), None)
            
            if not song:
                raise HTTPException(status_code=404, detail="Selected song not found")
            
            song_id = song['id']
            
            # Download song to temp file using signed URL (faster, more reliable)
            song_url = supabase.get_public_url('user-songs', song['storage_path'])
            response = requests.get(song_url, timeout=30)
            response.raise_for_status()
            audio_bytes = response.content
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
                tmp.write(audio_bytes)
                audio_path = tmp.name
            
            # Download lyrics if available
            if song.get('lyrics_path'):
                try:
                    lyrics_url = supabase.get_public_url('user-lyrics', song['lyrics_path'])
                    response = requests.get(lyrics_url, timeout=15)
                    response.raise_for_status()
                    lyrics_bytes = response.content
                    
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as tmp:
                        tmp.write(lyrics_bytes)
                        lyrics_path = tmp.name
                    print(f"✅ Found lyrics for {song_filename}")
                except Exception as e:
                    print(f"⚠️ Could not load lyrics: {e}")
        
        elif audio_file:
            # Upload new audio
            audio_bytes = await audio_file.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
                tmp.write(audio_bytes)
                audio_path = tmp.name
        else:
            raise HTTPException(status_code=400, detail="Either song_filename or audio_file must be provided")
        
        # Handle background
        background_path = None
        
        if background_filename:
            # Use existing background (from public bucket) - download via HTTP
            background_url = supabase.get_public_url('backgrounds', background_filename)
            response = requests.get(background_url, timeout=15)
            response.raise_for_status()
            background_bytes = response.content
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                tmp.write(background_bytes)
                background_path = tmp.name
        
        elif background_file:
            # Upload new background
            bg_bytes = await background_file.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                tmp.write(bg_bytes)
                background_path = tmp.name
        
        # Generate video
        try:
            result_path = generate_lyric_video_from_files(
                audio_path,
                lyrics_path,
                safe_title,
                background_path
            )
        except Exception as video_error:
            print(f"❌ Video rendering failed: {video_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Video generation failed: {str(video_error)}"
            )
        
        # Upload video to Supabase
        with open(result_path, 'rb') as f:
            video_bytes = f.read()
        
        video_filename = f"{safe_title}.mp4"
        video_result = supabase_storage.upload_file(
            user_id=user.user_id,
            content_bytes=video_bytes,
            filename=video_filename,
            folder_type='videos',
            content_type='video/mp4'
        )
        
        # Create database record
        supabase.create_video_record(
            user_id=user.user_id,
            title=title,
            filename=video_filename,
            storage_path=video_result['path'],
            song_id=song_id,
            background_path=background_filename
        )
        
        # Cleanup temp files
        for tmp_file in [audio_path, lyrics_path, background_path, result_path]:
            if tmp_file and os.path.exists(tmp_file):
                try:
                    os.remove(tmp_file)
                except:
                    pass
        
        return {
            "status": "success",
            "video_url": video_result['url'],
            "title": title
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Video generation error: {error_trace}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/video/{video_id}')
async def get_video(
    video_id: str,
    user: AuthUser = Depends(get_current_user)
):
    """
    Stream a generated video
    """
    try:
        supabase = get_supabase_service()
        
        # Get video record
        videos = supabase.get_user_videos(user.user_id)
        video = next((v for v in videos if v['id'] == video_id), None)
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Download video
        video_bytes = supabase.download_file('user-videos', video['storage_path'])
        
        return StreamingResponse(
            iter([video_bytes]),
            media_type='video/mp4'
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# BACKGROUND ENDPOINTS
# ============================================

@router.get('/backgrounds')
async def list_backgrounds(user: AuthUser = Depends(get_current_user)):
    """
    List available backgrounds (public bucket)
    """
    try:
        supabase = get_supabase_service()
        files = supabase.list_files('backgrounds', '')
        
        backgrounds = []
        for file in files:
            filename = file.get('name')
            if filename:
                backgrounds.append({
                    "filename": filename,
                    "url": supabase.get_public_url('backgrounds', filename)
                })
        
        return {"backgrounds": backgrounds}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/background/{filename}')
async def get_background(
    filename: str,
    user: AuthUser = Depends(get_current_user)
):
    """
    Get a specific background image
    """
    try:
        supabase = get_supabase_service()
        image_bytes = supabase.download_file('backgrounds', filename)
        
        content_type = 'image/jpeg' if filename.endswith('.jpg') else 'image/png'
        
        return StreamingResponse(
            iter([image_bytes]),
            media_type=content_type
        )
        
    except Exception as e:
        raise HTTPException(status_code=404, detail="Background not found")


# ============================================
# USER PROFILE ENDPOINTS
# ============================================

@router.get('/profile')
async def get_profile(user: AuthUser = Depends(get_current_user)):
    """
    Get user profile
    """
    try:
        supabase = get_supabase_service()
        profile = supabase.get_user_profile(user.user_id)
        
        if not profile:
            # Create default profile if doesn't exist
            profile = {
                "id": user.user_id,
                "email": user.email,
                "full_name": user.user_metadata.get('full_name'),
                "avatar_url": user.user_metadata.get('avatar_url'),
                "username": user.user_metadata.get('username', user.email.split('@')[0]),
                "bio": ""
            }
        
        return profile
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put('/profile')
async def update_profile(
    updates: dict,
    user: AuthUser = Depends(get_current_user)
):
    """
    Update user profile
    """
    try:
        supabase = get_supabase_service()
        updated_profile = supabase.update_user_profile(user.user_id, updates)
        
        return updated_profile
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

