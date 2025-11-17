from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
MINIMAX_API_KEY = os.environ.get('MINIMAX_API_KEY')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
MUSICGPT_API_KEY = os.environ.get('MUSICGPT_API_KEY')
MUSICGPT_WEBHOOK_URL = os.environ.get('MUSICGPT_WEBHOOK_URL')
BEATMATE_DEMO_FALLBACK = os.environ.get('BEATMATE_DEMO_FALLBACK', 'false').lower() == 'true'

# ---- Supabase client (server-side) ----
from supabase import create_client, Client  # type: ignore

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = None  # type: ignore
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ---- Provider API keys (optional: multiple keys for rotation) ----
_keys_raw = os.environ.get("MUSICGPT_API_KEYS", "")
MUSICGPT_API_KEYS = [k.strip() for k in _keys_raw.split(",") if k.strip()] if _keys_raw else []