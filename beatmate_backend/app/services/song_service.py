import requests
from app import config
from fastapi import HTTPException
import time
from typing import Optional

MUSICGPT_API_URL = "https://api.musicgpt.com/api/public/v1/MusicAI"

def generate_song_from_lyrics(
    lyrics: str,
    genre: str,
    title: str = None,
    duration: int = 60,
    voice_type: str = "male",
) -> dict:
    """
    Sends lyrics and genre to MusicGPT API to generate a song.
    Returns the task and conversion IDs (audio comes later via webhook).
    """

    # Choose API key (support rotation if multiple provided)
    api_key: Optional[str] = None
    if getattr(config, "MUSICGPT_API_KEYS", None):
        # simple round-robin across keys
        api_key = _next_api_key()
    else:
        api_key = config.MUSICGPT_API_KEY

    if not api_key:
        raise HTTPException(status_code=500, detail="Music provider API key is missing. Set MUSICGPT_API_KEY or MUSICGPT_API_KEYS in backend .env.")

    # Send common auth header variants (provider may expect Bearer or x-api-key)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }

    voice_instruction = {
        "male": "with male vocals",
        "female": "with female vocals",
        "duet": "as a duet with both male and female vocals",
    }

    prompt = f"Create a {genre} style song {voice_instruction.get(voice_type, 'with male vocals')} based on the following lyrics."
    if title:
        prompt += f" Title: {title}"

    voice_config = {
        "male": {"make_instrumental": False, "vocal_only": False, "voice_id": ""},
        "female": {"make_instrumental": False, "vocal_only": False, "voice_id": "female"},
        "duet": {"make_instrumental": False, "vocal_only": False, "voice_id": "duet"},
    }
    config_values = voice_config.get(voice_type, voice_config["male"])

    payload = {
        "prompt": prompt,
        "music_style": genre,
        "lyrics": lyrics,
        "make_instrumental": config_values["make_instrumental"],
        "vocal_only": config_values["vocal_only"],
        "voice_id": config_values["voice_id"],
        "webhook_url": config.MUSICGPT_WEBHOOK_URL,
        "duration": duration,
    }

    # Try up to 2 attempts on provider rate-limit
    attempts = 0
    while True:
        response = requests.post(MUSICGPT_API_URL, headers=headers, json=payload)
        resp_json = {}
        try:
            resp_json = response.json()
        except Exception:
            pass

        print("=== MusicGPT Initial Response ===")
        print(resp_json)

        # Detect provider rate limit responses
        message_text = (resp_json.get("detail") or resp_json.get("message") or "").upper()
        if response.status_code == 429 or "SLOW DOWN" in message_text or "TOO MANY" in message_text:
            attempts += 1
            if attempts >= 2:
                raise HTTPException(status_code=429, detail="Provider rate limited: please wait ~30-60s and try again.")
            time.sleep(5)  # brief backoff and retry once
            continue

        if not resp_json.get("success"):
            raise HTTPException(status_code=502, detail="Music provider error. Please try again later.")
        break

    return {
        "task_id": resp_json.get("task_id"),
        "conversion_id_1": resp_json.get("conversion_id_1"),
        "conversion_id_2": resp_json.get("conversion_id_2"),
        "eta": resp_json.get("eta"),
        "message": resp_json.get("message")
    }

# ---- simple round-robin over provided keys ----
_rr_index = 0
def _next_api_key() -> Optional[str]:
    global _rr_index
    keys = getattr(config, "MUSICGPT_API_KEYS", []) or []
    if not keys:
        return None
    key = keys[_rr_index % len(keys)]
    _rr_index += 1
    return key