// QueryChunksComponent.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { omnilog } from 'mercs_shared'
import { setComponentInputs, setComponentOutputs, setComponentControls } from './utils/components_lib.js';
const NS_ONMI = 'document_processing';

import { initialize_hasher } from './utils/hashers.js'
import { save_json_to_cdn, get_json_from_cdn } from './utils/cdn.js';
import { is_valid } from './utils/utils.js';
import { compute_vectorstore } from './utils/vectorstore.js';
import { initialize_embedder } from './utils/embedder.js';
import { smartquery_from_vectorstore } from './utils/smartquery.js';

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
const inputs = [
  { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked'  },
  { name: 'query', type: 'string', customSocket: 'text' },
  { name: 'model', type: 'string', defaultValue: 'gpt-3.5-turbo-16k', choices: [
    {value:'gpt-3.5-turbo', title:"chatGPT 3 (4k)", description:"gpt 3.5 with ~ 3,000 words context"}, 
    {value:'gpt-3.5-turbo-16k', title:"chatGPT 3 (16k)", description:"gpt 3.5 with ~ 12,000 words context"}, 
    {value:'gpt-4', title:"chatGPT 4 (8k)", description:"gpt 4 with ~ 6,000 words context"},
    {value:'gpt-4-32k', title:"chatGPT 4 (32k)", description: "chat GPT 4 with ~ 24,000 words context"}] },
];
query_chunk_component = setComponentInputs(query_chunk_component, inputs);

// Adding outpu(t)
const outputs = [
    { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query or prompt', title: 'Answer' },
    { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'The documents containing the results' },
    { name: 'files', type: 'array', customSocket: 'cdnObjectArray', description: 'The files containing the results' },
];
query_chunk_component = setComponentOutputs(query_chunk_component, outputs);


// Adding _exec function
query_chunk_component.setMacro(OmniComponentMacroTypes.EXEC, query_chunk_parse);


async function query_chunk_parse(payload, ctx) {

  let return_value = { result: { "ok": false }, files: [], documents: [], answer : "" };
  if (payload.documents)
  {

    const documents_cdns = payload.documents;
    const query = payload.query;
    const model = payload.model;
    
    const response =  await query_chunks_function(ctx, documents_cdns, query, model);
    const results_cdn = response.cdn;
    const answer = response.answer;
    return_value = { result: { "ok": true }, files: [results_cdn], documents: [results_cdn], answer: answer };
  }

  return return_value;
}
  
  async function query_chunks_function(ctx, document_cdns, query, model)
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
          const query_result = await smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model);
          combined_answer += query_result + "\n\n";
      }
  
      const results_cdn = await save_json_to_cdn(ctx, { answer: combined_answer });
      const response = { cdn: results_cdn, answer: combined_answer };
      console.timeEnd("query_chunks_component_processTime");
      return response;
  }
  
const QueryChunksComponent = query_chunk_component.toJSON();
export {QueryChunksComponent, query_chunks_function};
