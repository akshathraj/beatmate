# BeatMate Integration Guide

This guide explains how to run the integrated BeatMate backend with the collab-soundboard frontend.

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed
- API keys for:
  - Gemini API (for lyrics generation)
  - MusicGPT API (for song generation)

## Setup Instructions

### 1. Backend Setup (beatmate_backend)

1. Navigate to the backend directory:
   ```bash
   cd beatmate_backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the beatmate_backend directory:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   MUSICGPT_API_KEY=your_musicgpt_api_key_here
   MUSICGPT_WEBHOOK_URL=http://localhost:8000/api/webhook/musicgpt
   ```

5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be available at: `http://localhost:8000`

### 2. Frontend Setup (beatmate_frontend)

1. Navigate to the frontend directory:
   ```bash
   cd beatmate_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at: `http://localhost:5173` (or another port if 5173 is occupied)

## Features

### AI Music Generator
- Enter lyrics or song description
- Select genre from the dropdown
- Choose a duration (15–180 seconds)
- Click "Generate Song with AI" to create music
- Songs are processed asynchronously and saved to the backend

### My Songs
- View all generated songs from the backend
- Play songs directly in the browser
- Download songs as MP3 files
- Refresh button to update the song list

## API Endpoints

The backend provides these endpoints:

- `POST /api/generate-song` - Generate a new song
- `GET /api/songs` - List all generated songs
- `GET /api/download/{filename}` - Download/stream a song file
- `POST /api/webhook/musicgpt` - Webhook for MusicGPT completion

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure the backend is running on port 8000 and the frontend is configured to use `http://localhost:8000`.

### API Keys
Make sure your API keys are correctly set in the `.env` file in the beatmate_backend directory.

### File Permissions
Ensure the `files/` directory in beatmate_backend has write permissions for saving generated songs.

## Files Structure

```
beatmate/
├── beatmate_backend/          # FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI app with CORS
│   │   ├── api.py            # API endpoints
│   │   ├── models.py         # Pydantic models
│   │   └── services/         # Business logic
│   ├── files/                # Generated songs storage
│   └── requirements.txt      # Python dependencies
└── beatmate_frontend/        # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── AIGenerator.tsx  # Song generation UI
    │   │   └── MySongs.tsx      # Songs list UI
    │   └── pages/
    │       └── Dashboard.tsx    # Main dashboard
    └── package.json            # Node dependencies
```
