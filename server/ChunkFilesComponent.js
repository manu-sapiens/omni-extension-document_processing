// ChunkFilesComponent.js

import { initialize_hasher, compute_document_id } from './hashers.js'
import { save_json_to_cdn_as_buffer } from './cdn.js';
import { gather_all_texts_from_documents } from './cdn.js';
import { initialize_splitter } from './splitter.js'
import { initialize_embedder } from './embedder.js';
import { process_chapter } from './chunking.js';
import { clean_vectorstore_name } from './vectorstore.js';
import { DEFAULT_HASHER_MODEL } from './hashers.js'
import { DEFAULT_VECTORSTORE_NAME } from './configs.js';
import { DEFAULT_EMBEDDER_MODEL } from './embedder.js';
import { DEFAULT_SPLITTER_MODEL } from './splitter.js';
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from './chunking.js'
import { console_log } from './utils.js';

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
            "chunk_size": {
              "title": "Chunk Size",
              "type": "number",
              "default": 512,
              "minimum": 32
            },
            "chunk_overlap": {
              "title": "Chunk Overlap",
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
            "vectorstore_name": {
              "title": "Vectorstore Name",
              "type": "string", 
              "default": "omnitool",
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


        const documents_cdns = payload.documents;
        const overwrite = payload.overwrite || false;
        const collate = payload.collate || true;
    
        const vectorstore_name = payload.vectorstore_name;
        const splitter_model = payload.splitter_model;
        const embedder_model = payload.embedder_model;

        const chunk_size = payload.chunk_size;
        const chunk_overlap = payload.chunk_overlap;

        let return_value = { result: { "ok": false }, documents: [] };
        if (payload.documents)
        {
          const result_cdns = await chunk_files_component(ctx, documents_cdns, overwrite, vectorstore_name, collate, embedder_model, splitter_model, chunk_size,chunk_overlap);
          return_value = { result: { "ok": true }, documents: result_cdns , files: result_cdns};
        }
  
        return return_value;
      }
    }
  };


  async function chunk_files_component(ctx, documents, overwrite = false, vectorstore_name = DEFAULT_VECTORSTORE_NAME, collate = true, embedder_model = DEFAULT_EMBEDDER_MODEL, splitter_model = DEFAULT_SPLITTER_MODEL, chunk_size = DEFAULT_CHUNK_SIZE, chunk_overlap = DEFAULT_CHUNK_OVERLAP)
  {
      console_log(`--------------------------------`);
      console.time("chunk_files_component_processTime");

      vectorstore_name = clean_vectorstore_name(vectorstore_name);
      const hasher_model = DEFAULT_HASHER_MODEL;
      const hasher = initialize_hasher(hasher_model);
      const splitter = initialize_splitter(splitter_model, chunk_size, chunk_overlap);
      const embedder = initialize_embedder(ctx, embedder_model, hasher, vectorstore_name, overwrite);
  
      console_log(`[chunk_files_component] splitter_model = ${splitter_model}, embedder_model = ${embedder_model}`);
  
  
      const chapters = await gather_all_texts_from_documents(ctx, documents);
      // gather an array of texts, 1 per document. we will split and chunk them separately
      // if collate is true, we will then put them all in the same arrays
      // This allows to feed a book as an array of chapters, for examplea and have chunks that do not overlap across chapter transitions
      // For this reason, we call each of the passed documents a 'chapter'
  
      let cdns = [];
      let all_texts = "";
      let all_chunks = [];
      for (let chapter_index = 0; chapter_index < chapters.length; chapter_index++)
      {
          const text = chapters[chapter_index];
          const chapter_id = compute_document_id(ctx, [text], vectorstore_name, hasher);
          let response = await process_chapter(ctx, text, vectorstore_name, hasher, embedder, splitter, chapter_id, overwrite, hasher_model, embedder_model, splitter_model);
  
          if (collate)
          {
              const document_json = response.json;
              all_texts += text + "\n\n";
              all_chunks = all_chunks.concat(document_json.chunks);
  
          }
          else
          {
              const document_cdn = response.cdn;
              cdns.push(document_cdn);
          }
      }
  
      if (collate)
      {
          console_log(`collating #${chapters.length} chapters with combined # of chunks = ${all_chunks.length}`);
          const collated_document_id = compute_document_id(ctx, [all_texts], vectorstore_name, hasher);
          const collated_json = { id: collated_document_id, hasher_model: hasher_model, embedder_model: embedder_model, splitter_model: splitter_model, vectorstore_name: vectorstore_name, chunks: all_chunks, chapters: chapters };
          const collated_document_cdn = await save_json_to_cdn_as_buffer(ctx, collated_json);
          cdns = [collated_document_cdn];
      }
  
      console.timeEnd("chunk_files_component_processTime");
      return cdns;
  }
  
  
export {ChunkFilesComponent, chunk_files_component};
  