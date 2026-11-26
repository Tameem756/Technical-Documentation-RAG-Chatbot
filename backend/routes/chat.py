from fastapi import APIRouter
from pydantic import BaseModel

from rag_chain import generate_answer

router = APIRouter(tags=["Chat"])


class ChatRequest(BaseModel):
    question: str


@router.post("/chat")
def chat(request: ChatRequest):
    return generate_answer(request.question)