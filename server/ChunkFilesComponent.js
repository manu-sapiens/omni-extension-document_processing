import { chunk_files_component} from "./documentsLib.js";

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
            "embedder_model": {
              "title": "Embedding Model",
              "type": "string", 
              "enum": ["openai", "tensorflow"],
              "default": "tensorflow",
            },        
            "splitter_model": {
              "title": "Splitter Model",
              "type": "string", 
              "enum": [ "RecursiveCharacterTextSplitter", "TokenTextSplitter","CodeSplitter_cpp","CodeSplitter_go","CodeSplitter_java","CodeSplitter_ruby","CodeSplitter_js","CodeSplitter_php","CodeSplitter_proto","CodeSplitter_python","CodeSplitter_rst","CodeSplitter_rust","CodeSplitter_scala","CodeSplitter_swift","CodeSplitter_markdown","CodeSplitter_latex","CodeSplitter_html"],
              "default": "RecursiveCharacterTextSplitter",
            },
            "chunk_size_in_tokens": {
              "title": "Chunk Size in Tokens",
              "type": "number",
              "default": 512,
              "minimum": 32
            },
            "chunk_overlap_in_tokens": {
              "title": "Chunk Overlap in Tokens",
              "type": "number",
              "default": 64,
              "minimum": 0
            },
            "collate": {
              "title": "Collate",
              "type": "boolean",
              "default": true,
            },
            "overwrite": {
              "title": "Overwrite",
              "type": "boolean",
              "default": false,
            },
            "args": {
              "title": "Additional Arguments",
              "type": "object",
              "x-type": "object",
              "default": {},
              "description": `Additional optional arguments such as overwrite, various chunking parameters, etc.`,
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
  
        // Copy fields from args to payload
        for (let key in payload.args) {
          payload[key] = payload.args[key];
        }

        // Remove args from payload
        delete payload.args;

        let return_value = { result: { "ok": false }, documents: [] };
        if (payload.documents)
        {
          const result_cdns = await chunk_files_component(ctx, payload);
          return_value = { result: { "ok": true }, documents: result_cdns , files: result_cdns};
        }
  
        return return_value;
      }
    }
  };

export {ChunkFilesComponent};
  