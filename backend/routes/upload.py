from fastapi import APIRouter, UploadFile, File
import os
import shutil

from utils import extract_text_from_pdf, chunk_text
from vectorstore import create_vector_store

router = APIRouter(tags=["Upload"])

UPLOAD_FOLDER = "../uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Only PDF files are allowed."}

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_pdf(file_path)

    chunks = chunk_text(text)

    stored_chunks = create_vector_store(chunks, file.filename)

    return {
        "filename": file.filename,
        "characters": len(text),
        "total_chunks": len(chunks),
        "stored_chunks": stored_chunks,
        "database": "ChromaDB",
        "status": "Stored Successfully"
    }