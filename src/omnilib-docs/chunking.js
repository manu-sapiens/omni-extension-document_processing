// chunking.js
import { compute_chunk_id } from './hashers.js';
import { get_cached_cdn, save_chunks_cdn_to_db, get_json_from_cdn, save_json_to_cdn_as_buffer} from 'omnilib-utils/cdn.js'
import { is_valid, console_log } from 'omnilib-utils/utils.js';

const DEFAULT_CHUNK_SIZE = 4096;
const DEFAULT_CHUNK_OVERLAP = 64;

const AVERAGE_CHARACTER_PER_WORD = 5;
const AVERAGE_WORD_PER_TOKEN = 0.75;
const EMBEDDING_BATCH_SIZE = 10;

async function break_chapter_into_chunks(ctx, text, vectorstore_name, hasher, embedder, splitter, tokenCounterFunction) {
    const splitted_texts = await splitter.splitText(text);
  
    console_log(`[break_chapter_into_chunks] splitted texts # = ${splitted_texts.length}`);
  
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
          console_log(`[break_chapter_into_chunks] splitted text nb of chars = ${nb_of_chars}`);
  
          const chunk_id = compute_chunk_id(ctx, chunk_text, vectorstore_name, hasher);
          const chunk_embedding = await embedder.embedQuery(chunk_text);
          const chunk_token_count = tokenCounterFunction(chunk_text);
          const chunk_json = { text: chunk_text, id: chunk_id, token_count: chunk_token_count, embedding: chunk_embedding };
          console_log(`[break_chapter_into_chunks] [${splitted_texts.indexOf(chunk_text)}] splitted text (first 1024) = ${chunk_text.slice(0, 1024)}`);
          return chunk_json;
        }
      });
  
      const batchResults = await Promise.all(embeddingPromises);
      chunks.push(...batchResults);
    }
  
    const total_nb_of_chars = chunks.reduce((total, chunk) => total + chunk.text.length, 0);
    const average_nb_of_chars = total_nb_of_chars / splitted_texts.length;
    console_log(`[break_chapter_into_chunks] average_nb_of_chars = ${average_nb_of_chars}`);
  
    if (is_valid(chunks) === false) {
      throw new Error(`ERROR could not chunk the documents`);
    }
  
    return { chunks, nb_of_chunks: splitted_texts.length, total_nb_of_chars, average_nb_of_chars };
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
  
          const chunker_results = await break_chapter_into_chunks(ctx, chapter_text, vectorstore_name, hasher, embedder, splitter, tokenCounterFunction);
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


  function parse_chapter_info(chapters, chapter_numnber, chapter_info, args)
  {
      const chapter_name_field = args.chapter_name_field;
      let chapterNumber = chapter_numnber;
      let chapter_key = `chapter_${chapterNumber}`;
  
      let chapter_object = {};
      if (chapters[chapter_key]) chapter_object = chapters[chapter_key];
  
      Object.entries(chapter_info).forEach(([field, new_value]) =>
      {
          console_log(`field = ${field}, new_value = ${new_value}`);
          if (is_valid(new_value))
          {
              if (field in chapter_object)
              {
                  const old_value = chapter_object[field];
                  console_log(`old_value = ${old_value}`);
                  if (typeof new_value === "string")
                  {
                      if (typeof old_value === "string")
                      {
                          if (field == chapter_name_field)
                          {
                              if (old_value != new_value)
                              {
                                  if (old_value == "" || old_value == null || old_value == undefined)
                                  {
                                      chapter_object[field] = new_value;
                                  } else
                                  {
                                      console.warn(`WARNING: cannot decide between the following chapter names: ${old_value} and ${new_value}`);
                                  }
                              }
                          } else
                          {
                              chapter_object[field] += '\n ' + new_value;
                          }
                      } else if (Array.isArray(old_value))
                      {
                          if (!old_value.includes(new_value))
                          {
                              chapter_object[field].push(new_value);
                          }
                      }
                  } else if (Array.isArray(new_value))
                  {
                      if (new_value.length > 0)
                      {
                          let updated_array = [];
                          if (typeof old_value === "string")
                          {
                              updated_array = [old_value];
                          } else if (Array.isArray(old_value))
                          {
                              updated_array = old_value;
                          }
  
                          for (let i = 0; i < new_value.length; i++)
                          {
                              if (!updated_array.includes(new_value[i]))
                              {
                                  updated_array.push(new_value[i]);
                              }
                          }
                          chapter_object[field] = updated_array;
                      }
                  }
              } else
              {
                  if ((typeof new_value === "string" && new_value == "") || (Array.isArray(new_value) && new_value.length == 0))
                  {
                      console_log("culling empty values");
                  } else
                  {
                      chapter_object[field] = new_value;
                  }
              }
          }
      });
  
      console_log(`chapter_object = ${JSON.stringify(chapter_object)}`);
      chapters[chapter_key] = chapter_object;
      console_log(`Chapter ${chapterNumber}:\n${JSON.stringify(chapters[chapter_key])}`);
  
      return chapters;
  }
  
 
// Function to process a chunk and update the chapters object
function collate_chapter_chunk(chapters, chunk, current_chapter_number, args) 
{
    const current_chapter_field = args.current_chapter;
    const new_chapter_field = args.new_chapter;

    let chapterNumber = current_chapter_number;

    if (current_chapter_field in chunk)
    {

        const currentChapter = chunk[current_chapter_field];
        chapters = parse_chapter_info(chapters, chapterNumber, currentChapter, args);
    }

    // Check if the chunk represents a new chapter
    if (new_chapter_field in chunk)
    {
        console_log("---------- found new chapter ----------");
        chapterNumber += 1;
        console_log(`Chapter ${chapterNumber}:`);
        const newChapter = chunk[new_chapter_field];
        chapters = parse_chapter_info(chapters, chapterNumber, newChapter, args);
    }

    console_log(`[collate chapter chunk] [INFO] chapterNumber was: ${current_chapter_number}, now: ${chapterNumber}`);
    return { chapters: chapters, chapter_number: chapterNumber };
}


export { processChapter as processChapter, collate_chapter_chunk }
export { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP }
export { AVERAGE_CHARACTER_PER_WORD, AVERAGE_WORD_PER_TOKEN }