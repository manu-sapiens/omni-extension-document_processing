//@ts-check
// chunking.js
import { computeChunkId, computeDocumentId } from './hashers.js';
import { get_cached_cdn, save_chunks_cdn_to_db, get_json_from_cdn, save_json_to_cdn_as_buffer } from 'omnilib-utils/cdn.js';
import { is_valid, console_log } from 'omnilib-utils/utils.js';

const DEFAULT_CHUNK_SIZE = 4096;
const DEFAULT_CHUNK_OVERLAP = 512;

const AVERAGE_CHARACTER_PER_WORD = 5;
const AVERAGE_WORD_PER_TOKEN = 0.75;
const EMBEDDING_BATCH_SIZE = 10;

async function breakTextIntoChunks(text, splitter)
{
  const splitted_texts = await splitter.splitText(text);

  // Function to group splitted_texts into batches of EMBEDDING_BATCH_SIZE
  const createBatches = (arr, size) =>
  {
    const batches = [];
    for (let i = 0; i < arr.length; i += size)
    {
      batches.push(arr.slice(i, i + size));
    }
    return batches;
  };

  const textBatches = createBatches(splitted_texts, EMBEDDING_BATCH_SIZE);
  return textBatches;
}
async function computeChunksEmbedding(ctx, textBatches, hasher, embedder, tokenCounterFunction )
{
  const chunks = [];

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
        const chunk_json = { text: chunk_text, id: chunk_id, token_count: chunk_token_count };
        return chunk_json;
      }
    });

    const batchResults = await Promise.all(embeddingPromises);
    chunks.push(...batchResults);
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

export async function getIndexedDocumentCdnFromId(ctx, document_id, overwrite = false) 
{
  const document_cdn = await get_cached_cdn(ctx, document_id, overwrite);
  // note it is OK for this to be null (i.e. we did not find it in the DB)
  return document_cdn;
}

export async function getIndexedDocumentInfoFromCdn(ctx, document_cdn)
{
  const document_info = await get_json_from_cdn(ctx, document_cdn);
  if (!document_info) throw new Error(`ERROR: could not get document_json from cdn`);

  return document_info;
}
async function chunkText(ctx, document_text, hasher, embedder, splitter, tokenCounterFunction)
{
    const text_batches = await breakTextIntoChunks(document_text, splitter);
    const document_chunks = await computeChunksEmbedding(ctx, text_batches, hasher, embedder, tokenCounterFunction);
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