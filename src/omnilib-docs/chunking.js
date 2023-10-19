//@ts-check
import { get_cached_cdn, save_chunks_cdn_to_db, save_json_to_cdn_as_buffer, is_valid, console_log } from '../../../../src/utils/omni-utils'
import { computeChunkId, computeDocumentId } from './hashers.js';

const DEFAULT_CHUNK_SIZE = 8092;
const DEFAULT_CHUNK_OVERLAP = 4096; // !!!!!

const AVERAGE_CHARACTER_PER_WORD = 5;
const AVERAGE_WORD_PER_TOKEN = 0.75;
const EMBEDDING_BATCH_SIZE = 10; // This is the number of chunks that will be embedded in parallel

function createBatches(arr, size)
{
  const batches = [];
  for (let i = 0; i < arr.length; i += size)
  {
    const start_index = i;
    const end_index = Math.min(i + size, arr.length);
    const batch = arr.slice(start_index, end_index);
    batches.push(batch);
  }
  return batches;
};

// Function to group splitted_texts into batches of EMBEDDING_BATCH_SIZE
async function breakTextIntoBatches(text, splitter)
{
  const splitted_texts = await splitter.splitText(text);
  const textBatches = createBatches(splitted_texts, EMBEDDING_BATCH_SIZE);
  return textBatches;
}

export function computeTokenToChunkingSizeRatio(chunks, chunk_size, chunk_overlap)
{
  let total_token_count = 0;
  let total_chunk_size = 0;

  let index = 0;
  for (const chunk of chunks)
  {
      if (index != chunks.length - 1) 
      {
          if (chunk && chunk.token_count) total_token_count += chunk.token_count;
          total_chunk_size += (chunk_size + chunk_overlap);
      }
      index += 1;
  }

  let token_to_chunking_size_ratio = -1;
  if (total_chunk_size != 0) token_to_chunking_size_ratio = total_token_count / total_chunk_size;

    return token_to_chunking_size_ratio;
}

async function computeChunks(ctx, document_id, textBatches, hasher, embedder, tokenCounterFunction )
{
  const chunks = [];
  let index = 0;
  for (const textBatch of textBatches)
  {
    
    const embeddingPromises = textBatch.map(async (chunk_text) =>
    {
      const nb_of_chars = chunk_text.length;
      if (nb_of_chars > 0)
      {
        const chunk_id = computeChunkId(ctx, chunk_text, hasher);
        await embedder.embedQuery(chunk_text); // No need to save it as the embedder is automatically caching the embedding of each chunk in the DB
        const chunk_token_count = tokenCounterFunction(chunk_text);
        const chunk_json = { source: document_id, index: index, id: chunk_id, token_count: chunk_token_count, text: chunk_text };
        return chunk_json;
      }
    });

    const batchResults = await Promise.all(embeddingPromises);
    chunks.push(...batchResults);

    index += 1;
  }

  if (is_valid(chunks) === false)
  {
    throw new Error(`ERROR could not chunk the documents`);
  }

  return chunks;
}

async function uploadTextWithCaching(ctx, text, hasher, chunk_size, chunk_overlap, overwrite)
{
  const text_id = computeDocumentId(ctx, [text], hasher, chunk_size, chunk_overlap);
  let text_cdn = await get_cached_cdn(ctx, text_id, overwrite);
  if (!is_valid(text_cdn))
  {
    const buffer = Buffer.from(text);
    text_cdn = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });
    //if (!text_cdn) throw new Error(`ERROR: could not upload Text to CDN`);
    //await save_chunks_cdn_to_db(ctx, text_cdn, text_id);
  }
  else
  {
    console_log(`[ingestText] Found text_cdn: ${JSON.stringify(text_cdn)} in the DB under id: ${text_id}. Skipping uploading to CDN...`);
  }

  return text_cdn;
}

async function chunkText(ctx, document_id, document_text, hasher, embedder, splitter, tokenCounterFunction)
{
    const text_batches = await breakTextIntoBatches(document_text, splitter);
    const document_chunks = await computeChunks(ctx, document_id, text_batches, hasher, embedder, tokenCounterFunction);
    return document_chunks;
}

export async function saveIndexedDocument(ctx, document_id, chunks, chunk_size, chunk_overlap, token_to_chunking_size_ratio, splitter_model)
{

  const indexed_document_info = { id: document_id, splitter_model: splitter_model, chunks: chunks, chunk_size, chunk_overlap, token_to_chunking_size_ratio };
  const indexed_document_cdn = await save_json_to_cdn_as_buffer(ctx, indexed_document_info);
  if (!indexed_document_cdn) throw new Error(`ERROR: could not save document_cdn to cdn`);

  const success = await save_chunks_cdn_to_db(ctx, indexed_document_cdn, document_id);
  if (success == false) throw new Error(`ERROR: could not save document_cdn to db`);
  return indexed_document_cdn;

}


export { chunkText, uploadTextWithCaching };
export { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP };
export { AVERAGE_CHARACTER_PER_WORD, AVERAGE_WORD_PER_TOKEN };