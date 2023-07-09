// langchain_script.js

import { FaissStore } from "langchain/vectorstores/faiss";
import { Embeddings } from "langchain/embeddings/base";
import { encoding_for_model } from "@dqbd/tiktoken";
import MurmurHash3 from 'imurmurhash';

const GPT_SIZE_MARGIN = 500;
const GPT3_MODEL_SMALL = "gpt-3.5-turbo";
const GPT3_MODEL_LARGE = "gpt-3.5-turbo-16k";
const GPT3_SIZE_CUTOFF = 4096 - GPT_SIZE_MARGIN;
const GPT3_SIZE_MAX = 8192 - GPT_SIZE_MARGIN;

const GPT4_MODEL_SMALL = "gpt-4";
const GPT4_MODEL_LARGE = "gpt-4-32k";
const GPT4_SIZE_CUTOFF = 8192 - GPT_SIZE_MARGIN;
const GPT4_SIZE_MAX = 32768 - GPT_SIZE_MARGIN;

const GPT_MODEL_TIKTOKEN_GPT3 = "gpt-3.5-turbo";
const NO_FUNCTIONS = "<NO_FUNCTIONS>"
const OMNITOOL_DOCUMENT_TYPES_USERDOC = 'udoc';


const DEFAULT_CHUNK_SIZE = 2000;
const DEFAULT_VECTORSTORE_NAME = 'omnitool';
const DEFAULT_TEMPERATURE = 0.0;
const DEFAULT_TOP_P = 1.0;

let GLOBAL_ALLOW_GPT3 = true;
let GLOBAL_ALLOW_GPT4 = false;
let GLOBAL_EMBEDDINGS = null;

const VERBOSE = true;

function console_log(...args)
{
  if (VERBOSE == true)
  {
    console.log("------ langchain -------")
    console.log(...args);
    console.log("\n")
  }
}

function pick_model(text_size) 
{

  if (text_size > GPT4_SIZE_MAX) throw new Error(`Text size ${text_size} is too large`);

  if (text_size > GPT4_SIZE_CUTOFF) 
  {
    if (GLOBAL_ALLOW_GPT4) return GPT4_MODEL_LARGE;
  }

  if (text_size > GPT3_SIZE_MAX) 
  {
    if (GLOBAL_ALLOW_GPT4) return GPT4_MODEL_SMALL;
    throw new Error(`Text size ${text_size} is too large for GPT-3`);
  }

  if (!GLOBAL_ALLOW_GPT3) return GPT4_MODEL_SMALL;

  if (text_size > GPT3_SIZE_CUTOFF) 
  {
    return GPT3_MODEL_LARGE;
  }

  return GPT3_MODEL_SMALL;

}

class OmniOpenAIEmbeddings extends Embeddings
{
  constructor(ctx, modelName = "text-embedding-ada-002", stripNewLines = true)
  {
    super();
    this.ctx = ctx;
    this.db = ctx.app.services.get('db');
  
    this.modelName = modelName;
    this.stripNewLines = stripNewLines;

    if (!this.ctx)
    {
      throw new error (`Context not provided`);
    }
  }

  async embedDocuments(texts)
  {
    
    const embeddings = [];
    if (is_list_valid(texts))
    {
      for (let i = 0; i < texts.length; i += 1)
      {
        let text = texts[i];
        const embedding_id = calculate_hash(text);
        const db_embedding = await user_db_get(this.ctx, embedding_id, this.db); // TBD need to have a method that check if it exists in the DB without creating a lot of error log trash
        if (is_list_valid(db_embedding))
        {
          embeddings.push(db_embedding);
        }
        else
        {
          console_log(`[${i}] generating embedding for ${text.slice(0, 128)}`);
          try
          {
            const response = await this.compute_embedding(this.ctx, text);
            const openai_embedding = response.embedding;
            embeddings.push(openai_embedding);

            const success = await user_db_put(this.ctx, openai_embedding, embedding_id, this.db);
            if (success == false)
            {
              throw new Error(`Error saving embedding for text index ${i}`);
            }
            else
            {
              console_log(`[${i}] saved to DB`);
            }
          } catch (error)
          {
            throw new Error(`Error generating embedding for text index ${i}: ${error}`);
          }
        }
      }
    }
    return embeddings;
  }

  async embedQuery(text)
  {
    const { embedding } = await this.compute_embedding(this.ctx, text);
    return embedding;
  }

