import { files_to_chunks_cdn, loop_llm_on_chunks, query_chunks, save_json_to_cdn } from './util/omni_langchain'

const ChunkFilesComponent = {
  schema:
  {
    "tags": ['default'],
    "componentKey": "chunkFiles",
    "category": "Document Processing",
    "operation": {
      "schema": {
        "title": "Chunk Files",
        "type": "object",
        "required": [],
        "properties": {
          "files": {
            "title": "Files",
            "type": "objectArray",
            "description": `Chunk the files and save the chunks to the CDN.`
          },
          "chunkSize": {
            "title": "Chunk Size",
            "type": "number",
            "default": 1000,
            "minimum": 500,
            "maximum": 32000,
            "step": 50,
            "description": `The size of each chunk in tokens.`
          },
          "vectorstore_name": {
            "title": "Vectorstore Name (optional)",
            "type": "string",
            "default": "default"
          }
        },
        "responseTypes": {
          "200": {
            "schema": {
              "title": "Text",
              "required": [
                "files"
              ],
              "type": "string",
              "properties": {
                "files": {
                  "title": "CDN Files",
                  "type": "objectArray",
                  "x-type": "obectArray",
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
        "meta":
        {
          "source":
          {
            "summary": "hunk text files and save the chunks to the CDN using FAISS, OpenAI embeddings and Langchain",
            links:
            {
              "Langchainjs Website": "https://docs.langchain.com/docs/",
              "Documentation": "https://js.langchain.com/docs/",
              "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
              "Faiss": "https://faiss.ai/"
            }
          }
        },
        inputs:
        {
          "files":
          {
            "type": "objectArray",
            "x-type": "objectArray",
            "title": "Files",
            "description": "The files (text) to chunk",
            "required": true,
          },
          "chunkSize":
          {
            "step": 100,
            "control":
            {
              "type": "AlpineNumberComponent"
            },
            "title": "Chunk Size",
            "type": "number",
            "description": "The size of each chunk in tokens.",
            "default": 1000,
            "minimum": 500,
            "maximum": 32000,
            "required": true,
          },
        }
      }
    }
  },
  functions: {
    _exec: async (payload: any, ctx: any) => {

      let return_value = { result: { "ok": false }, files: [] };
      if (payload.files) {
        // get buffer
        let files = payload.files
        let chunk_size = payload.chunksize || 1000
        let vectorstore_name = payload.vectorstore_name || "default"
        const args = { chunk_size: chunk_size, vectorstore_name: vectorstore_name };
        const chunks_cdn = await files_to_chunks_cdn(ctx, files, args);
        return_value = { result: { "ok": true }, files: [chunks_cdn] };
      }

      return return_value
    }
  }
}


let components = [ChunkFilesComponent]

export default (FactoryFn: any) => {
  return components.map((c: any) => FactoryFn(c.schema, c.functions))
}
