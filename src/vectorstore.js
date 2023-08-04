// vectorstore.js

import { FaissStore } from "langchain/vectorstores/faiss";
import { console_log,   is_valid } from "./utils.js";

async function create_vectorstore_from_texts(texts, text_ids, embedder)
{
    console_log(`create vectorstore from: texts #= ${texts.length}, text_ids #= ${text_ids.length}, embedder = ${embedder != null}`);
    let vectorstore = await FaissStore.fromTexts(texts, text_ids, embedder);
    return vectorstore;
}

async function query_vectorstore(vector_store, query, nb_of_results = 1, embedder)
{
    const vector_query = await embedder.embedQuery(query);
    const results = await vector_store.similaritySearchVectorWithScore(vector_query, nb_of_results);
    return results;
}


function get_texts_and_ids(chunks)
{
    if (is_valid(chunks) == false) throw new Error(`get_texts_and_ids: chunks_list is invalid`);
    let chunk_texts = [];
    let chunk_ids = [];
    for (let i = 0; i < chunks.length; i++)
    {
        const chunk = chunks[i];

        const chunk_text = chunk.text;
        const chunk_id = chunk.id;

        chunk_ids.push({ id: chunk_id });
        chunk_texts.push(chunk_text);

    }
    return [chunk_texts, chunk_ids];
}


async function compute_vectorstore(chunks, embedder)
{
    // we recompute the vectorstore from each chunk's text each time because the load/save ability of embeddings in langchain 
    // is bound to disk operations and I find it distateful to save to temp files on the disk just to handle that.
    // However, the embedding class itself will check if the embeddings have been
    // computed already and will not recompute them - given the exact same text hash and vectorstore_name.

    console_log(`----= grab_vectorstore: all_chunks# = ${chunks.length} =----`);
    if (is_valid(chunks) == false) throw new Error(`[compute_vectorstore] Error getting chunks from database with id ${JSON.stringify(chunks)}`);

    const [all_texts, all_ids] = get_texts_and_ids(chunks);
    console_log(`all_texts length = ${all_texts.length}, all_ids length = ${all_ids.length}`);
    const vectorstore = await create_vectorstore_from_texts(all_texts, all_ids, embedder);
    return vectorstore;
}



function clean_vectorstore_name(vectorstore_name)
{
    if (is_valid(vectorstore_name) == false) throw new Error(`ERROR: vectorstore_name is invalid`);
    const clean_name = vectorstore_name.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]+/g, "");
    return clean_name;
}

export { query_vectorstore, compute_vectorstore, clean_vectorstore_name }