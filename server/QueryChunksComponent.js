import { query_chunks_component } from "./documentsLib.js";

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
  
export {QueryChunksComponent};
