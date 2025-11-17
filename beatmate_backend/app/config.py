from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
MUSICGPT_API_KEY = os.environ.get('MUSICGPT_API_KEY')
MUSICGPT_WEBHOOK_URL = os.environ.get('MUSICGPT_WEBHOOK_URL')
ASSEMBLYAI_API_KEY = os.environ.get('ASSEMBLYAI_API_KEY')
BEATMATE_DEMO_FALLBACK = os.environ.get('BEATMATE_DEMO_FALLBACK', 'false').lower() == 'true'