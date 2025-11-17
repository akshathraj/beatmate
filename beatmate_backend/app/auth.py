from fastapi import HTTPException, Request
import httpx
from app.config import SUPABASE_URL

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth.split(" ", 1)[1]
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{SUPABASE_URL}/auth/v1/user", headers={"Authorization": f"Bearer {token}"})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return r.json()


