from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router, ensure_queue_started

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

@app.on_event("startup")
async def _startup():
    await ensure_queue_started()