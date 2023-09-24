//@ts-check
import { MemoryVectorStore } from "langchain/vectorstores/memory";

async function memoryFromTexts(texts, text_ids, embedder) {
    const result = await MemoryVectorStore.fromTexts(texts, text_ids, embedder);
    return result;
}

export { memoryFromTexts };
