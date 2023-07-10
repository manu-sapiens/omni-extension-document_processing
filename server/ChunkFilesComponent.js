import { component_files_to_chunks_cdn} from "./documentsLib.js";

var ChunkFilesComponent = {
    schema:
    {
      "tags": ['default'],
      "componentKey": "chunkFiles",
      "category": "Document Processing",
      "operation": {
        "schema": {
          "title": "Chunk Documents",
          "type": "object",
          "required": [],
          "properties": {
            "documents": {
              "title": "Documents",
              "type": "array",
              "x-type": "documentArray",
              "description": `Chunk the files and save the chunks to the CDN.`,
            },
            "chunk_size": {
              "title": "Chunk Size",
              "type": "number",
              "default": 1000,
              "minimum": 500,
              "maximum": 32000,
              "step": 50,
              "description": `The size of each chunk in tokens.`,
            },
            "vectorstore_name": {
              "title": "Vectorstore Name (optional)",
              "type": "string",
              "default": "optional vectorstore name",
            },
            "overwrite": {
              "title": "Overwrite",
              "type": "boolean",
              "default": false,
              "description": `Overwrite the existing files in the CDN.`,
            },            
          }
        },
        "responseTypes": {
          "200": {
            "schema": {
              "title": "JSON",
              "required": [],
              "type": "object",
              "properties": {
                "files": {
                  "title": "CDN Files",
                  "type": "array",
                  "x-type": "cdnObjectArray",
                  "description": "The chunked text files"
                },              
                "documents": {
                  "title": "Chunk Documents",
                  "type": "array",
                  "x-type": "documentArray",
                  "description": "The chunked text files"
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
        "title": "Chunk text files",
        "category": "Text Manipulation",
        "summary": "Chunk text files and save the chunks to the CDN",
        "meta": {
          "source": {
            "summary": "chunk text files and save the chunks to the CDN using FAISS, OpenAI embeddings and Langchain",
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
          let chunk_size = payload.chunk_size || 1000;
          let vectorstore_name = payload.vectorstore_name || "default";
          const overwrite = payload.overwrite || false;
 
          const args = { chunk_size: chunk_size, vectorstore_name: vectorstore_name, overwrite: overwrite };
          const chunks_cdn = await component_files_to_chunks_cdn(ctx, files, args);
          return_value = { result: { "ok": true }, documents: [chunks_cdn] , files: [chunks_cdn]};
        }
  
        return return_value;
      }
    }
  };

export {ChunkFilesComponent};
  