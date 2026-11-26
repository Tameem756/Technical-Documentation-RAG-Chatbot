from fastapi import FastAPI

from routes.upload import router as upload_router
from routes.search import router as search_router
from routes.chat import router as chat_router

app = FastAPI(
    title="Technical Documentation RAG Chatbot",
    description="Backend API for the Technical Documentation RAG Chatbot",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Technical Documentation RAG Chatbot API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


app.include_router(upload_router)
app.include_router(search_router)
app.include_router(chat_router)