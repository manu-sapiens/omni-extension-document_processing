import { component_query_chunks } from "./documentsLib.js";

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
            "overwrite": {
              "title": "Overwrite",
              "type": "boolean",
              "default": false,
              "description": `Overwrite the existing files in the CDN.`,
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
  
          const files = payload.documents;
          const nb_of_results = payload.nb_of_results || 2;
          const query = payload.query;
          const allow_gpt3 = payload.allow_gpt3 || true;
          const allow_gpt4 = payload.allow_gpt4 || false;
          const overwrite = payload.overwrite || false;
          if (!allow_gpt3 && !allow_gpt4) throw new Error(`ERROR: You must allow at least one LLM model`);

          const embedder = new OmniOpenAIEmbeddings(ctx);
          const args = { embedder:embedder, nb_of_results: nb_of_results, allow_gpt3: allow_gpt3, allow_gpt4: allow_gpt4, overwrite: overwrite };
          
          const cdn_response_array = [];
          for (let i = 0; i < files.length; i++)
          {
            const chunks_cdn = files[i];
            const cdn_response = await component_query_chunks(ctx, chunks_cdn, query, args);
            cdn_response_array.push(cdn_response);
  
            console.log(`cdn_response = ${JSON.stringify(cdn_response)}`);
          }
          return_value = { result: { "ok": true }, files: cdn_response_array, documents: cdn_response_array };
        }
  
        return return_value;
      }
    }
  };
  
export {QueryChunksComponent};
