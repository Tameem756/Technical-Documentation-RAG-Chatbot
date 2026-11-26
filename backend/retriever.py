from langchain_chroma import Chroma
from vectorstore import embedding_function
from config import CHROMA_DB_DIR


def search_documents(query, k=5):

    vector_db = Chroma(
        persist_directory=CHROMA_DB_DIR,
        embedding_function=embedding_function
    )

    results = vector_db.similarity_search(
        query,
        k=k
    )

    return results