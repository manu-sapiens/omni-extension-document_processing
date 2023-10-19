//@ts-check
import { is_valid , user_db_put, user_db_get, get_cached_cdn, get_json_from_cdn } from '../../../../src/utils/omni-utils';

import { memoryFromTexts } from "./vectorstore_Memory.js";
// import { faiss_from_texts } from "./vectorstore_Faiss.js";
// import { lancedb_from_texts, loadDbTable } from "./vectorstore_Lancedb.js";


const FAISS_VECTORSTORE = "FAISS"; // NOT SUPPORTED FOR NOW since I don't want to deal with specific os / .lib dependencies
const MEMORY_VECTORSTORE = "MEMORY";
const LANCEDB_VECTORSTORE = "LANCEDB"; // NOT SUPPORTED FOR NOW
const DEFAULT_VECTORSTORE_TYPE = MEMORY_VECTORSTORE;

export function getIndexesChoices()
{
    const index_choices = {
        "block": `omni-extension-document_processing:document_processing.get_documents_indexes`,
        "args": {".bustCache": true },
        "map": { "root": "indexes" }
    };
    return index_choices;
}

async function createVectorstoreFromChunks(chunks, embedder, vectorstore_type = DEFAULT_VECTORSTORE_TYPE) 
{
    const texts = getChunksTexts(chunks);
    let vectorstore;

    switch (vectorstore_type) {
        case FAISS_VECTORSTORE:
            vectorstore = null;//await faiss_from_texts(texts, text_ids, embedder);
            break;
        case MEMORY_VECTORSTORE:
            vectorstore = await memoryFromTexts(texts, chunks, embedder);
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

function getChunksTexts(chunks)
{
    if (is_valid(chunks) == false) throw new Error(`get_texts_and_ids: chunks_list is invalid`);
    let chunk_texts = [];
    for (let i = 0; i < chunks.length; i++)
    {
        const chunk = chunks[i];

        const chunk_text = chunk.text;
        chunk_texts.push(chunk_text);
    }
    return chunk_texts;
}

function sanitizeIndexName(vectorstore_name)
{
    if (is_valid(vectorstore_name) == false) return null;
    const clean_name = vectorstore_name.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]+/g, "");
    return clean_name;
}

const INDEXES_LIST = "omni_indexes_list";

export async function loadIndexes(ctx) 
{
    const loadedData = await user_db_get(ctx, INDEXES_LIST);
    const indexes = loadedData || {};
    return indexes;
}

export function addCdnToIndex(indexes, indexed_document_info, index_name)
{
    if (index_name in indexes === false || indexes[index_name] === null || indexes[index_name] === undefined || Array.isArray(indexes[index_name]) === false)
    {
        indexes[index_name] = [indexed_document_info];
    }
    else
    {
        indexes[index_name].push(indexed_document_info);
    }
}

export function readCdnsFromIndex(indexes, index_name)
{
    if (index_name in indexes === false || indexes[index_name] === null || indexes[index_name] === undefined || Array.isArray(indexes[index_name]) === false) return null;
    const indexed_document_cdns = indexes[index_name]
    return indexed_document_cdns;
}


    // Function to save keys
export async function saveIndexes(ctx, indexes)
{
    await user_db_put(ctx, indexes, INDEXES_LIST);
}


export async function getVectorstoreChoices(ctx)
{
    const loadedData = await user_db_get(ctx, INDEXES_LIST);
    const vectorstore_keys = loadedData || null;
    if (!vectorstore_keys) return null;

    const choices = [];

    // Iterate through each key in the dictionary
    for (const [vectorstore_name, records] of Object.entries(vectorstore_keys))
    {

        // Check if the value is a non-null array
        if (Array.isArray(records) && records !== null) 
        {
            const length = records.length;
            const choice = { value: vectorstore_name, title: `${vectorstore_name} [${length}]`, description: `${vectorstore_name} with ${length} chunks recorded` };
            // Add information to the result array
            choices.push(choice);
        }

    }
    return choices;
}

export async function getDocumentsIndexes(ctx)
{
    const loadedData = await user_db_get(ctx, INDEXES_LIST);
    let indexes = loadedData || null;
    if (!indexes || Object.keys(indexes).length == 0)
    {
        indexes = {};
        await user_db_put(ctx, indexes, INDEXES_LIST);
    }

    const relevantIndexes = [];

    for (const key in indexes) 
    {
        if (indexes.hasOwnProperty(key)) 
        {
            const value = indexes[key];
            if (Array.isArray(value) && (value.length > 0) )
            {
                relevantIndexes.push({ key: key, length: value.length });
            }
        }
    }

    return relevantIndexes;
}

export async function getIndexedDocumentCdnFromId(ctx, document_id, overwrite = false) 
{
  const document_cdn = await get_cached_cdn(ctx, document_id, overwrite);
  // note it is OK for this to be null (i.e. we did not find it in the DB)
  return document_cdn;
}

export async function getIndexedDocumentInfoFromCdn(ctx, document_cdn)
{
  const document_info = await get_json_from_cdn(ctx, document_cdn);
  if (!document_info) throw new Error(`ERROR: could not get document_json from cdn`);

  return document_info;
}

export async function getChunksFromIndexAndIndexedDocuments(ctx, indexes, index, indexed_documents)
{
  let all_chunks = [];

  let indexed_document_cdns = [];
  if (index && index != "") indexed_document_cdns = readCdnsFromIndex(indexes, index);
  if (indexed_documents && Array.isArray(indexed_documents) && indexed_documents.length > 0) indexed_document_cdns = indexed_document_cdns.concat(indexed_documents);
  if (!indexed_document_cdns || Array.isArray(indexed_document_cdns) == false) throw new Error(`Error no documents passed either as an Index or directly.`);

  for (const indexed_document_cdn of indexed_document_cdns)  
  {
    const document_info = await getIndexedDocumentInfoFromCdn(ctx, indexed_document_cdn);
    if (!document_info) throw new Error(`ERROR: could not get document_info from cdn ${JSON.stringify(indexed_document_cdn)}`);

    const indexed_document_chunks = document_info.chunks;
    if (!indexed_document_chunks || Array.isArray(indexed_document_chunks) == false || indexed_document_chunks.length == 0) continue;
    all_chunks = all_chunks.concat(indexed_document_chunks);
  }

  return all_chunks;
}


export { queryVectorstore , sanitizeIndexName, createVectorstoreFromChunks }