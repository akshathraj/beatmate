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