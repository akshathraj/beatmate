# BeatMate Backend
This backend provides a single-step AI pipeline:
1. Receive lyric snippet and genre from frontend.
2. Complete lyrics using Gemini API.
3. Generate a full song (mp3) using MusicGPT API.


## Steps:
Create a virtual environment named `venv`:
```bash
python -m venv venv
```
Activate the virtual environment:
```bash
venv\Scripts\activate
```

Install dependencies from `requirements.txt`:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Download ngrok and follow the instructions:
https://dashboard.ngrok.com/get-started/setup/windows

Run the following in the command line or in ngrok.exe:
```bash
ngrok http 8000
```

Add API keys and ngrok link to the .env file:
```bash
GEMINI_API_KEY=your_gemini_api_key
MUSICGPT_API_KEY=your_musicgpt_api_key
MUSICGPT_WEBHOOK_URL=your_ngrok_link/api/webhook/musicgpt
```

Run the application:
```bash
uvicorn app.main:app --reload
```

API Call via Swagger: `your_ngrok_link/docs` or `http://127.0.0.1:8000/docs`

Endpoint:
POST `/api/generate-song` with JSON body:
```json
{
  "lyrics": "[Verse] I hear voices in my head...",
  "genre": "pop",
  "title": "Voices"
}
```

Output Song: Generated in `/files`
