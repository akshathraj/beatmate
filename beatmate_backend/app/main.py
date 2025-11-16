from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import router
import os

app = FastAPI(title="BeatMate Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "http://localhost:8081"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

# Mount static files directory to serve lyrics, songs, album art, etc.
files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
if os.path.exists(files_dir):
    app.mount("/files", StaticFiles(directory=files_dir), name="files")