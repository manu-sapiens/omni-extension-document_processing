//@ts-check
// QueryChunksComponent.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { omnilog } from 'mercs_shared';
import { setComponentInputs, setComponentOutputs, setComponentControls } from 'omnilib-utils/component.js';
const NS_ONMI = 'document_processing';


import { get_json_from_cdn } from 'omnilib-utils/cdn.js';
import { is_valid } from 'omnilib-utils/utils.js';
import { computeVectorstore, loadVectorstore } from './omnilib-docs/vectorstore.js';
import { smartquery_from_vectorstore } from './smartquery.js';
import { getLlmChoices, DEFAULT_LLM_MODEL_ID } from "omnilib-llms/llms.js";
import { getVectorstoreChoices, loadEmbedderParameters } from './omnilib-docs/embedder.js';
import { DEFAULT_HASHER_MODEL } from './omnilib-docs/hashers.js';
import { initializeEmbedder, DEFAULT_EMBEDDER_MODEL } from './omnilib-docs/embeddings.js';

async function async_getQueryChunksComponent()
{
  let query_chunk_component = OAIBaseComponent
    .create(NS_ONMI, "query_chunks")
    .fromScratch()
    .set('title', 'Query chunked documents')
    .set('category', 'Text Manipulation')
    .set('description', 'Query chunked documents using a vectorstore')
    .setMethod('X-CUSTOM')
    .setMeta({
      source: {
        summary: "chunk text files and save the chunks to the CDN using (by default) OpenAI embeddings and Langchain",
        links: {
          "Langchainjs Website": "https://docs.langchain.com/docs/",
          "Documentation": "https://js.langchain.com/docs/",
          "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
        },
      }
    });

  // Adding input(s)
  const llm_choices = await getLlmChoices();
  const inputs = [
    { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked' },
    { name: 'query', type: 'string', customSocket: 'text' },
    { name: 'model_id', type: 'string', defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices },
    { name: 'vectorstore_name', type: 'string', description: 'All injested information sharing the same vectorstore will be grouped and queried together', title: "Vector-Store Name", defaultValue: "my_library_00" }, 
  ];
  query_chunk_component = setComponentInputs(query_chunk_component, inputs);

  // Adding outpu(t)
  const outputs = [
    { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query or prompt', title: 'Answer' },
  ];
  query_chunk_component = setComponentOutputs(query_chunk_component, outputs);

  
  // Adding _exec function
  query_chunk_component.setMacro(OmniComponentMacroTypes.EXEC, parsePayload);

  return query_chunk_component.toJSON();
}

async function parsePayload(payload, ctx)
{
  const answer = await queryChunks(ctx, payload);
  if (!answer) return { result: { "ok": false }, answer: "" };
  return { result: { "ok": true }, answer: answer };
}



async function queryChunks(ctx, payload)
{

  const document_cdns = payload.documents;
  const query = payload.query;
  const model_id = payload.model_id;
  const vectorstore_name = payload.vectorstore_name;

  console.time("query_chunks_component_processTime");
  let combined_answer = "";
  let vectorstore = null;
  let embedder = null;
  if (!document_cdns || document_cdns.length == 0)
  {
    // when no documents are passed, we query the entire vectorstore for that vectorstore_name
    const embedder_parameters = await loadEmbedderParameters(ctx, vectorstore_name);
   
    omnilog.warn(`[query_chunks_component] No documents passed, querying the entire vectorstore ${vectorstore_name} with embedder_parameters = ${JSON.stringify(embedder_parameters)}`);

    const hasher_model = embedder_parameters?.hasher_model || DEFAULT_HASHER_MODEL;
    const embedder_model = embedder_parameters?.embedder_model || DEFAULT_EMBEDDER_MODEL;

    embedder = await initializeEmbedder(ctx, embedder_model, hasher_model, vectorstore_name);

    if (!embedder) throw new Error(`[query_chunks_component] Error loading vectorstore with embedder_model = ${embedder_model}, hasher_model = ${hasher_model}, vectorstore_name = ${vectorstore_name}`)
    vectorstore = await loadVectorstore(embedder);

  }
  else
  {

    const all_chunks = [];
    for (let i = 0; i < document_cdns.length; i++)
    {
      const document_cdn = document_cdns[i];
      const document_json = await get_json_from_cdn(ctx, document_cdn);
      if (is_valid(document_json) == false) throw new Error(`[component_query_chunks] Error getting chunks from database with id ${JSON.stringify(document_cdn)}`);


      const chunks = document_json.chunks;
      if (is_valid(chunks) == false) throw new Error(`[query_chunks_component] Error getting chunks from document_json: ${JSON.stringify(document_json)}`);

      all_chunks.push(...chunks);

      if (i==0)
      {
        const vectorstore_name = document_json.vectorstore_name;
        const hasher_model = document_json.hasher_model;
        const embedder_model = document_json.embedder_model;

        embedder = await initializeEmbedder(ctx, embedder_model, hasher_model, vectorstore_name);
      }


      omnilog.log(`[query_chunks_component] Read from the document:\nchunks #= ${chunks.length}, vectorstore_name = ${vectorstore_name}`);

    }
    vectorstore = await computeVectorstore(all_chunks, embedder);
  }

  const query_result = await smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model_id);
  combined_answer += query_result + "\n\n";
    
  const response = combined_answer;
  console.timeEnd("query_chunks_component_processTime");
  return response;
}


export { async_getQueryChunksComponent, queryChunks };
