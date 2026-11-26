import os
from langchain_chroma import Chroma
from langchain_core.documents import Document
from embeddings import get_embedding_model
from config import CHROMA_DB_DIR


class SentenceTransformerEmbeddings:
    def __init__(self):
        self.model = get_embedding_model()

    def embed_documents(self, texts):
        return self.model.encode(texts).tolist()

    def embed_query(self, text):
        return self.model.encode(text).tolist()


def get_vector_db():
    """Initializes and returns the Chroma vector database instance."""
    embedding_function = SentenceTransformerEmbeddings()
    return Chroma(
        persist_directory=CHROMA_DB_DIR,
        embedding_function=embedding_function
    )


def store_chunks(chunks: list[str], filename: str) -> int:
    """Stores text chunks in ChromaDB with source and chunk metadata."""
    documents = [
        Document(
            page_content=chunk,
            metadata={"source": filename, "chunk": i + 1}
        )
        for i, chunk in enumerate(chunks)
    ]
    vector_db = get_vector_db()
    vector_db.add_documents(documents)
    return len(documents)


def search_documents(query: str, k: int = 5):
    """Searches for similar documents in ChromaDB."""
    vector_db = get_vector_db()
    return vector_db.similarity_search(query, k=k)
