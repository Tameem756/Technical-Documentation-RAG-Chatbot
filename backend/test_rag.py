from rag_chain import generate_answer

question = "What skills does Tameem have?"

result = generate_answer(question)

print("\nANSWER:\n")
print(result["answer"])

print("\nSOURCES:\n")
for source in result["sources"]:
    print(source)