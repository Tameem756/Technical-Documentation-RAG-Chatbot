from langchain_core.prompts import ChatPromptTemplate

RAG_PROMPT = ChatPromptTemplate.from_template("""
You are a helpful AI assistant that answers questions ONLY from the provided context.

Rules:
1. Use only the information in the context.
2. Do not make up answers.
3. If the answer is not found in the context, reply:
   "I couldn't find that information in the uploaded documents."

Context:
{context}

Question:
{question}

Answer:
""")