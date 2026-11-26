# Technical Documentation RAG

A modular, production-ready Retrieval-Augmented Generation (RAG) system designed for querying and interacting with technical documentation, manuals, and PDF references.

---

## 📁 Project Structure

```text
Technical-Documentation-RAG
│
├── backend
│   ├── app.py                     # FastAPI application entrypoint
│   ├── config.py                  # Backend configuration & environment loader
│   ├── embeddings.py              # SentenceTransformer embedding model
│   ├── ingest.py                  # Batch document ingestion pipeline
│   ├── llm.py                     # LLM initialization (OpenAI Chat)
│   ├── models.py                  # Pydantic request & response models
│   ├── prompts.py                 # RAG prompt templates
│   ├── rag_chain.py               # End-to-end RAG chain
│   ├── retriever.py               # Document retrieval logic
│   ├── utils.py                   # Document & text utilities
│   ├── vectorstore.py             # Chroma vector database initialization
│   ├── requirements.txt           # Backend dependencies
│   ├── .env                       # Environment variables
│   │
│   ├── routes                     # FastAPI route controllers
│   │   ├── __init__.py
│   │   ├── upload.py              # PDF upload & indexing endpoint
│   │   ├── search.py              # Semantic search endpoint
│   │   └── chat.py                # RAG conversation endpoint
│   │
│   └── services                   # Business logic layer
│       ├── __init__.py
│       ├── pdf_service.py         # PDF text extraction and chunking
│       ├── vector_service.py      # Chroma vector DB operations
│       └── llm_service.py         # Context formatting & RAG generation
│
├── frontend
│   ├── app.py                     # Main Streamlit user interface
│   ├── config.py                  # Frontend configurations
│   ├── utils.py                   # API interaction helpers
│   ├── assets/                    # CSS stylesheets and media
│   └── pages/                     # Multi-page Streamlit views
│
├── chroma_db/                     # Persistent Chroma vector store
├── documents/                     # Raw technical documents
├── uploads/                       # Uploaded files
├── logs/                          # System and application logs
├── venv/                          # Python virtual environment
└── README.md                      # Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Active virtual environment (`venv`)

### 2. Install Dependencies
```bash
# Activate your virtual environment
# Windows:
.\venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt
pip install streamlit
```

### 3. Environment Configuration
Create or configure `backend/.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
CHROMA_DB_DIR=../chroma_db
DOCUMENTS_DIR=../documents
UPLOADS_DIR=../uploads
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
LLM_MODEL_NAME=gpt-4o-mini
HOST=0.0.0.0
PORT=8000
```

---

## 🏃 Running the Application

### Start Backend (FastAPI)
```bash
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation will be available at: `http://localhost:8000/docs`

### Start Frontend (Streamlit)
In a separate terminal window:
```bash
cd frontend
streamlit run app.py
```

---

## 📡 API Endpoints

| Method | Endpoint   | Description |
|:-------|:-----------|:------------|
| `GET`  | `/health`  | Health check |
| `POST` | `/upload`  | Upload a PDF, chunk, and index into ChromaDB |
| `GET`  | `/search`  | Semantic similarity search across indexed documents |
| `POST` | `/chat`    | Ask questions grounded in retrieved documentation |
