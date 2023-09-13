//@ts-check
// import { faiss_from_texts } from "./vectorstore_Faiss.js";
// import { lancedb_from_texts, loadDbTable } from "./vectorstore_Lancedb.js";
import { memoryFromTexts } from "./vectorstore_Memory.js";
import { console_log,   is_valid } from 'omnilib-utils/utils.js';

const FAISS_VECTORSTORE = "FAISS"; // NOT SUPPORTED FOR NOW since I don't want to deal with specific os / .lib dependencies
const MEMORY_VECTORSTORE = "MEMORY";
const LANCEDB_VECTORSTORE = "LANCEDB"; // NOT SUPPORTED FOR NOW
const DEFAULT_VECTORSTORE_NAME = 'my_library_00';
const DEFAULT_VECTORSTORE_TYPE = MEMORY_VECTORSTORE;

async function createVectorstoreFromTexts(texts, text_ids, embedder, vectorstore_type = DEFAULT_VECTORSTORE_TYPE, vectorstore_name = DEFAULT_VECTORSTORE_NAME) 
{
    console_log(`create vectorstore from: texts #= ${texts.length}, text_ids #= ${text_ids.length}, embedder = ${embedder != null}`);

    let vectorstore;

    switch (vectorstore_type) {
        case FAISS_VECTORSTORE:
            vectorstore = null;//await faiss_from_texts(texts, text_ids, embedder);
            break;
        case MEMORY_VECTORSTORE:
            vectorstore = await memoryFromTexts(texts, text_ids, embedder);
            break;
        case LANCEDB_VECTORSTORE:
            vectorstore = null;
            //const table = await loadDbTable(vectorstore_name);
            //const dbConfig = { table };
            //vectorstore = await lancedb_from_texts(texts, text_ids, embedder, dbConfig);
            break;
        default:
            throw new Error(`Vectorstore type ${vectorstore_type} not recognized`);
    }

    return vectorstore;
}

async function queryVectorstore(vector_store, query, nb_of_results = 1, embedder)
{
    const vector_query = await embedder.embedQuery(query, false);
    const results = await vector_store.similaritySearchVectorWithScore(vector_query, nb_of_results);
    return results;
}


function getTextsAndIds(chunks)
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


async function computeVectorstore(chunks, embedder)
{
    // we recompute the vectorstore from each chunk's text each time because the load/save ability of embeddings in langchain 
    // is bound to disk operations and I find it distateful to save to temp files on the disk just to handle that.
    // However, the embedding class itself will check if the embeddings have been
    // computed already and will not recompute them - given the exact same text hash and vectorstore_name.

    console_log(`----= grab_vectorstore: all_chunks# = ${chunks.length} =----`);
    if (is_valid(chunks) == false) throw new Error(`[computeVectorstore] Error getting chunks from database with id ${JSON.stringify(chunks)}`);

    const [all_texts, all_ids] = getTextsAndIds(chunks);
    console_log(`all_texts length = ${all_texts.length}, all_ids length = ${all_ids.length}`);
    const vectorstore = await createVectorstoreFromTexts(all_texts, all_ids, embedder);
    return vectorstore;
}

async function loadVectorstore(embedder)
{
    // we recompute the vectorstore from each chunk's text each time because the load/save ability of embeddings in langchain 
    // is bound to disk operations and I find it distateful to save to temp files on the disk just to handle that.
    // However, the embedding class itself will check if the embeddings have been
    // computed already and will not recompute them - given the exact same text hash and vectorstore_name.

    const [all_texts, all_ids] = await embedder.getAllTextsAndIds();
    const vectorstore = await createVectorstoreFromTexts(all_texts, all_ids, embedder);
    return vectorstore;
}

function clean_vectorstore_name(vectorstore_name)
{
    if (is_valid(vectorstore_name) == false) return null;
    const clean_name = vectorstore_name.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]+/g, "");
    return clean_name;
}

export { queryVectorstore as query_vectorstore, computeVectorstore, clean_vectorstore_name, loadVectorstore, DEFAULT_VECTORSTORE_NAME }