  async compute_embedding(ctx, input)
  {
    let args = {};
    args.user = ctx.user.id;
    args.input = input;

    let response = null;
    try
    {
      response = await runBlock(ctx, 'openai.embeddings', args);
    }
    catch (err)
    {
      let error_message = `Error running openai.embeddings: ${err.message}`;
      console.error(error_message);
      throw err;
    }

    if (response == null) { throw new Error(`embedding runBlock response is null`) };

    if (response.error)
    {
      let error_message = `runBlock response.error: ${response.error}`;
      console.error(error_message);
      throw err;
    }

    let data = response?.data || null;
    if (is_list_valid(data) == false) { throw new Error(`embedding runBlock response is invalid: ${JSON.stringify(response)}`) };

    const embedding = response?.data[0]?.embedding || null;
    return { embedding: embedding };
  }
}

function sanitizeString(original, use_escape_character = false)
{
  return use_escape_character
    ? original.replace(/'/g, "\\'").replace(/"/g, '\\"')
    : original.replace(/'/g, "‘").replace(/"/g, '“');
}

function sanitizeJSON(jsonData)
{
  if (typeof jsonData === 'string')
  {
    return sanitizeString(jsonData);
  }

  if (typeof jsonData === 'object')
  {
    if (Array.isArray(jsonData))
    {
      return jsonData.map(sanitizeJSON);
    }

    return Object.fromEntries(
      Object.entries(jsonData).map(([key, value]) => [key, sanitizeJSON(value)])
    );
  }
}


function delay(ms)
{
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pauseForSeconds(seconds)
{
  console_log('Before pause');

  await delay(seconds * 1000); // Convert seconds to milliseconds

  console_log('After pause');
}

async function runChatGptBlock(ctx, args) 
{
  const prompt = args.prompt;
  const instruction = args.instruction;
  
  const prompt_cost = count_tokens_in_text(prompt);
  const instruction_cost = count_tokens_in_text(instruction);
  const cost = prompt_cost + instruction_cost;

  args.model = pick_model(cost);

  let response = null;
  try
  {
    response = await runBlock(ctx, 'openai.advancedChatGPT', args);
  }
  catch (err)
  {
    let error_message = `Error running openai.advancedChatGPT: ${err.message}`;
    console.error(error_message);
    throw err;
  }
  return response
}

async function fix_with_llm(ctx, json_string_to_fix)
{
  console_log(`[FIXING] fix_with_llm: Fixing JSON string with LLM: ${json_string_to_fix}`);
  let response = null;
  let args = {};
  args.user = ctx.user.id;
  args.prompt = json_string_to_fix;
  args.instruction = "Fix the JSON string below. Do not output anything else but the carefully fixed JSON string.";;
  args.temperature = 0;
  args.top_p = 1;

  try
  {
    response = await runChatGptBlock(ctx, args);
    console_log(`Response from advncedChatGPT: ${JSON.stringify(response)}`);
  }
  catch (err)
  {
    console.error(`[FIXING] fix_with_llm: Error fixing json with GPT-3: ${err}`);
    return null;
  }

  let text = response?.answer_text || "";
  console_log(`[FIXING] fix_with_llm: text: ${text}`);

  if (is_string_valid(text) === false) return null;

  return text;

}


async function fix_json_string(ctx, passed_string) 
{

  if (is_string_valid(passed_string) === false)
  {
    throw new Error(`[FIXING] fix_json_string: passed string is not valid: ${passed_string}`);

  }

  // Replace \n with actual line breaks
  let cleanedString = passed_string.replace(/\\n/g, '\n');
  let jsonObject = null;
  let fixed = false;
  let attempt_count = 0;
  let attempt_at_cleaned_string = cleanedString;
  while (fixed === false && attempt_count < 10)
  {
    attempt_count++;
    console_log(`[FIXING] Attempting to fix JSON string after ${attempt_count} attempts.\n`);

    try 
    {
      jsonObject = JSON.parse(attempt_at_cleaned_string);
    }
    catch (err)
    {
      console.error(`[FIXING] [${attempt_count}] Error fixing JSON string: ${err}, attempt_at_cleaned_string: ${attempt_at_cleaned_string}`);
    }

    if (jsonObject !== null && jsonObject !== undefined)
    {
      fixed = true;
      console_log(`[FIXING] Successfully fixed JSON string after ${attempt_count} attempts.\n`);
      return jsonObject;
    }


    let response = await fix_with_llm(ctx, passed_string);
    if (response !== null && response !== undefined)
    {
      attempt_at_cleaned_string = response;
    }
    await pauseForSeconds(0.5);

  }

  if (fixed === false)
  {
    throw new Error(`Error fixing JSON string after ${attempt_count} attempts.\ncleanedString: ${cleanedString})`);
  }

  return "{}";
}


function clean_string(original)
{
  if (is_string_valid(original) == false)
  {
    return "";
  }

  let text = sanitizeString(original);

  // Replace newline characters with a space
  text = text.replace(/\n+/g, ' ');

  // Replace multiple spaces with a single space
  text = text.replace(/ +/g, ' ');

  return text;

}

const runBlock = async (ctx, block, args) =>
{
  const componentService = ctx.app.services.get('componentService');
  const component = componentService.components.get(block);

  if (!component) throw new Error(`Component ${block} not found`);

  const node = {
    id: block,
    name: block,
    type: 'component',
    component: block,
    inputs: [],
    outputs: [],
    data: {}
  };
  const inputData = {};
  for (const key in args)
  {
    inputData[key] = [args[key]]; // inputs are arrays
  }
  const outputData = { text: '' };

  const input_string = JSON.stringify(inputData);
  const parsed_data = JSON.parse(input_string);
  const ctx2 = { node, inputs: parsed_data, outputs: outputData, app: ctx.app, workflowId: 0, sessionId: ctx.session.sessionId, userId: ctx.user.id, jobId: 0, engine: null, args: {} };

  try
  {
    const result = await component.workerStart(inputData, ctx2);
    return result;
  }
  catch (err)
  {
    throw new Error(`Error running block ${block}: ${err}`);
  }
};

async function query_advanced_chatgpt(ctx, prompt, instruction, functions=NO_FUNCTIONS, temperature=0, top_p = 1)
{

  let args = {};
  args.user = ctx.user.id;
  args.prompt = prompt;
  args.instruction = instruction;
  args.temperature = temperature;
  args.top_p = top_p;

  if (functions != NO_FUNCTIONS) args.functions = functions;

  const response = await runChatGptBlock(ctx, args);
  if (response.error) throw new Error(response.error);

  const total_tokens = response?.usage?.total_tokens || 0;
  let text = response?.answer_text || "";
  let function_arguments = response?.function_arguments || "";

  if (is_string_valid(function_arguments) == true) function_arguments = await fix_json_string(ctx, function_arguments);
  if (is_string_valid(text) == true) text = clean_string(text);


  const return_value = {
    text: text,
    function_arguments: function_arguments,
    total_tokens: total_tokens
  };

  return return_value;
}

function count_tokens_in_text(text)
{
  const model_type = GPT_MODEL_TIKTOKEN_GPT3; // there's a simplification here as we don't consider GPT4 
  let encoding;

  try
  {
    encoding = encoding_for_model(model_type);
  }
  catch (e)
  {
    throw new Error(`Error getting encoding for model ${model_type}: ${e}`);
  }

  const tokens = encoding.encode(text);
  if (tokens !== null && tokens !== undefined && tokens.length > 0)
  {
    const num_tokens = tokens.length;
    encoding.free();

    return num_tokens;
  }
  else
  {
    encoding.free();
    return 0;
  }
}

async function run_llm_on_chunk(ctx, chunk, instruction, functions, temperature, top_p)
{

  let combined_text = chunk.overlap_text + " " + chunk.text;

  const gpt_results = await query_advanced_chatgpt(ctx, combined_text, instruction, functions, temperature, top_p);
  const actual_token_cost = gpt_results.total_tokens;

  let json_results = {
    index: chunk.index,
    first_sentence_index: chunk.first_sentence_index,
  };
  const sanetized_results = sanitizeJSON(gpt_results);

  json_results = Object.assign(json_results, sanetized_results);
  json_results.total_tokens = actual_token_cost;
  json_results.total_cost = actual_token_cost;

  return json_results;
}

function break_into_sentences(text, chunk_size)
{
  let sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let total_words = 0;
  let sentence_infos = [];
  let total_cost = 0;

  for (let i = 0; i < sentences.length; i++)
  {
    let sentence = sentences[i].trim();
    if (i % 100 == 0) console_log(`sentence #${i}: ${sentence}`);

    let token_cost = count_tokens_in_text(sentence);

    // Check for sentences that exceed the chunk size
    if (token_cost > chunk_size)
    {
      console.warning(`[WARNING] sentence #${i} with cost ${token_cost} exceeds the chunk size ${chunk_size}`);
      continue; // skip this sentence or handle it appropriately
    }

    let words = sentence.split(" ");
    let num_words = words.length;
    total_words += num_words;
    total_cost += token_cost;

    let sentence_info = {
      text: sentence,
      index: i,
      token_cost: token_cost,
    };

    sentence_infos.push(sentence_info);
  }

  console_log(`Number of sentences: ${sentences.length} : Total Token Cost =${total_cost}, Total number of words=${total_words}, ratio: ${total_words / total_cost} `);
  return [sentence_infos, total_cost, total_words];
}

async function compute_chunks(ctx, text, base_name, chunk_size = 3000)
{
  const embedder = GLOBAL_EMBEDDINGS;
  const [sentence_infos, total_cost, total_words] = break_into_sentences(text, chunk_size);

  const chunks_list = [];
  let chunk_index = 0;


  let chunk = {
    index: 0,
    text: "",
    first_sentence_index: 0,
    token_cost: 0,
    overlap_text: "",
    overlap_cost: 0,
    id: "",
    embedding: null,
  };

  let overlap_text = "";
  let overlap_cost = 0;
  for (let sentence_index = 0; sentence_index < sentence_infos.length; sentence_index++)
  {
    let sentence_info = sentence_infos[sentence_index];

    if (chunk.token_cost + sentence_info.token_cost <= chunk_size)
    {
      chunk.token_cost += sentence_info.token_cost;
      chunk.text += " " + sentence_info.text;
      overlap_text = sentence_info.text;
      overlap_cost = sentence_info.token_cost;
    }
    else
    {
      chunk.id = base_name + "_" + calculate_hash(chunk.text);
      chunks_list.push(chunk);

      chunk_index++;
      chunk = {
        index: chunk_index,
        text: sentence_info.text,
        first_sentence_index: sentence_info.index,
        token_cost: sentence_info.token_cost,
        overlap_text: overlap_text || "",
        overlap_cost: overlap_cost || 0,
        id: ""
      };
    }
  }
  const response = await embedder.compute_embedding(ctx, chunk.text);
  const chunk_embedding = response?.embedding;
  chunk.embedding = chunk_embedding; 
  chunk.id = base_name + "_" + calculate_hash(chunk.text);
  await save_embedding_to_db(ctx, chunk.embedding, chunk.id);

  chunks_list.push(chunk);
  console_log(`Chunked the document into ${chunks_list.length} chunks with an estimated token cost of ${total_cost} and ${total_words} words`);
  let return_value = [chunks_list, total_cost, total_words];
  return return_value;
}

async function save_embedding_to_db(ctx, embedding, embedding_id)
{
  const db = get_db(ctx);
  const success = await user_db_put(ctx, embedding, embedding_id, db);
  if (!success) throw new Error("Failed to save embedding to db");
}

function get_db(ctx)
{
  const db = ctx.app.services.get('db');
  return db;
}

function get_effective_key(ctx, key)
{
  return `${ctx.userId}:${key}`;
}

async function user_db_put(ctx, value, key, db, rev = undefined)
{
  const effectiveKey = get_effective_key;

  console_log(`user_db_put: ${key} = ${effectiveKey} with rev ${rev}`);

  let effective_rev = rev;
  if (effective_rev == undefined)
  {
    try
    {
      const get_result= await db.getDocumentById(OMNITOOL_DOCUMENT_TYPES_USERDOC, effectiveKey);
      effective_rev = get_result._rev;

      console_log(`fixing rev SUCCEEDED - deleteted rev ${effective_rev}`)
    }
    catch (e)
    {
      console_log(`fixing rev failed`)
    } 
  }

  try
  {
    let json = await db.putDocumentById(OMNITOOL_DOCUMENT_TYPES_USERDOC, effectiveKey, { value: value }, effective_rev);
    if (json == null) 
    {
      console_log(`user_db_put: ${key} = ${effectiveKey} failed`);
      return false
    }
    else
    {
      console_log(`user_db_put: ${key} = ${effectiveKey} succeeded`);
    }
  }
  catch (e)
  {
    throw new Error(`user_db_put: ${key} = ${effectiveKey} failed with error: ${e}`);
  }

  return true;
}

async function user_db_get(ctx, key, db)
{

  const effectiveKey = `${ctx.userId}:${key}`;

  let json = null;
  try
  {
    json = await db.getDocumentById(OMNITOOL_DOCUMENT_TYPES_USERDOC, effectiveKey);
  }
  catch (e)
  {
    console_log(`usr_db_get: ${key} = ${effectiveKey} failed with error: ${e}`);
  }
  
  if (json == null) return null;

  const json_value = json.value;
  if (json_value == null) 
  {
    console_log(`usr_db_get NULL VALUE. DELETING IT: ${key} = ${effectiveKey} json = ${JSON.stringify(json)}`);
    await db.deleteDocumentById(OMNITOOL_DOCUMENT_TYPES_USERDOC, effectiveKey, json._rev);
    return null;
  }

  return json_value;
}
async function create_vectorstore_from_texts(texts, text_ids, embedder)
{
  console_log(`ingest: texts = ${texts.length}, text_ids = ${text_ids.length}, embedder = ${embedder}`);
  let vectorstore = await FaissStore.fromTexts(texts, text_ids, embedder);
  return vectorstore;
}

async function query_vectorstore(vector_store, query, nb_of_results = 1, embedder)
{
  const vector_query = await embedder.embedQuery(query);
  const results = await vector_store.similaritySearchVectorWithScore(vector_query, nb_of_results);
  return results;
}

function calculate_hash(text)
{
  const hashState = new MurmurHash3();
  const checksum = hashState.hash(text).result().toString();
  return checksum;
}

function get_texts_and_ids(chunks_list)
{
  if (is_list_valid(chunks_list) == false) throw new Error(`get_texts_and_ids: chunks_list is invalid`);
  let chunk_texts = [];
  let chunk_ids = [];
  for (let i = 0; i < chunks_list.length; i++)
  {
    const chunk_info = chunks_list[i];
    const chunk_text = chunk_info.text;
    const chunk_id = chunk_info.id;

    chunk_ids.push({ id: chunk_id });
    chunk_texts.push(chunk_text);

  }
  return [chunk_texts, chunk_ids];
}

function is_list_valid(l)
{
  const is_invalid = (l == null || l == undefined || Array.isArray(l) == false || l.length == undefined || l.length == 0);
  const is_valid = !is_invalid;
  return is_valid;
}
function is_string_valid(s)
{
  const is_invalid = (s == null || s == undefined || (typeof s === 'string' || s instanceof String) == false || s.length == undefined || s.length == 0);
  const is_valid = !is_invalid;

  return is_valid;
}

function adjust_chunk_size(chunk_size)
{

  if (GLOBAL_ALLOW_GPT4)
  {
    const max_size = GPT4_SIZE_MAX;
    if (chunk_size > max_size) 
    {
      console.warn(`WARNING: chunk_size ${chunk_size} is too large for GPT4, adjusting to max size of ${max_size}`)
      return max_size;
    }
  }
  else
  {
    const max_size = GPT3_SIZE_MAX;
    if (chunk_size > max_size)
    {
      console.warn(`WARNING: chunk_size ${chunk_size} is too large for GPT3, adjusting to max size of ${max_size}`)
      return max_size;
    }
  }

  return chunk_size;
}


async function save_json_to_cdn_as_buffer(ctx, json)
{
  const responses_string = JSON.stringify(json, null, 2).trim();
  const buffer = Buffer.from(responses_string);
  const cdn_response = await ctx.app.cdn.putTemp(buffer);
  console.log(`cdn_response = ${JSON.stringify(cdn_response)}`);
  return cdn_response;
}


async function save_json_to_cdn(ctx, json)
{
  const responses_string = JSON.stringify(json, null, 2).trim();
  const buffer = Buffer.from(responses_string);
  const cdn_response = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8' });
  console_log(`cdn_response = ${JSON.stringify(cdn_response)}`);

  return cdn_response;
}

async function get_json_from_cdn(ctx, cdn_response)
{
  if ("ticket" in cdn_response == false) throw new Error(`get_json_from_cdn: cdn_response = ${JSON.stringify(cdn_response)} is invalid`);  
  
  const response_from_cdn = await ctx.app.cdn.get(cdn_response.ticket, null, 'asBase64');
  if (response_from_cdn == null) throw new Error(`get_json_from_cdn: document = ${JSON.stringify(response_from_cdn)} is invalid`);

  let json = null;
  try
  {
    const str = response_from_cdn.data.toString();
    const buffer = Buffer.from(str, 'base64');
    const json_string = buffer.toString('utf8');

    json = JSON.parse(json_string);

  }
  catch (e)
  {
    throw new Error(`get_json_from_cdn: error converting response_from_cdn.data to utf-8, error = ${e}`);
  }

  return json;
}

async function get_chunks_from_cdn(ctx, chunks_cdn)
{
  const chunks_json= await get_json_from_cdn(ctx, chunks_cdn);
  const chunks = chunks_json.chunks;
  if (is_list_valid(chunks) == false) throw new Error(`Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

  return chunks;
}

async function query_chunks(ctx, chunks_cdn, query, args)
{
  const chunks = await get_chunks_from_cdn(ctx, chunks_cdn);
  if (is_list_valid(chunks) == false) throw new Error(`Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

  const nb_of_results = args.nb_of_results;
  const embedder = GLOBAL_EMBEDDINGS;

  const vectorstore = await compute_vectorstore(chunks, embedder);
  const query_answers = await smartquery_from_vectorstore(ctx, vectorstore, query, nb_of_results, embedder);

  return query_answers;
}

async function loop_llm_on_chunks(ctx, chunks_cdn, instruction, functions, args)
{
  const chunks = await get_chunks_from_cdn(ctx, chunks_cdn);
  if (is_list_valid(chunks) == false) throw new Error(`Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

  const temperature = args.temperature || DEFAULT_TEMPERATURE;
  const top_p = args.top_p || DEFAULT_TOP_P;

  let chunks_results = [];
  for (let i = 0; i < chunks.length; i++)
  {
    const chunk = chunks[i];
    const chunk_result = await run_llm_on_chunk(ctx, chunk, instruction, functions, temperature, top_p);
    chunks_results.push(chunk_result);
  }

  return chunks_results;
}

async function compute_vectorstore(chunks, embedder)
{
  // we recompute the vectorstore from the each chunk's text each time because the load/save ability of embeddings in langchain 
  // is bound to disk operations and I find it distateful to save to temp files on the disk just to handle that.
  // However, the embedding class itself will check if the embeddings have been
  // computed already and will not recompute them - given the exact same text hash and vectorstore_name.

  console_log(`----= grab_vectorstore: all_chunks# = ${chunks.length} =----`);
  if (is_list_valid(chunks) == false) throw new Error(`Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

  const [all_texts, all_ids] = get_texts_and_ids(chunks);
  const vectorstore = await create_vectorstore_from_texts(all_texts, all_ids, embedder);
  return vectorstore;
}

async function smartquery_from_vectorstore(ctx, vectorstore, query, nb_of_results, embedder)
{
  console_log(`----= smartquery from vectorstore =----`);

  if (is_string_valid(query) == false) throw new Error(`ERROR: query is invalid`); 
  let vectorstore_responses = await query_vectorstore(vectorstore, query, nb_of_results, embedder);

  let query_answers = [];
  for (let i = 0; i < vectorstore_responses.length; i++) 
  {
    const vectorestore_response_array = vectorstore_responses[i];
    const [vectorstore_response, score] = vectorestore_response_array;
    const pageContent = vectorstore_response?.pageContent;
    const metadata = vectorstore_response?.metadata; // contains reference to the chunk that was matched

    const instruction = `Please review the passed document fragment and see if you can answer the following question based solely on it: ${query}.\nHowever, do not say 'Based solely on the document fragment,' or anything like that. Instead, just answer the question. Thanks!`;
    const query_answer_json = await query_advanced_chatgpt(ctx, pageContent, instruction);
    const query_answer = query_answer_json?.text || null;
    if (is_string_valid(query_answer) == false) throw new Error(`ERROR: query_answer is invalid`);
    query_answers.push(query_answer);
  }

  if (is_list_valid(query_answers) == false)
  {
    let error_message = `[ERROR] Error getting answers from query_vectorstore_with_llm with query = ${query}`;
    throw new Error(error_message);
  }
  
  return query_answers;
}


function clean_vectorstore_name(vectorstore_name)
{
  if (is_string_valid(vectorstore_name) == false) throw new Error(`ERROR: vectorstore_name is invalid`);
  const clean_name = vectorstore_name.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]+/g, "");
  return clean_name;
}

function compute_chunks_id(texts, vectorstore_name)
{
  // get the key so that we can pass it around
  if (is_list_valid(texts) == false) throw new Error(`ERROR: texts is invalid`);

  // we want the same texts but chunked differently to produce a different hash
  let sum_of_hashs = "";
  for (let i = 0; i < texts.length; i++)
  {
    sum_of_hashs += calculate_hash(texts[i]);
  }
  const chunks_id  = vectorstore_name + "_" + calculate_hash(sum_of_hashs);
  console_log(`----= compute_chunks_id:  = ${chunks_id} =----`);

  return chunks_id;
}


async function gather_all_texts_from_documents(ctx, files)
{
  console_log(`----= gather_all_texts_from_documents: files# = ${files.length} =----`);
 
  if (is_list_valid(files) == false) throw new Error(`ERROR: targets is invalid`);

  let texts = [];
  for (let i = 0; i < files.length; i++) 
  {

    const target = files[i];
    //TBD: convert docs files to text when necessary
    const document = await ctx.app.cdn.get(target.ticket);
    const mimeType = target.mimeType || 'text/plain; charset=utf-8';
    const text = document.data.toString() || "";
    if (is_string_valid(text) == false) 
    {
      console_log(`WARNING: text is null or undefined or empty for document = ${JSON.stringify(document)}`);
      continue;
    }

    const clearn_text = clean_string(text);
    texts.push(clearn_text);
  }

  return texts;
}

function is_object_valid(obj)
{
  const is_invalid = (obj == null || obj == undefined || obj == {});
  return !is_invalid;
}



async function files_to_chunks_cdn(ctx, files, args)
{
  const texts = await gather_all_texts_from_documents(ctx, files);
  if (is_list_valid(texts) == false) throw new Error(`ERROR: texts is invalid`);

  const chunk_size = args.chunk_size || DEFAULT_CHUNK_SIZE;
  const vectorstore_name = args.vectorstore_name || DEFAULT_VECTORSTORE_NAME;

  const chunks_id = compute_chunks_id(texts, vectorstore_name);
 
  let chunks_cdn = await get_chunks_cdn_from_db(ctx, chunks_id);
  if (is_object_valid(chunks_cdn) == false) 
  {
    console_log(`Found no Chunk CDN records for id = ${chunks_id} in the DB. Chunking now...`);

    let chunks = [];
    let total_cost = 0;
    let total_words = 0;

    for (let i = 0; i < texts.length; i++) 
    {
      let text = texts[i];
      const [chunks_list, cost, words] = await compute_chunks(ctx, text, vectorstore_name, chunk_size);
      total_cost += cost;
      total_words += words;

      if (is_list_valid(chunks_list) == false)
      {
        console_log(`ERROR could not chunk the document with doc_checksum = ${doc_id}`);
        continue;
      }
      chunks = chunks.concat(chunks_list);
    }

    if (is_list_valid(chunks) == false) 
    {
      throw new Error(`ERROR could not chunk the documents`);
    }

    chunks_cdn = await save_chunks_to_cdn(ctx, chunks, chunks_id, total_cost, total_words);
    if (is_object_valid(chunks_cdn) == false) throw new Error(`ERROR: could not save chunks_cdn to cdn`);
    console_log(`files__to_chunks_cdn: = ${JSON.stringify(chunks_cdn)}`);

    const success = await save_chunks_cdn_to_db(ctx, chunks_cdn, chunks_id);
    if (success == false) throw new Error(`ERROR: could not save chunks_cdn to db`);
  }
  else
  {
    console_log(`Found Chunk CDN records for id = ${chunks_id} in the DB. Skipping chunking...`);
  }
  console_log(`chunks_cdn = ${JSON.stringify(chunks_cdn)}`);
  return chunks_cdn;
}

async function save_chunks_to_cdn(ctx, chunks, chunks_id, total_cost, total_words)
{
  const chunks_json = {chunks:chunks, chunks_id:chunks_id, total_cost:total_cost, total_words:total_words};
  const chunks_cdn = await save_json_to_cdn_as_buffer(ctx, chunks_json);
  if (is_object_valid(chunks_cdn) == false) throw new Error(`ERROR: could not save chunks_cdn to cdn`);
  return chunks_cdn;
}

async function save_chunks_cdn_to_db(ctx, chunks_cdn, chunks_id)
{
  const db = get_db(ctx);
  const success = await user_db_put(ctx, chunks_cdn, chunks_id, db);
  if (success == false) throw new Error(`ERROR: could not save chunks_cdn to db`);
  return success;
}

async function get_chunks_cdn_from_db(ctx, chunks_id)
{
  const db = get_db(ctx);
  const chunks_cdn = await user_db_get(ctx, chunks_id, db);
  return chunks_cdn;

}



const script =
{

  name: 'langchain_ingest',

  exec: async function (ctx, payload, opts)
  {

    // Reading input from payload
    payload = JSON.parse(JSON.stringify(payload));
    const query = payload.query || null;
    const nb_of_results = payload.nb_of_results || 3;
    const functions = payload.functions || NO_FUNCTIONS;
    const instruction = payload.instruction || "";
    const top_p = payload.top_p || 1;
    const temperature = payload.temperature || 0;
    const use_chatgpt = payload.use_chatgpt || false;
    const use_query = payload.use_query || false;
    const allow_gpt3 = payload.use_gpt3 || true;
    const allow_gpt4 =  payload.use_gpt4 || false;
    

    let vectorstore_name = payload.vectorstore_name || DEFAULT_VECTORSTORE_NAME;
    let chunk_size = payload.chunk_size || DEFAULT_CHUNK_SIZE;

    // Reading files from optinal field (opts)
    const files = opts.files;

    // Adjusting inputs
    vectorstore_name = clean_vectorstore_name(vectorstore_name);

    // Checking inputs
    if (use_chatgpt && instruction == "") throw new Error(`ERROR: When using chatgpt, instruction is a required field`);
    if (use_query && query == "") throw new Error(`ERROR: When using query, query is a required field`);
    if (!allow_gpt3 && !allow_gpt4) throw new Error(`ERROR: You must allow at least one LLM model`);
    GLOBAL_ALLOW_GPT3 = allow_gpt3;
    GLOBAL_ALLOW_GPT4 = allow_gpt4;
    chunk_size = adjust_chunk_size(chunk_size);

    if (is_list_valid(files) == false) throw new Error(`ERROR: files are invalid`);

    // Logging input parameters
    console_log(`\n--------------------------\nINPUT PARAMETERS:\n--------------------------\nuse_chatgpt = ${use_chatgpt}\nuse_query = ${use_query}\nquery = ${query}\nnb_of_results = ${nb_of_results}\nfunctions = ${functions}\ninstruction = ${instruction}\ntop_p = ${top_p}\ntemperature = ${temperature}\nvectorstore_name = ${vectorstore_name}\nchunk_size = ${chunk_size}\n--------------------------\n`);

    // Output variables
    let return_value = { result: { "ok": true }, files: {} };
    let json_result = { chunks_cdn: null, query_answers: [], llm_results: [] };

    GLOBAL_EMBEDDINGS = new OmniOpenAIEmbeddings(ctx);
    const args = {chunk_size:chunk_size, allow_gpt3:allow_gpt3, allow_gpt4:allow_gpt4, top_p:top_p, temperature:temperature, nb_of_results:nb_of_results, vectorstore_name:vectorstore_name};

    // From files to chunks_id (handling chunking, retrieveing and/or saving to db)
    const chunks_cdn = await files_to_chunks_cdn(ctx, files, args);
    json_result.chunks_cdn = chunks_cdn;   

    if (use_chatgpt)
    {
      json_result.llm_results = await loop_llm_on_chunks(ctx, chunks_cdn, instruction, functions, args);
      console_log(`llm_results length = ${json_result.llm_results.length}`);
    }

    if (use_query) 
    {
      json_result.query_answers = await query_chunks(ctx, chunks_cdn, query, args);
      console_log(`query_answers length = ${json_result.query_answers.length}`);
    }
    
    // Saving to the CDN
    const cdn_response = await save_json_to_cdn(ctx, json_result);
    console_log(`cdn_response = ${JSON.stringify(cdn_response)}`);

    // Returning results
    return_value.files = [cdn_response]

    return return_value;

  }
};

export default script;
export { files_to_chunks_cdn, loop_llm_on_chunks, query_chunks, save_json_to_cdn  };
