import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

CHROMA_DB_DIR = os.getenv(
    "CHROMA_DB_DIR", str(BASE_DIR / "chroma_db")
)

DOCUMENTS_DIR = os.getenv(
    "DOCUMENTS_DIR", str(BASE_DIR / "documents")
)

UPLOADS_DIR = os.getenv(
    "UPLOADS_DIR", str(BASE_DIR / "uploads")
)

EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2"
)

LLM_MODEL_NAME = os.getenv(
    "LLM_MODEL_NAME", "llama-3.3-70b-versatile"
)

os.makedirs(CHROMA_DB_DIR, exist_ok=True)
os.makedirs(DOCUMENTS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)