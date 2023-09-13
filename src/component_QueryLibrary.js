//@ts-check
// QueryChunksComponent.js
import { createComponent } from 'omnilib-utils/component.js';
import { loadVectorstore, DEFAULT_VECTORSTORE_NAME } from './omnilib-docs/vectorstore.js';
import { smartquery_from_vectorstore } from './smartquery.js';
import { getLlmChoices, DEFAULT_LLM_MODEL_ID } from 'omnilib-llms/llms.js';
import { loadEmbedderParameters } from './omnilib-docs/embedder.js';
import { DEFAULT_HASHER_MODEL } from './omnilib-docs/hashers.js';
import { initializeEmbedder, DEFAULT_EMBEDDER_MODEL } from './omnilib-docs/embeddings.js';

const NAMESPACE = 'document_processing';
const OPERATION_ID = "query_library";
const TITLE = 'Query Library'
const DESCRIPTION = 'Answer the Query using all document in the given Library'
const SUMMARY = 'Answer the Query using all document in the given Library, using OpenAI embeddings and Langchain'
const CATEGORY = 'document processing'

const libraries_block_name = `omni-extension-document_processing:document_processing.get_vectorstore_libraries`;
const library_choices = {
    "block": libraries_block_name,
    "args": {},
    "cache": "user",
    "map": { "root": "libraries" }
};

async function async_getQueryLibraryComponent()
{
  const links=  {
    "Langchainjs Website": "https://docs.langchain.com/docs/",
    "Documentation": "https://js.langchain.com/docs/",
    "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
  };

  const llm_choices = await getLlmChoices();
  const inputs = [
    { name: 'query', type: 'string', customSocket: 'text' },
    { name: 'model_id', type: 'string', defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices },
    { name: 'existing_library', title:'Library', type: 'string', defaultValue: `${DEFAULT_VECTORSTORE_NAME}   [empty]`, choices: library_choices, description: "If set, will ingest into the existing library with the given name"},

  ];

  const outputs = [
    { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query or prompt', title: 'Answer' },
  ];

  const controls = null;

  const component = createComponent(NAMESPACE, OPERATION_ID, TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, queryLibrary);
  return component;
}


async function queryLibrary(payload, ctx)
{

  const query = payload.query;
  const model_id = payload.model_id;
  let library_name = null;
  const existing_library = payload.existing_library;
  if ( existing_library && existing_library.length > 0) 
  {
      let parts = existing_library.split("   ");  // Split the string by three spaces
      library_name = parts[0];
  }
  if (!library_name || library_name.length == 0) throw new Error(`ERROR: no library name passed for ingestion`);

  console.time("query_chunks_component_processTime");
  let vectorstore = null;
  let embedder = null;
  const embedder_parameters = await loadEmbedderParameters(ctx, library_name);
  const hasher_model = embedder_parameters?.hasher_model || DEFAULT_HASHER_MODEL;
  const embedder_model = embedder_parameters?.embedder_model || DEFAULT_EMBEDDER_MODEL;
  embedder = await initializeEmbedder(ctx, embedder_model, hasher_model, library_name);
  if (!embedder) throw new Error(`[query_chunks_component] Error loading vectorstore with embedder_model = ${embedder_model}, hasher_model = ${hasher_model}, Library = ${library_name}`)
 
  vectorstore = await loadVectorstore(embedder);
  if (!vectorstore) throw new Error(`[query_chunks_component] Error loading vectorstore with embedder_model = ${embedder_model}, hasher_model = ${hasher_model}, Library = ${library_name}`)

  const query_result = await smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model_id);
  console.timeEnd("query_chunks_component_processTime");
  return { result: { "ok": true }, answer: query_result };

}


export { async_getQueryLibraryComponent, queryLibrary };
