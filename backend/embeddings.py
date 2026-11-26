from functools import lru_cache


@lru_cache(maxsize=1)
def get_embedding_model():
    from fastembed import TextEmbedding

    return TextEmbedding(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        threads=1
    )