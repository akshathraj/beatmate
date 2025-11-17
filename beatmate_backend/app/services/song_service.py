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

    # Voice instructions for prompt (MusicGPT interprets voice from prompt)
    voice_instruction = {
        "male": "with male vocals",
        "female": "with female vocals",
        "duet": "as a duet with both male and female vocals singing together",
    }

    prompt = f"Create a {genre} style song {voice_instruction.get(voice_type, 'with male vocals')} based on the following lyrics."
    if title:
        prompt += f" Title: {title}"

    # MusicGPT parameters - voice is specified in prompt, not as separate parameter
    # Using make_instrumental=False ensures vocals are generated
    payload = {
        "prompt": prompt,
        "music_style": genre,
        "lyrics": lyrics,
        "make_instrumental": False,  # Always generate vocals
        "vocal_only": False,          # Generate full song with instruments
        "webhook_url": config.MUSICGPT_WEBHOOK_URL,
        "duration": duration,
    }

    print("=== MusicGPT Request ===")
    print(f"Voice Type: {voice_type}")
    print(f"Prompt: {prompt}")
    print(f"Payload keys: {list(payload.keys())}")
    print(f"=" * 50)

    response = requests.post(MUSICGPT_API_URL, headers=headers, json=payload)
    
    print("=== MusicGPT Initial Response ===")
    print(f"Status Code: {response.status_code}")
    
    # Handle error responses (400, 500, etc.)
    if response.status_code != 200:
        error_data = response.json() if response.content else {}
        error_msg = error_data.get('detail') or error_data.get('message') or error_data.get('error') or 'Unknown error'
        print(f"❌ MusicGPT API Error: {error_msg}")
        print(f"Full response: {error_data}")
        raise RuntimeError(f"MusicGPT API error ({response.status_code}): {error_msg}")
    
    resp_json = response.json()
    print(resp_json)

    # Check if response indicates failure
    if not resp_json.get("success"):
        error_reason = resp_json.get('reason') or resp_json.get('detail') or resp_json.get('error') or 'Unknown error'
        print(f"❌ MusicGPT request failed: {error_reason}")
        print(f"Full response: {resp_json}")
        raise RuntimeError(f"MusicGPT request failed: {error_reason}")

    return {
        "task_id": resp_json.get("task_id"),
        "conversion_id_1": resp_json.get("conversion_id_1"),
        "conversion_id_2": resp_json.get("conversion_id_2"),
        "eta": resp_json.get("eta"),
        "message": resp_json.get("message")
    }