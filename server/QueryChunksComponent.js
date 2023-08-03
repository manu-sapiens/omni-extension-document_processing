// QueryChunksComponent.js

import { initialize_hasher } from './hashers.js'
import { save_json_to_cdn, get_json_from_cdn } from './cdn.js';
import { is_valid, console_log } from './utils.js';
import { compute_vectorstore } from './vectorstore.js';
import { initialize_embedder } from './embedder.js';
import { smartquery_from_vectorstore } from './smartquery.js';

var QueryChunksComponent = {
    schema:
    {
      "tags": ['default'],
      "componentKey": "queryChunks",
      "category": "Document Processing",
      "operation": {
        "schema": {
          "title": "Query documents using a vectorstore",
          "type": "object",
          "required": [],
          "properties": {
            "documents": {
              "title": "Chunk Documents",
              "type": "array",
              "x-type": "documentArray",
              "description": `Chunk files`,
            },
            "query": {
              "title": "Query",
              "type": "string",
              'x-type': 'text',
              'description': 'The Query',
            },
            "model": {
              "title": "LLM Model",
              "type": "string",
              "enum": ["gpt-3.5-turbo", "gpt-3.5-turbo-16k", "gpt-4", "gpt-4-32k"],
              "default": "gpt-3.5-turbo-16k"
            },
          },
        },
        "responseTypes": {
          "200": {
            "schema": {
              "title": "JSON",
              "required": [],
              "type": "object",
              "properties": {
                "files": {
                  "title": "Result Files",
                  "type": "array",
                  "x-type": "cdnObjectArray",
                  "description": "The files containing the results"
                },              
                "documents": {
                  "title": "Result Documents",
                  "type": "array",
                  "x-type": "documentArray",
                  "description": "The files containing the results"
                },
                "answer": {
                  "title": "Answer",
                  "type": "string",
                  "x-type": "text",
                  "description": "The answer to the query or prompt"
                },
              },
            },
            "contentType": "application/json"
          },
        },
        "method": "X-CUSTOM"
      },
      patch:
      {
        "title": "Query Documents",
        "category": "Text Manipulation",
        "summary": "Query chunked files",
        "meta": {
          "source": {
            "summary": "Query chunked text files and save the chunks to the CDN using FAISS, OpenAI/Tensorflow embeddings and Langchain",
            links: {
              "Langchainjs Website": "https://docs.langchain.com/docs/",
              "Documentation": "https://js.langchain.com/docs/",
              "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
              "Faiss": "https://faiss.ai/"
            }
          }
        },
      }
    },
    functions: {
      _exec: async (payload, ctx) =>
      {
  
        let return_value = { result: { "ok": false }, documents: [] };
        if (payload.documents)
        {
  
          const documents_cdns = payload.documents;
          const query = payload.query;
          const model = payload.model;
          
          const response =  await query_chunks_component(ctx, documents_cdns, query, model);
          const results_cdn = response.results_cdn;
          const answer = response.answer;
          return_value = { result: { "ok": true }, files: [results_cdn], documents: [results_cdn], answer: answer };
        }
  
        return return_value;
      }
    }
  };
  
  async function query_chunks_component(ctx, document_cdns, query, model)
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
  
          console_log(`[query_chunks_component] Read from the document:\nchunks #= ${chunks.length}, vectorstore_name = ${vectorstore_name}, hasher_model = ${hasher_model}, embedder_model = ${embedder_model}`);
  
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
  
export {QueryChunksComponent, query_chunks_component};
