import requests
from app import config

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

    headers = {
        "Authorization": config.MUSICGPT_API_KEY,
        "Content-Type": "application/json"
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

    response = requests.post(MUSICGPT_API_URL, headers=headers, json=payload)
    resp_json = response.json()

    print("=== MusicGPT Initial Response ===")
    print(resp_json)

    if not resp_json.get("success"):
        raise RuntimeError(f"MusicGPT request failed: {resp_json}")

    return {
        "task_id": resp_json.get("task_id"),
        "conversion_id_1": resp_json.get("conversion_id_1"),
        "conversion_id_2": resp_json.get("conversion_id_2"),
        "eta": resp_json.get("eta"),
        "message": resp_json.get("message")
    }