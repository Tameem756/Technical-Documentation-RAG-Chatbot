from langchain_chroma import Chroma
from langchain_core.documents import Document
from vectorstore import embedding_function
from config import CHROMA_DB_DIR


def get_vector_db():

    return Chroma(
        persist_directory=CHROMA_DB_DIR,
        embedding_function=embedding_function
    )


def store_chunks(chunks: list[str], filename: str) -> int:

    documents = [
        Document(
            page_content=chunk,
            metadata={
                "source": filename,
                "chunk": i + 1
            }
        )
        for i, chunk in enumerate(chunks)
    ]

    vector_db = get_vector_db()

    vector_db.add_documents(documents)

    return len(documents)


def search_documents(query: str, k: int = 5):

    vector_db = get_vector_db()

    return vector_db.similarity_search(
        query,
        k=k
    )