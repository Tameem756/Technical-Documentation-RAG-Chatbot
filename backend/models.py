from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    filename: str
    characters: int
    total_chunks: int
    stored_chunks: int
    database: str = "ChromaDB"
    status: str = "Stored Successfully"


class SearchResultItem(BaseModel):
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]


class ChatRequest(BaseModel):
    question: str
    top_k: int = 5


class ChatSource(BaseModel):
    content: str
    source: Optional[str] = None
    chunk: Optional[int] = None


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: List[ChatSource] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str = "healthy"
