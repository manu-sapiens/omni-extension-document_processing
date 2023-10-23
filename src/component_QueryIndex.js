/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */

//@ts-check
// QueryChunksComponent.js
import { createComponent } from '../../../src/utils/omni-utils';
import { getLlmChoices, is_valid, getModelMaxSize, getModelNameAndProviderFromId, DEFAULT_LLM_MODEL_ID } from '../../../src/utils/omni-utils';

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
    { name: 'index', title: `Read from Index:`, type: 'string', description: "All indexed documents sharing the same Index will be grouped and queried together" },
    { name: 'context_size', type: 'number', defaultValue: 4096, choices: [0, 2048, 4096, 8192, 16384, 32768, 100000], description: "If set > 0, the size of the context window (in token) to use to process the query. If 0, try to use the model max_size automatically." },
    { name: 'provide_citation', type: 'boolean', defaultValue: false},
  ];

  const outputs = [
    { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query', title: 'Answer' },
    { name: 'info', type: 'string', customSocket: 'text', description: "Information about the block's operation"},
  ];

  const controls = null;

  const component = createComponent(NAMESPACE, OPERATION_ID, TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, queryIndex);
  return component;
}

async function queryIndex(payload, ctx)
{
  console.time("queryIndex");
  let info = "queryIndex.\n|  ";
  const query = payload.query;
  const model_id = payload.model_id;
  const indexed_documents = payload.indexed_documents;
  const index = payload.index || "";
  const context_size = payload.context_size;
  const provide_citation = payload.provide_citation;

  let max_size = context_size * 0.9; // we use some margin

  if (context_size == 0) 
  {
    const splits = getModelNameAndProviderFromId(model_id);
    const model_name = splits.model_name;
    max_size = getModelMaxSize(model_name, false) * 0.9; // use the same margin
  }
  
  const embedder = await initializeEmbedder(ctx);
  if (!embedder) throw new Error(`Cannot initialize embedded`);

  const all_indexes = await loadIndexes(ctx);
  if (!all_indexes) throw new Error(`[query_chunks_component] Error loading indexes`);
  if (!index || index == "" )
  {
    info += `WARNING: No index used.\n|  `; 
    if (!is_valid(indexed_documents)) throw new Error(`Without passing an index, you need to pass at least one document to query`);
  }
  else
  {
    if (index in all_indexes == false) throw new Error(`Index ${index} not found in indexes`);
  }

  const all_chunks = await getChunksFromIndexAndIndexedDocuments(ctx, all_indexes, index, indexed_documents);
  if (!is_valid(all_chunks)) throw new Error(`No fragments returned from index ${index} or documents ${indexed_documents}`);

  const vectorstore = await createVectorstoreFromChunks(all_chunks, embedder);
  if (!vectorstore) throw new Error(`ERROR: could not compute Index ${index} from ${all_chunks.length} fragments`);

  const answer_json = await smartqueryFromVectorstore(ctx, vectorstore, query, embedder, model_id, max_size, provide_citation);
  const answer = answer_json.answer;
  const new_info = answer_json.info;

  info += new_info;

  console.timeEnd("queryIndex");
  return { result: { "ok": true }, answer, info };
}

export { async_getQueryIndexComponent as async_getQueryIndexComponent, queryIndex };
