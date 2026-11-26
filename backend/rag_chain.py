from retriever import search_documents
from llm import get_llm
from prompts import RAG_PROMPT


llm = get_llm()


def generate_answer(question: str):

    docs = search_documents(question)

    context = "\n\n".join(
        [doc.page_content for doc in docs]
    )

    prompt = RAG_PROMPT.format(
        context=context,
        question=question
    )

    response = llm.invoke(prompt)

    return {
        "answer": response.content,
        "sources": [
            doc.metadata for doc in docs
        ]
    }