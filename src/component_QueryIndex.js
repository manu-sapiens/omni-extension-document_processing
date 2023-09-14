//@ts-check
// QueryChunksComponent.js
import { createComponent } from 'omnilib-utils/component.js';
import { computeVectorstore, clean_vectorstore_name } from './omnilib-docs/vectorstore.js';
import { smartquery_from_vectorstore } from './smartquery.js';
import { getLlmChoices, DEFAULT_LLM_MODEL_ID } from 'omnilib-llms/llms.js';
import { initializeEmbedder } from './omnilib-docs/embeddings.js';
import { GLOBAL_INDEX_NAME, loadIndexes, readCdnsFromIndex as readCdnsFromIndex } from './omnilib-docs/vectorstore.js';
import { getIndexedDocumentInfoFromCdn } from './omnilib-docs/chunking.js';

const NAMESPACE = 'document_processing';
const OPERATION_ID = "query_index";
const TITLE = 'Query Index'
const DESCRIPTION = 'Answer the Query using all document in the given Index, using OpenAI embeddings and Langchain'
const SUMMARY = 'Answer the Query using all document in the given Index, using OpenAI embeddings and Langchain'
const CATEGORY = 'document processing'

const indexes_block_name = `omni-extension-document_processing:document_processing.get_documents_indexes`;
const index_choices = {
    "block": indexes_block_name,
    "args": {},
    "map": { "root": "indexes" }
};

async function async_getQueryIndexComponent()
{
  const links=  {
    "Langchainjs Website": "https://docs.langchain.com/docs/",
    "Documentation": "https://js.langchain.com/docs/",
    "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
  };

  const llm_choices = await getLlmChoices();
  const inputs = [
    { name: 'query', type: 'string', customSocket: 'text' },
    { name: 'indexed_documents', title: 'Indexed Documents to Query', type: 'array', customSocket: 'documentArray', description: 'Documents to be queried', allowMultiple: true },
    { name: 'existing_index', title: 'Existing Index', type: 'string', defaultValue: GLOBAL_INDEX_NAME, choices: index_choices, description: "If set, will ingest into the existing index with the given name"},
    { name: 'model_id', type: 'string', defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices },
    { name: 'new_index', title: 'index', type: 'string', description: "All injested information sharing the same Index will be grouped and queried together"},
  ];

  const outputs = [
    { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query or prompt', title: 'Answer' },
  ];

  const controls = null;

  const component = createComponent(NAMESPACE, OPERATION_ID, TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, queryIndex);
  return component;
}


async function queryIndex(payload, ctx)
{

  const query = payload.query;
  const model_id = payload.model_id;
  const new_index = clean_vectorstore_name(payload.new_index);
  const existing_index = payload.existing_index;
  const indexed_documents = payload.indexed_documents;

  let index_name = new_index;
  if ( (!new_index || new_index.length == 0) && ( existing_index && existing_index.length > 0) ) 
  {
      index_name = existing_index;
  }
  if (!index_name || index_name.length == 0) index_name = GLOBAL_INDEX_NAME;

  console.time("query_chunks_component_processTime");




  const embedder = await initializeEmbedder(ctx);
  if (!embedder) throw new Error(`Cannot initialize embedded`);


  const indexes = await loadIndexes(ctx);
  if (!indexes) throw new Error(`[query_chunks_component] Error loading indexes`); 

  if (index_name in indexes == false) throw new Error(`[query_chunks_component] index ${index_name} not found in indexes`);

  let indexed_document_cdns = readCdnsFromIndex(indexes, index_name);
  if (indexed_documents && Array.isArray(indexed_documents) && indexed_documents.length > 0) indexed_document_cdns = indexed_document_cdns.concat(indexed_documents);

  if (!indexed_document_cdns || Array.isArray(indexed_document_cdns) == false ) throw new Error(`[query_chunks_component] Error reading from index ${index_name}`);

  if ( indexed_document_cdns.length == 0) throw new Error(`Index ${index_name} is empty`);


  let all_chunks = [];
  for (const indexed_document_cdn of indexed_document_cdns)  
  {
    const document_info = await getIndexedDocumentInfoFromCdn(ctx, indexed_document_cdn);
    if (!document_info) throw new Error(`ERROR: could not get document_info from cdn ${JSON.stringify(indexed_document_cdn)}`);

    const indexed_document_chunks = document_info.chunks;
    if (!indexed_document_chunks || Array.isArray(indexed_document_chunks) == false || indexed_document_chunks.length == 0) continue;
    all_chunks = all_chunks.concat(indexed_document_chunks);
  }
  const vectorstore = await computeVectorstore(all_chunks, embedder); 

  if (!vectorstore) throw new Error(`ERROR: could not compute Index ${index_name} from ${all_chunks.length} fragments`);

  const query_result = await smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model_id);
  
  console.timeEnd("query_chunks_component_processTime");
  return { result: { "ok": true }, answer: query_result };

}

export { async_getQueryIndexComponent as async_getQueryindexComponent, queryIndex };
