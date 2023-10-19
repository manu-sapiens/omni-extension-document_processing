//@ts-check
// QueryChunksComponent.js
import { createComponent } from '../../../src/utils/omni-utils';
import { getLlmChoices, DEFAULT_LLM_MODEL_ID } from '../../../src/utils/omni-utils';

import { createVectorstoreFromChunks } from './omnilib-docs/vectorstore.js';
import { smartqueryFromVectorstore } from './smartquery.js';
import { initializeEmbedder } from './omnilib-docs/embeddings.js';
import { loadIndexes, getChunksFromIndexAndIndexedDocuments } from './omnilib-docs/vectorstore.js';

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
    { name: 'indexed_documents', title: 'Indexed Documents to Query', type: 'array', customSocket: 'documentArray', description: 'Documents to be directly queried instead of being passed as an Index', allowMultiple: true },
    { name: 'model_id', type: 'string', defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices },
    { name: 'index', type: 'string', description: "All indexed documents sharing the same Index will be grouped and queried together" },
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
  const index = payload.index || "";
  const embedder = await initializeEmbedder(ctx);
  if (!embedder) throw new Error(`Cannot initialize embedded`);

  const all_indexes = await loadIndexes(ctx);
  if (!all_indexes) throw new Error(`[query_chunks_component] Error loading indexes`);
  if (!index || index == "" )
  {
    if (!indexed_documents || indexed_documents.length == 0) throw new Error(`Without passing an index, you need to pass at least one document to query`);
  }
  else
  {
    if (index in all_indexes == false) throw new Error(`Index ${index} not found in indexes`);
  }

  const all_chunks = await getChunksFromIndexAndIndexedDocuments(ctx, all_indexes, index, indexed_documents);
  const vectorstore = await createVectorstoreFromChunks(all_chunks, embedder);
  if (!vectorstore) throw new Error(`ERROR: could not compute Index ${index} from ${all_chunks.length} fragments`);

  const query_result = await smartqueryFromVectorstore(ctx, vectorstore, query, embedder, model_id);

  console.timeEnd("queryIndex");
  return { result: { "ok": true }, answer: query_result };
}

export { async_getQueryIndexComponent as async_getQueryIndexComponent, queryIndex };
