from langchain_chroma import Chroma
from langchain_core.documents import Document

from embeddings import get_embedding_model

DB_PATH = "../chroma_db"


class SentenceTransformerEmbeddings:
    def __init__(self):
        self.model = get_embedding_model()

    def embed_documents(self, texts):
        return self.model.encode(texts).tolist()

    def embed_query(self, text):
        return self.model.encode(text).tolist()


embedding_function = SentenceTransformerEmbeddings()


def create_vector_store(chunks, filename):

    documents = []

    for i, chunk in enumerate(chunks):

        documents.append(
            Document(
                page_content=chunk,
                metadata={
                    "source": filename,
                    "chunk": i + 1
                }
            )
        )

    vector_db = Chroma(
        persist_directory=DB_PATH,
        embedding_function=embedding_function
    )

    vector_db.add_documents(documents)

    return len(documents)