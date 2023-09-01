//@ts-check
// vectorstoreMemory.js
import { MemoryVectorStore } from "langchain/vectorstores/memory";

async function memory_from_texts(texts, text_ids, embedder) {
    return await MemoryVectorStore.fromTexts(texts, text_ids, embedder);
}

export { memory_from_texts };
