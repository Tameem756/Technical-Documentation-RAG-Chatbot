from langchain_chroma import Chroma
from embeddings import get_embedding_model

DB_PATH = "../chroma_db"


class SentenceTransformerEmbeddingFunction:
    def __init__(self):
        self.model = get_embedding_model()

    def embed_documents(self, texts):
        return self.model.encode(texts).tolist()

    def embed_query(self, text):
        return self.model.encode(text).tolist()


embedding_function = SentenceTransformerEmbeddingFunction()

vector_db = Chroma(
    persist_directory=DB_PATH,
    embedding_function=embedding_function
)


def search_documents(query, k=5):
    results = vector_db.similarity_search(query, k=k)
    return results