from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# ============================================
# IMPORTANT: Choose your API version
# ============================================
# For Supabase integration (recommended for production):
from app.api_supabase import router

# For local file storage (legacy):
# from app.api import router
# ============================================

app = FastAPI(
    title="BeatMate Backend",
    description="AI-powered music generation platform with Supabase integration",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5174",
        # Production - Vercel
        "https://*.vercel.app",  # All Vercel deployments
        # Add your custom domain here when ready
        # "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deployments
)

app.include_router(router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "mode": "supabase"
    }

# Mount static files directory (for backward compatibility with local storage)
# This can be removed if using Supabase exclusively
files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'files')
if os.path.exists(files_dir):
    app.mount("/files", StaticFiles(directory=files_dir), name="files")