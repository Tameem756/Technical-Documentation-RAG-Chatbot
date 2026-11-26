from fastapi import APIRouter
from retriever import search_documents

router = APIRouter(tags=["Search"])


@router.get("/search")
def search(query: str):

    results = search_documents(query)

    output = []

    for doc in results:
        output.append(
            {
                "content": doc.page_content,
                "metadata": doc.metadata
            }
        )

    return {
        "query": query,
        "total_results": len(output),
        "results": output
    }