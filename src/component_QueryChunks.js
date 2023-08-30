//@ts-check
// QueryChunksComponent.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { omnilog } from 'mercs_shared'
import { setComponentInputs, setComponentOutputs, setComponentControls } from './omni-utils/component.js';
const NS_ONMI = 'document_processing';

import { initialize_hasher } from './omni-docs/hashers.js'
import { save_json_to_cdn, get_json_from_cdn } from './omni-utils/cdn.js';
import { is_valid } from './omni-utils/utils.js';
import { compute_vectorstore } from './omni-docs/vectorstore.js';
import { initialize_embedder } from './omni-docs/embeddings.js';
import { smartquery_from_vectorstore } from './omni-docs/smartquery.js';
import { getLlmChoices , DEFAULT_LLM_MODEL_ID} from "./omni-llms/llms.js"

async function async_getQueryChunksComponent()
{
  let query_chunk_component = OAIBaseComponent
      .create(NS_ONMI, "query_chunks")
      .fromScratch()
      .set('title', 'Query documents')
      .set('category', 'Text Manipulation')
      .set('description', 'Query chunked documents using a vectorstore')
      .setMethod('X-CUSTOM')
      .setMeta({
          source: {
            summary: "chunk text files and save the chunks to the CDN using FAISS, OpenAI embeddings and Langchain",
            links: {
                  "Langchainjs Website": "https://docs.langchain.com/docs/",
                  "Documentation": "https://js.langchain.com/docs/",
                  "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
                  "Faiss": "https://faiss.ai/"
              },
          }
      });
      
  // Adding input(s)
  const llm_choices  = await getLlmChoices();
  const inputs = [
    { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked'  },
    { name: 'query', type: 'string', customSocket: 'text' },
    { name: 'model_id', type: 'string', defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices},
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

async function parsePayload(payload, ctx) {

  const failure = { result: { "ok": false }, answer : "" };

  const documents = payload?.documents;
  if (!documents) return failure;

  const documents_cdns = payload.documents;
  const query = payload.query;
  const model_id = payload.model_id;
  
  const answer =  await queryChunks(ctx, documents_cdns, query, model_id);
  if (!answer) return failure;

  return { result: { "ok": true }, answer: answer };
}

  

async function queryChunks(ctx, document_cdns, query, model_id)
{
    console.time("query_chunks_component_processTime");
    let combined_answer = "";
    for (let i = 0; i < document_cdns.length; i++)
    {
        const document_cdn = document_cdns[i];
        const document_json = await get_json_from_cdn(ctx, document_cdn);
        if (is_valid(document_json) == false) throw new Error(`[component_query_chunks] Error getting chunks from database with id ${JSON.stringify(document_cdn)}`);

        const vectorstore_name = document_json.vectorstore_name;
        const hasher_model = document_json.hasher_model;
        const embedder_model = document_json.embedder_model;
        const chunks = document_json.chunks;
        if (is_valid(chunks) == false) throw new Error(`[query_chunks_component] Error getting chunks from document_json: ${JSON.stringify(document_json)}`);

        omnilog.log(`[query_chunks_component] Read from the document:\nchunks #= ${chunks.length}, vectorstore_name = ${vectorstore_name}, hasher_model = ${hasher_model}, embedder_model = ${embedder_model}`);

        const hasher = initialize_hasher(hasher_model);
        const embedder = initialize_embedder(ctx, embedder_model, hasher, vectorstore_name);

        const vectorstore = await compute_vectorstore(chunks, embedder);
        const query_result = await smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model_id);
        combined_answer += query_result + "\n\n";
    }

    const response = combined_answer;
    console.timeEnd("query_chunks_component_processTime");
    return response;
}


export {async_getQueryChunksComponent, queryChunks };
