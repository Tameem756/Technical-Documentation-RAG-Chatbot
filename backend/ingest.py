import os
from pathlib import Path
from typing import List
from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from vectorstore import get_vectorstore
from config import DOCUMENTS_DIR

def load_document(file_path: str):
    """Loads a single document based on its extension."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext in [".md", ".markdown"]:
        try:
            loader = UnstructuredMarkdownLoader(file_path)
        except Exception:
            loader = TextLoader(file_path, encoding="utf-8")
    else:
        loader = TextLoader(file_path, encoding="utf-8")
    return loader.load()

def ingest_directory(directory_path: str = DOCUMENTS_DIR, chunk_size: int = 1000, chunk_overlap: int = 200):
    """Ingests all supported documents from a directory into the vector store."""
    path = Path(directory_path)
    if not path.exists():
        return {"status": "error", "message": f"Directory not found: {directory_path}"}

    docs = []
    supported_extensions = [".pdf", ".txt", ".md"]
    for file in path.rglob("*"):
        if file.suffix.lower() in supported_extensions:
            try:
                docs.extend(load_document(str(file)))
            except Exception as e:
                print(f"Error loading {file}: {e}")

    if not docs:
        return {"status": "warning", "message": "No documents found to ingest."}

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = text_splitter.split_documents(docs)

    vectorstore = get_vectorstore()
    vectorstore.add_documents(chunks)

    return {
        "status": "success",
        "documents_loaded": len(docs),
        "chunks_indexed": len(chunks)
    }

if __name__ == "__main__":
    result = ingest_directory()
    print("Ingestion result:", result)
