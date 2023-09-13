//@ts-check
// chunking.js
import { compute_chunk_id, compute_document_id } from './hashers.js';
import { get_cached_cdn, save_chunks_cdn_to_db, get_json_from_cdn, save_json_to_cdn_as_buffer} from 'omnilib-utils/cdn.js'
import { is_valid, console_log } from 'omnilib-utils/utils.js';

const DEFAULT_CHUNK_SIZE = 4096;
const DEFAULT_CHUNK_OVERLAP = 512;

const AVERAGE_CHARACTER_PER_WORD = 5;
const AVERAGE_WORD_PER_TOKEN = 0.75;
const EMBEDDING_BATCH_SIZE = 10;

async function breakChapterIntoChunks(ctx, text, vectorstore_name, hasher, embedder, splitter, tokenCounterFunction) {
    const splitted_texts = await splitter.splitText(text);
    
    // Function to group splitted_texts into batches of EMBEDDING_BATCH_SIZE
    const createBatches = (arr, size) => {
      const batches = [];
      for (let i = 0; i < arr.length; i += size) {
        batches.push(arr.slice(i, i + size));
      }
      return batches;
    };
  
    const textBatches = createBatches(splitted_texts, EMBEDDING_BATCH_SIZE);
    const chunks = [];
  
    for (const textBatch of textBatches) {
      const embeddingPromises = textBatch.map(async (chunk_text) => {
        const nb_of_chars = chunk_text.length;
        if (nb_of_chars > 0) {  
          const chunk_id = compute_chunk_id(ctx, chunk_text, vectorstore_name, hasher);
          const chunk_embedding = await embedder.embedQuery(chunk_text);
          const chunk_token_count = tokenCounterFunction(chunk_text);
          const chunk_json = { text: chunk_text, id: chunk_id, token_count: chunk_token_count, embedding: chunk_embedding };
          return chunk_json;
        }
      });
  
      const batchResults = await Promise.all(embeddingPromises);
      chunks.push(...batchResults);
    }
  
    const total_nb_of_chars = chunks.reduce((total, chunk) => total + chunk.text.length, 0);
    const average_nb_of_chars = total_nb_of_chars / splitted_texts.length;
  
    if (is_valid(chunks) === false) {
      throw new Error(`ERROR could not chunk the documents`);
    }
  
    return { chunks, nb_of_chunks: splitted_texts.length, total_nb_of_chars, average_nb_of_chars };
  }
  
  async function uploadTextWithCaching(ctx, text, vectorstore_name, hasher, overwrite)
  {
    const text_id = compute_document_id(ctx, [text], vectorstore_name, hasher);
    let text_cdn = await get_cached_cdn(ctx, text_id, overwrite);
    if (!is_valid(text_cdn))
    {
        const buffer = Buffer.from(text);
        text_cdn = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });
        if (!text_cdn) throw new Error(`ERROR: could not upload Text to CDN`);
        await save_chunks_cdn_to_db(ctx, text_cdn, text_id);
    }
    else
    {
        console_log(`[ingestText] Found text_cdn: ${JSON.stringify(text_cdn)} in the DB under id: ${text_id}. Skipping uploading to CDN...`);
    }
    
    return text_cdn;
    }

  async function processChapter(ctx, chapter_text, vectorstore_name, hasher, embedder, splitter, chapter_id, overwrite, hasher_model, embedder_model, splitter_model, tokenCounterFunction)
  {
  
      let chapter_cdn = await get_cached_cdn(ctx, chapter_id, overwrite);
      let chapter_json = null;
      if (is_valid(chapter_cdn))
      {
          console_log(`[processChapter] Found document_cdn: ${JSON.stringify(chapter_cdn)} in the DB under id: ${chapter_id}. Skipping chunking...`);
          try
          {
              chapter_json = await get_json_from_cdn(ctx, chapter_cdn);
          }
          catch (error)
          {
              console.warn(`[processChapter] WARNING: could not get document_json from cdn`);
              chapter_cdn = null;
          }
      }
  
      if (!is_valid(chapter_cdn))
      {
          console_log(`[processChapter] Found no records for document id = ${chapter_id} in the DB. Chunking now...`);
  
          const chunker_results = await breakChapterIntoChunks(ctx, chapter_text, vectorstore_name, hasher, embedder, splitter, tokenCounterFunction);
          const chapter_chunks = chunker_results.chunks;
  
          chapter_json = { id: chapter_id, hasher_model: hasher_model, embedder_model: embedder_model, splitter_model: splitter_model, vectorstore_name: vectorstore_name, chunks: chapter_chunks, chapters: [chapter_text] };
          chapter_cdn = await save_json_to_cdn_as_buffer(ctx, chapter_json);
  
          if (is_valid(chapter_cdn) == false) throw new Error(`ERROR: could not save document_cdn to cdn`);
          console_log(`[processChapter] document_cdn: = ${JSON.stringify(chapter_cdn)}`);
  
          const success = await save_chunks_cdn_to_db(ctx, chapter_cdn, chapter_id);
          if (success == false) throw new Error(`ERROR: could not save document_cdn to db`);
      }
  
  
      return { cdn: chapter_cdn, json: chapter_json };
  } 



export { processChapter, uploadTextWithCaching }
export { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP }
export { AVERAGE_CHARACTER_PER_WORD, AVERAGE_WORD_PER_TOKEN }