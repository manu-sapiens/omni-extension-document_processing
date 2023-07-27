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
            "nb_of_results": {
              "title": "Number of results to return",
              "type": "number",
              "default": 2,
              "minimum": 1
            },
            "allow_gpt3": {
              "title": "Allow GPT3 usage",
              "type": "boolean",
              "default": true,
            },
            "allow_gpt4": {
              "title": "Allow GPT4 usage",
              "type": "boolean",
              "default": false,
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
            "summary": "Query chunked text files and save the chunks to the CDN using FAISS, OpenAI embeddings and Langchain",
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
          const nb_of_results = payload.nb_of_results || 2;
          const query = payload.query;
          const allow_gpt3 = payload.allow_gpt3 || true;
          const allow_gpt4 = payload.allow_gpt4 || false;
          if (!allow_gpt3 && !allow_gpt4) throw new Error(`ERROR: You must allow at least one LLM model`);
          
          const cdn_response_array =  await query_chunks_component(ctx, documents_cdns, query, nb_of_results,allow_gpt3,allow_gpt4);
          return_value = { result: { "ok": true }, files: cdn_response_array, documents: cdn_response_array };
        }
  
        return return_value;
      }
    }
  };
  
export {QueryChunksComponent};
