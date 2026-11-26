from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from embeddings import get_embedding_model
from config import CHROMA_DB_DIR

DB_PATH = CHROMA_DB_DIR


class SentenceTransformerEmbeddings(Embeddings):

    def embed_documents(self, texts):

        model = get_embedding_model()

        embeddings = model.embed(
            texts,
            batch_size=4
        )

        return [
            embedding.tolist()
            for embedding in embeddings
        ]

    def embed_query(self, text):

        model = get_embedding_model()

        embedding = next(
            model.embed([text], batch_size=1)
        )

        return embedding.tolist()


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