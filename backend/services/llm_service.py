from services.vector_service import search_documents
from llm import get_llm
from prompts import get_rag_prompt
from langchain_core.output_parsers import StrOutputParser


def generate_rag_response(question: str, top_k: int = 5) -> dict:
    """Retrieves relevant context and uses the LLM to generate an answer."""
    docs = search_documents(question, k=top_k)

    context_text = "\n\n".join(
        f"[Source: {doc.metadata.get('source', 'unknown')} | Chunk: {doc.metadata.get('chunk', 'N/A')}]\n{doc.page_content}"
        for doc in docs
    )

    llm = get_llm()
    prompt = get_rag_prompt()
    chain = prompt | llm | StrOutputParser()

    answer = chain.invoke({
        "context": context_text if context_text.strip() else "No relevant documents found.",
        "question": question
    })

    sources = [
        {
            "content": doc.page_content,
            "source": doc.metadata.get("source"),
            "chunk": doc.metadata.get("chunk")
        }
        for doc in docs
    ]

    return {
        "question": question,
        "answer": answer,
        "sources": sources
    }
