//@ts-check
// QueryChunksComponent.js
import { createComponent } from 'omnilib-utils/component.js';
import { computeVectorstore, sanitizeIndexName } from './omnilib-docs/vectorstore.js';
import { smartqueryFromVectorstore } from './smartquery.js';
import { getLlmChoices, DEFAULT_LLM_MODEL_ID } from 'omnilib-llms/llms.js';
import { initializeEmbedder } from './omnilib-docs/embeddings.js';
import { GLOBAL_INDEX_NAME, loadIndexes, readCdnsFromIndex, getIndexesChoices, getIndexName, getChunksFromIndexAndIndexedDocuments } from './omnilib-docs/vectorstore.js';


const NAMESPACE = 'document_processing';
const OPERATION_ID = "query_index";
const TITLE = 'Query Index';
const DESCRIPTION = 'Answer the Query using all document in the given Index, using OpenAI embeddings and Langchain';
const SUMMARY = 'Answer the Query using all document in the given Index, using OpenAI embeddings and Langchain';
const CATEGORY = 'document processing';

const indexes_block_name = `omni-extension-document_processing:document_processing.get_documents_indexes`;
const index_choices = {
  "block": indexes_block_name,
  "args": {},
  "map": { "root": "indexes" }
};

async function async_getQueryIndexComponent()
{
  const links = {
    "Langchainjs Website": "https://docs.langchain.com/docs/",
    "Documentation": "https://js.langchain.com/docs/",
    "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
  };

  const llm_choices = await getLlmChoices();
  const inputs = [
    { name: 'query', type: 'string', customSocket: 'text' },
    { name: 'indexed_documents', title: 'Indexed Documents to Query', type: 'array', customSocket: 'documentArray', description: 'Documents to be queried', allowMultiple: true },
    { name: 'model_id', type: 'string', defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices },
    { name: 'existing_index', title: 'Existing Index', type: 'string', defaultValue: GLOBAL_INDEX_NAME, choices: getIndexesChoices(), description: "If set, will ingest into the existing index with the given name" },
    { name: 'new_index', title: 'index', type: 'string', description: "All injested information sharing the same Index will be grouped and queried together" },
  ];

  const outputs = [
    { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query', title: 'Answer' },
  ];

  const controls = null;

  const component = createComponent(NAMESPACE, OPERATION_ID, TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, queryIndex);
  return component;
}

async function queryIndex(payload, ctx)
{
  console.time("queryIndex");

  const query = payload.query;
  const model_id = payload.model_id;
  const indexed_documents = payload.indexed_documents;
  const index_name = getIndexName(payload.existing_index, payload.new_index);
  const embedder = await initializeEmbedder(ctx);
  if (!embedder) throw new Error(`Cannot initialize embedded`);

  const indexes = await loadIndexes(ctx);
  if (!indexes) throw new Error(`[query_chunks_component] Error loading indexes`);
  if (index_name in indexes == false) throw new Error(`[query_chunks_component] index ${index_name} not found in indexes`);

  const all_chunks = await getChunksFromIndexAndIndexedDocuments(ctx, indexes, index_name, indexed_documents);
  const vectorstore = await computeVectorstore(all_chunks, embedder);
  if (!vectorstore) throw new Error(`ERROR: could not compute Index ${index_name} from ${all_chunks.length} fragments`);

  const query_result = await smartqueryFromVectorstore(ctx, vectorstore, query, embedder, model_id);

  console.timeEnd("queryIndex");
  return { result: { "ok": true }, answer: query_result };
}

export { async_getQueryIndexComponent as async_getQueryIndexComponent, queryIndex };
