import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", "../chroma_db")
DOCUMENTS_DIR = os.getenv("DOCUMENTS_DIR", "../documents")
UPLOADS_DIR = os.getenv("UPLOADS_DIR", "../uploads")

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "llama-3.3-70b-versatile")