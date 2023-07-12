//langchain_script.js

import { FaissStore } from "langchain/vectorstores/faiss";
import { Embeddings } from "langchain/embeddings/base";
import { encoding_for_model } from "@dqbd/tiktoken";
import MurmurHash3 from 'imurmurhash';
import PDFParser from 'pdf2json';
import "@tensorflow/tfjs-backend-cpu";
import { TensorFlowEmbeddings } from "langchain/embeddings/tensorflow";

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
const NO_FUNCTIONS = "<NO_FUNCTIONS>";
const OMNITOOL_DOCUMENT_TYPES_USERDOC = 'udoc';

const DEFAULT_CHUNK_SIZE = 2000;
const DEFAULT_VECTORSTORE_NAME = 'omnitool';
const DEFAULT_TEMPERATURE = 0.0;
const DEFAULT_TOP_P = 1.0;

let GLOBAL_ALLOW_GPT3 = true;
let GLOBAL_ALLOW_GPT4 = false;
const VERBOSE = true;

function is_valid(value)
{
    if (value === null || value === undefined)
    {
        return false;
    }

    if (Array.isArray(value) && value.length === 0)
    {
        return false;
    }

    if (typeof value === 'object' && Object.keys(value).length === 0)
    {
        return false;
    }

    if (typeof value === 'string' && value.trim() === '')
    {
        return false;
    }

    return true;
}


async function parsePDFData(buffer)
{
    const pdfParser = new PDFParser();

    // Create a promise-based wrapper for the pdfParser.on("pdfParser_dataReady") event
    const onDataReady = () =>
        new Promise((resolve) =>
        {
            pdfParser.on('pdfParser_dataReady', (pdfData) =>
            {
                resolve(pdfData);
            });
        });

    pdfParser.on('pdfParser_dataError', (errData) =>
    {
        console.error(errData.parserError);
    });

    // Parse the PDF buffer
    pdfParser.parseBuffer(buffer);

    // Wait for the "pdfParser_dataReady" event to be emitted
    const pdfData = await onDataReady();

    return pdfData;
}

async function parsePDF(buffer)
{
    try
    {
        const pdfData = await parsePDFData(buffer);
        return pdfData;
    } catch (error)
    {
        console.error('Error parsing PDF:', error);
        throw error;
    }
}

function extractTextFields(jsonData) 
{
    if (is_valid(jsonData) == false) throw new Error(`extractTextFields: jsonData = ${JSON.stringify(jsonData)} is invalid`);
    const pages = jsonData.Pages;
    if (is_valid(pages) == false) throw new Error(`extractTextFields: pages = ${JSON.stringify(pages)} is invalid`);

    const concatenatedTexts = pages.map((page) => 
    {
        const texts = page.Texts.map((textObj) => decodeURIComponent(textObj.R[0].T));
        return texts.join(' ');
    });

    return concatenatedTexts;
}

function console_log(...args)
{
    if (VERBOSE == true)
    {
        console.log("------ extension: document_processing -------");
        console.log(...args);
        console.log("\n");
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
            throw new error(`Context not provided`);
        }
    }

    async embedDocuments(texts)
    {

        const embeddings = [];
        if (is_valid(texts))
        {
            for (let i = 0; i < texts.length; i += 1)
            {
                let text = texts[i];
                const embedding_id = calculate_hash(text);
                const db_embedding = await user_db_get(this.ctx, embedding_id); // TBD need to have a method that check if it exists in the DB without creating a lot of error log trash
                if (is_valid(db_embedding))
                {
                    embeddings.push(db_embedding);
                }
                else
                {
                    console_log(`[${i}] generating embedding for ${text.slice(0, 128)}`);
                    try
                    {
                        const response = await this.compute_embedding_via_runblock(this.ctx, text);
                        const openai_embedding = response.embedding;
                        embeddings.push(openai_embedding);

                        const success = await user_db_put(this.ctx, openai_embedding, embedding_id);
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
        const embedding = await this.compute_embedding_via_runblock(this.ctx, text);
        return embedding;
    }

    async compute_embedding_via_runblock(ctx, input)
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

        if (response == null) { throw new Error(`embedding runBlock response is null`); };

        if (response.error)
        {
            throw new Error(`embedding runBlock response.error: ${response.error}`);
        }

        let data = response?.data || null;
        if (is_valid(data) == false) { throw new Error(`embedding runBlock response is invalid: ${JSON.stringify(response)}`); };

        const embedding = response?.data[0]?.embedding || null;
        return embedding;
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

async function runChatGPTBlock(ctx, args) 
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
    return response;
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
        response = await runChatGPTBlock(ctx, args);
        console_log(`Response from advncedChatGPT: ${JSON.stringify(response)}`);
    }
    catch (err)
    {
        console.error(`[FIXING] fix_with_llm: Error fixing json with GPT-3: ${err}`);
        return null;
    }

    let text = response?.answer_text || "";
    console_log(`[FIXING] fix_with_llm: text: ${text}`);

    if (is_valid(text) === false) return null;

    return text;

}


async function fix_json_string(ctx, passed_string) 
{

    if (is_valid(passed_string) === false)
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
    if (is_valid(original) == false)
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

async function query_advanced_chatgpt(ctx, prompt, instruction, functions = [], temperature = 0, top_p = 1)
{

    let args = {};
    args.user = ctx.user.id;
    args.prompt = prompt;
    args.instruction = instruction;
    args.temperature = temperature;
    args.top_p = top_p;

    if (functions != []) args.functions = functions;

    const response = await runChatGPTBlock(ctx, args);
    if (response.error) throw new Error(response.error);

    const total_tokens = response?.usage?.total_tokens || 0;
    let text = response?.answer_text || "";
    let function_arguments = response?.function_arguments || "";

    if (is_valid(function_arguments) == true) function_arguments = await fix_json_string(ctx, function_arguments);
    if (is_valid(text) == true) text = clean_string(text);


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


function split_into_sentences(text)
{
    // Use a regular expression to consider sequences not containing '. ', '? ', or '! ' followed by a '.', '?', or '!'
    return text.match(/[^.!?]*[.!?]/g) || [];
}



// Main function to populate chunks
async function compute_chunks(ctx, embedder, text, base_name, chunk_size = 3000, overlap_sentences = 1)
{
    if (embedder == null) throw new Error("No global embeddings available");

    console.log(`----------------> initial text = ${text}`);
    const [chunks_list, total_cost, total_words] = create_chunks(text, base_name, chunk_size, overlap_sentences);

    for (let i = 0; i < chunks_list.length; i++) 
    {
        const embedding_value = await await compute_and_cache_chunk_embedding(ctx, embedder, chunks_list[i]);
        chunks_list[i].embedding = embedding_value;
        console.log(`Computed embeddings for Chunk  ${i}`);
    }

    return [chunks_list, total_cost, total_words];
}

// Main function to create chunks
function create_chunks(text, base_name, chunk_size_in_tokens, overlap_size = 1, word_to_token_ratio = 0.8)
{
    if (typeof text !== 'string') throw new TypeError("Text must be a string");
    if (typeof chunk_size_in_tokens !== 'number' || chunk_size_in_tokens <= 0) throw new TypeError("Chunk size must be a positive number");
    if (typeof overlap_size !== 'number' || overlap_size < 0) throw new TypeError("Overlap sentences must be a non-negative number");

    console.log(`Computing chunks for ${base_name} with chunk size ${chunk_size_in_tokens}, text length ${text.length}, chunk size ${chunk_size_in_tokens}`);

    const sentences = split_into_sentences(text);
    console.log("sentence_infos = ", sentences);
    if (sentences.length === 0) throw new Error("No sentence infos available");

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
        embedding: "<not computed>",
    };
    let chunk_token_count = 0;  // initialize chunk_token_count
    let total_cost = 0;  // to keep track of the total token cost
    let total_words = 0;  // to keep track of the total number of words

    for (let sentence_index = 0; sentence_index < sentences.length; sentence_index++) 
    {
        let sentence = sentences[sentence_index];
        let sentence_token_count = sentence.split(' ').length * word_to_token_ratio;

        if ((chunk.token_cost + sentence_token_count) <= chunk_size_in_tokens)
        {
            // build the current chunk with this sentence
            chunk.text += sentence;
            chunk.token_cost += sentence_token_count;

            console.log(`Adding sentence#${sentence_index} to chunk#${chunk_index} -----> ${sentence}`);
        } else
        {

            // finalize the current chunk
            chunk.id = base_name + "_" + calculate_hash(chunk.text);
            chunks_list.push(chunk);

            // calculate the total token cost
            total_cost += chunk.token_cost;
            
            console.log(`Finalizing chunk#${chunk_index} with ${chunk.token_cost} tokens, total cost = ${total_cost}`);
            console.log(`chunk#${chunk_index} = ${chunk.text}`);
            console.log(`----------------------------------------`);
            // prepare the next chunk with overlapping sentences
            chunk_index++;

            chunk = {
                index: chunk_index,
                text: sentence,
                first_sentence_index: sentence_index,
                token_cost: sentence_token_count,
                overlap_text: "",
                overlap_cost: "",
                id: "",
                embedding: "<not computed>",
            };

            // build the overlap
            const go_back = Math.max(0, sentence_index - overlap_size);
            for (let i = go_back; i < sentence_index; i++)
            {
                let overlap_sentence = sentences[i];
                let overlap_sentence_token_count = overlap_sentence.split(' ').length * word_to_token_ratio;
                chunk.overlap_text += overlap_sentence;
                chunk.overlap_cost += overlap_sentence_token_count;
            }
        }
    }

    // finalize the very last chunk
    chunk.id = base_name + "_" + calculate_hash(chunk.text);
    chunks_list.push(chunk);

    // calculate the total token cost
    total_cost += chunk.token_cost;
    total_words = total_cost / word_to_token_ratio;

    console.log(`Chunked the document into ${chunks_list.length} chunks with an estimated token cost of ${chunk_token_count}`);
    return [chunks_list, total_cost, total_words];
}


/*
async function compute_chunks(ctx, embedder, text, base_name, chunk_size = 3000)
{
    if (embedder == null) throw new Error("No global embeddings available");

    console_log(`Computing chunks for ${base_name} with chunk size ${chunk_size}, text length ${text.length}, chunk size ${chunk_size}`);
    const [sentence_infos, total_cost, total_words] = break_into_sentences(text, chunk_size);
    if (is_valid(sentence_infos) == false) throw new Error("No sentence infos available");

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
            // build the current chunk with this sentence
            chunk.token_cost += sentence_info.token_cost;
            chunk.text += " " + sentence_info.text;
            overlap_text = sentence_info.text;
            overlap_cost = sentence_info.token_cost;
        }
        else
        {
            // finalize the current chunk
            chunk.id = base_name + "_" + calculate_hash(chunk.text);
            const chunk_embedding = await compute_and_save_chunk_embedding(ctx, embedder, chunk);
            chunk.embedding = chunk_embedding;
            chunks_list.push(chunk);

            // prepare the next chunk
            chunk_index++;
            chunk = {
                index: chunk_index,
                text: sentence_info.text,
                first_sentence_index: sentence_info.index,
                token_cost: sentence_info.token_cost,
                overlap_text: overlap_text || "",
                overlap_cost: overlap_cost || 0,
                id: "",
                embedding: null,
            };
        }
    }

    // finalize the very last chunk
    chunk.id = base_name + "_" + calculate_hash(chunk.text);
    const last_chunk_embedding = await compute_and_save_chunk_embedding(ctx, embedder, chunk);
    chunk.embedding = last_chunk_embedding;
    chunks_list.push(chunk);

    console_log(`Chunked the document into ${chunks_list.length} chunks with an estimated token cost of ${total_cost} and ${total_words} words`);
    let return_value = [chunks_list, total_cost, total_words];
    return return_value;
}
*/
async function compute_and_cache_chunk_embedding(ctx, embedder, chunk)
{
    const chunk_text = chunk.text;
    const chunk_id = chunk.id;
    const embedding = await embedder.embedQuery(chunk_text);
    await save_embedding_to_db(ctx, embedding, chunk_id);
    return embedding;
}

async function save_embedding_to_db(ctx, embedding, embedding_id)
{
    const db = get_db(ctx);
    const success = await user_db_put(ctx, embedding, embedding_id);
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


async function user_db_delete(ctx, key, rev = undefined)
{
    const db = get_db(ctx);
    const effectiveKey = get_effective_key(ctx, key);
    console_log(`DELETING key: ${effectiveKey}`);

    let effective_rev = rev;
    if (effective_rev == undefined)
    {
        try
        {
            const get_result = await db.getDocumentById(OMNITOOL_DOCUMENT_TYPES_USERDOC, effectiveKey);
            effective_rev = get_result._rev;

            console_log(`fixing rev SUCCEEDED - deleteted rev ${effective_rev}`);

            try
            {
                await db.deleteDocumentById(OMNITOOL_DOCUMENT_TYPES_USERDOC, effectiveKey, effective_rev);
            }
            catch (e)
            {
                console.warning(`deleting ${key} = ${effectiveKey} failed with error: ${e}`);
            }
            return true;

        }
        catch (e)
        {
            console_log(`deleting: fixing rev failed`);
        }
    }

}

async function user_db_put(ctx, value, key, rev = undefined)
{
    const db = get_db(ctx);
    const effectiveKey = get_effective_key(ctx, key);

    console_log(`put: ${key} = ${effectiveKey} with rev ${rev}`);

    let effective_rev = rev;
    if (effective_rev == undefined)
    {
        try
        {
            const get_result = await db.getDocumentById(OMNITOOL_DOCUMENT_TYPES_USERDOC, effectiveKey);
            effective_rev = get_result._rev;

            console_log(`fixing rev SUCCEEDED - deleteted rev ${effective_rev}`);
        }
        catch (e)
        {
            console_log(`fixing rev failed`);
        }
    }

    try
    {
        let json = await db.putDocumentById(OMNITOOL_DOCUMENT_TYPES_USERDOC, effectiveKey, { value: value }, effective_rev);
        if (json == null) 
        {
            console_log(`put: ${key} = ${effectiveKey} failed`);
            return false;
        }
        else
        {
            console_log(`put: ${key} = ${effectiveKey} succeeded`);
        }
    }
    catch (e)
    {
        throw new Error(`put: ${key} = ${effectiveKey} failed with error: ${e}`);
    }

    return true;
}

async function user_db_get(ctx, key)
{
    const effectiveKey = get_effective_key(ctx, key);
    const db = get_db(ctx);

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
    console_log(`ingest: texts = ${texts.length}, text_ids = ${text_ids.length}, embedder = ${embedder != null}`);
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
    if (is_valid(chunks_list) == false) throw new Error(`get_texts_and_ids: chunks_list is invalid`);
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


function adjust_chunk_size(chunk_size)
{

    if (GLOBAL_ALLOW_GPT4)
    {
        const max_size = GPT4_SIZE_MAX;
        if (chunk_size > max_size) 
        {
            console.warn(`WARNING: chunk_size ${chunk_size} is too large for GPT4, adjusting to max size of ${max_size}`);
            return max_size;
        }
    }
    else
    {
        const max_size = GPT3_SIZE_MAX;
        if (chunk_size > max_size)
        {
            console.warn(`WARNING: chunk_size ${chunk_size} is too large for GPT3, adjusting to max size of ${max_size}`);
            return max_size;
        }
    }

    return chunk_size;
}

async function save_text_to_cdn(ctx, text)
{
    const buffer = Buffer.from(text);
    const cdn_response = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });
    console_log(`cdn_response = ${JSON.stringify(cdn_response)}`);

    return cdn_response;
}


async function save_json_to_cdn_as_buffer(ctx, json)
{
    const responses_string = JSON.stringify(json, null, 2).trim();
    const buffer = Buffer.from(responses_string);
    const cdn_response = await ctx.app.cdn.putTemp(buffer, { userId: ctx.userId });
    console.log(`cdn_response = ${JSON.stringify(cdn_response)}`);
    return cdn_response;
}


async function save_json_to_cdn(ctx, json)
{
    const responses_string = JSON.stringify(json, null, 2).trim();
    const buffer = Buffer.from(responses_string);
    const cdn_response = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });
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
    const chunks_json = await get_json_from_cdn(ctx, chunks_cdn);
    const chunks = chunks_json.chunks;
    if (is_valid(chunks) == false) throw new Error(`[get_chunks_from_cdn] Error getting chunks from database with cdn= ${JSON.stringify(chunks_cdn)}`);

    return chunks;
}

async function compute_vectorstore(chunks, embedder)
{
    // we recompute the vectorstore from each chunk's text each time because the load/save ability of embeddings in langchain 
    // is bound to disk operations and I find it distateful to save to temp files on the disk just to handle that.
    // However, the embedding class itself will check if the embeddings have been
    // computed already and will not recompute them - given the exact same text hash and vectorstore_name.

    console_log(`----= grab_vectorstore: all_chunks# = ${chunks.length} =----`);
    if (is_valid(chunks) == false) throw new Error(`[compute_vectorstore] Error getting chunks from database with id ${JSON.stringify(texts_cdn)}`);

    const [all_texts, all_ids] = get_texts_and_ids(chunks);
    console.log(`all_texts length = ${all_texts.length}, all_ids length = ${all_ids.length}`);
    const vectorstore = await create_vectorstore_from_texts(all_texts, all_ids, embedder);
    return vectorstore;
}

async function smartquery_from_vectorstore(ctx, vectorstore, query, nb_of_results, embedder)
{
    console_log(`----= smartquery from vectorstore =----`);
    console_log(`query = ${query}, nb_of_results = ${nb_of_results}, embedder = ${embedder != null}, vectorstore = ${vectorstore != null}`);

    if (is_valid(query) == false) throw new Error(`ERROR: query is invalid`);
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
        if (is_valid(query_answer) == false) throw new Error(`ERROR: query_answer is invalid`);
        query_answers.push(query_answer);
    }

    if (is_valid(query_answers) == false)
    {
        let error_message = `[ERROR] Error getting answers from query_vectorstore_with_llm with query = ${query}`;
        throw new Error(error_message);
    }

    return query_answers;
}


function clean_vectorstore_name(vectorstore_name)
{
    if (is_valid(vectorstore_name) == false) throw new Error(`ERROR: vectorstore_name is invalid`);
    const clean_name = vectorstore_name.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]+/g, "");
    return clean_name;
}

function compute_chunks_id(texts, vectorstore_name)
{
    // get the key so that we can pass it around
    if (is_valid(texts) == false) throw new Error(`ERROR: texts is invalid`);

    // we want the same texts but chunked differently to produce a different hash
    let sum_of_hashs = "";
    for (let i = 0; i < texts.length; i++)
    {
        sum_of_hashs += calculate_hash(texts[i]);
    }
    const chunks_id = vectorstore_name + "_" + calculate_hash(sum_of_hashs);
    console_log(`chunks_id = ${chunks_id}`);

    return chunks_id;
}


async function gather_all_texts_from_documents(ctx, documents)
{
    if (is_valid(documents) == false) throw new Error(`ERROR: documents is invalid. documents = ${JSON.stringify(documents)}`);

    let texts = [];
    for (let i = 0; i < documents.length; i++) 
    {

        const document_cdn = documents[i];
        //TBD: convert docs files to text when necessary
        const document = await ctx.app.cdn.get(document_cdn.ticket);
        const mimeType = document_cdn.mimeType || 'text/plain; charset=utf-8';
        const text = document.data.toString() || "";
        if (is_valid(text) == false) 
        {
            console_log(`WARNING: text is null or undefined or empty for document = ${JSON.stringify(document)}`);
            continue;
        }

        const clearn_text = clean_string(text);
        texts.push(clearn_text);
    }

    if (is_valid(texts) == false) throw new Error(`ERROR: texts is invalid`);

    return texts;
}

async function save_chunks_to_cdn(ctx, chunks, chunks_id, total_cost, total_words)
{
    const chunks_json = { chunks: chunks, chunks_id: chunks_id, total_cost: total_cost, total_words: total_words };
    const chunks_cdn = await save_json_to_cdn_as_buffer(ctx, chunks_json);
    if (is_valid(chunks_cdn) == false) throw new Error(`ERROR: could not save chunks_cdn to cdn`);
    return chunks_cdn;
}

async function save_chunks_cdn_to_db(ctx, chunks_cdn, chunks_id)
{
    const success = await user_db_put(ctx, chunks_cdn, chunks_id);
    if (success == false) throw new Error(`ERROR: could not save chunks_cdn to db`);
    return success;
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
        console.log(`field = ${field}, new_value = ${new_value}`);
        if (new_value !== null && new_value !== undefined && new_value !== "" && new_value !== [])
        {
            if (field in chapter_object)
            {
                const old_value = chapter_object[field];
                console.log(`old_value = ${old_value}`);
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
                                    console.log(`WARNING: cannot decide between the following chapter names: ${old_value} and ${new_value}`);
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
                    console.log("culling empty values");
                } else
                {
                    chapter_object[field] = new_value;
                }
            }
        }
    });

    console.log(`chapter_object = ${JSON.stringify(chapter_object)}`);
    chapters[chapter_key] = chapter_object;
    console.log(`Chapter ${chapterNumber}:\n${JSON.stringify(chapters[chapter_key])}`);

    return chapters;
}

// Function to process a chunk and update the chapters object
function collate_chapter_chunk(chapters, chunk, current_chapter_number, args) 
{
    const chapter_name_field = args.chapter_name_field;
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
        console.log("---------- found new chapter ----------");
        chapterNumber += 1;
        console.log(`Chapter ${chapterNumber}:`);
        const newChapter = chunk[new_chapter_field];
        chapters = parse_chapter_info(chapters, chapterNumber, newChapter, args);
    }

    console.log(`[collate chapter chunk] [INFO] chapterNumber was: ${current_chapter_number}, now: ${chapterNumber}`);
    return { chapters: chapters, chapter_number: chapterNumber };
}

function get_embedder(ctx, args)
{
    const embeddings_model = args.embeddings;
    let embedder = null;
    if (embeddings_model == "openai") embedder = new OmniOpenAIEmbeddings(ctx);
    else if (embeddings_model == "tensorflow") embedder = new TensorFlowEmbeddings();
    if (embedder == null || embedder == undefined) throw new Error(`get_embedder: Failed to initialize embeddings_model ${embeddings_model}`);
    return embedder;
}
// ---------------------------------------------------------------------------
async function load_pdf_component(ctx, payload)
{

    const documents_array = payload.documents;
    if (is_valid(documents_array) == false) throw new Error(`load_pdf_component: documents_array = ${JSON.stringify(documents_array)} is invalid`);

    const texts_cdns = [];
    for (let i = 0; i < documents_array.length; i++)
    {

        const documents_cdn = documents_array[i];

        const pdfParser = new PDFParser();
        const overwrite = payload.overwrite || true;

        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => 
        {
            console.log(pdfData);
        });

        if ("ticket" in documents_cdn == false) throw new Error(`get_json_from_cdn: documents_cdn = ${JSON.stringify(documents_cdn)} is invalid`);
        const response_from_cdn = await ctx.app.cdn.get(documents_cdn.ticket, null, 'asBase64');
        if (response_from_cdn == null) throw new Error(`get_json_from_cdn: document = ${JSON.stringify(response_from_cdn)} is invalid`);

        const str = response_from_cdn.data.toString();
        const dataBuffer = Buffer.from(str, 'base64');

        const pdfData = await parsePDF(dataBuffer);
        const extractedTextFields = extractTextFields(pdfData);
        const all_texts = extractedTextFields.join(' ');
        const cleaned_texts = clean_string(all_texts);
        const texts_id = "converted_pdf_texts_" + calculate_hash(cleaned_texts);


        let texts_cdn = null;

        if (overwrite) 
        {
            await user_db_delete(ctx, texts_id);
        }
        else
        {
            texts_cdn = await user_db_get(ctx, texts_id);
        }

        if (is_valid(texts_cdn) == false) 
        {
            console_log(`Could not find Texts CDN records for id = ${texts_id} in the DB. Saving to CDN...`);
            texts_cdn = await save_text_to_cdn(ctx, cleaned_texts);
            if (is_valid(texts_cdn) == false) throw new Error(`ERROR: could not save all_texts to cdn`);

            const success = await user_db_put(ctx, texts_cdn, texts_id);
            if (success == false) throw new Error(`ERROR: could not save texts_cdn to db`);
        }
        else
        {
            console_log(`Found Texts CDN records for id = ${texts_id} in the DB. Skipping saving to CDN...`);
        }
        texts_cdns.push(texts_cdn);
    }
    return texts_cdns;
}
// ---------------------------------------------------------------------------
async function query_chunks_component(ctx, chunks_cdn, query, args)
{
    const chunks = await get_chunks_from_cdn(ctx, chunks_cdn);
    if (is_valid(chunks) == false) throw new Error(`[component_query_chunks] Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

    const nb_of_results = args.nb_of_results;
    const embedder = get_embedder(ctx, args);
    const vectorstore = await compute_vectorstore(chunks, embedder);
    const query_answers = await smartquery_from_vectorstore(ctx, vectorstore, query, nb_of_results, embedder);
    const cdn_response = await save_json_to_cdn(ctx, query_answers);

    return cdn_response;
}
// ---------------------------------------------------------------------------
async function loop_llm_component(ctx, chunks_cdn, instruction, functions, args)
{
    const chunks = await get_chunks_from_cdn(ctx, chunks_cdn);
    if (is_valid(chunks) == false) throw new Error(`[component_loop_llm_on_chunks] Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

    const temperature = args.temperature || DEFAULT_TEMPERATURE;
    const top_p = args.top_p || DEFAULT_TOP_P;

    let chunks_results = [];
    for (let i = 0; i < chunks.length; i++)
    {
        const chunk = chunks[i];
        const chunk_result = await run_llm_on_chunk(ctx, chunk, instruction, functions, temperature, top_p);
        chunks_results.push(chunk_result);
    }


    const cdn_response = await save_json_to_cdn(ctx, chunks_results);

    return cdn_response;
}
// ---------------------------------------------------------------------------
async function collate_chapters_component(ctx, chunks_cdn, args)
{
    const chapter_name_field = args.chapter_name_field || "chapter_name";
    const current_chapter_field = args.current_chapter || "current_chapter";
    const new_chapter_field = args.new_chapter || "new_chapter";
    const overwrite = args.overwrite || false;


    console.log(`[component_collate_chapters] [INFO] chapter_name_field = ${chapter_name_field}, current_chapter_field = ${current_chapter_field}, new_chapter_field = ${new_chapter_field}, overwrite = ${overwrite}`);

    const chunks = await get_json_from_cdn(ctx, chunks_cdn);


    let chapters = {};
    let chapter_number = 1;
    let summary = "SUMMARY\n=======\n\n";
    let plot = "PLOT POINTS\n===========\n\n";

    for (let i = 0; i < chunks.length; i++)
    {
        const chunk_wrapper = chunks[i];
        const chunk = chunk_wrapper.function_arguments;
        console_log(`chunk = ${JSON.stringify(chunk)}`);

        const results = collate_chapter_chunk(chapters, chunk, chapter_number, args);
        console.log(`results = ${JSON.stringify(results)}`);

        chapters = results.chapters;
        chapter_number = results.chapter_number;
    }

    const nb_of_chapters = Object.keys(chapters).length;
    console.log(`Nb of chapters: " + ${Object.keys(chapters).length}`);
    for (let i = 0; i < nb_of_chapters; i++)
    {
        const chapter_key = `chapter_${i + 1}`;
        const chapter = chapters[chapter_key];
        if (chapter)
        {
            const chapter_name = "Chapter " + (i + 1);
            if (chapter_name_field in chapter) chapter_name += ": " + chapter[chapter_name_field];

            summary += chapter_name + "\n";
            if ("summary" in chapter) summary += chapter["summary"] + "\n\n\n"; else summary += "<no summary given>\n\n\n";

            plot += chapter_name + "\n";
            if ("plot_points" in chapter) 
            {
                const plot_point = chapter["plot_points"];

                if (typeof plot_point === "string")
                {
                    plot += plot_point + "\n";
                }
                else if (Array.isArray(plot_point))
                {
                    for (let j = 0; j < plot_point.length; j++)
                    {
                        plot += plot_point[j] + "\n";
                    }
                    plot += "\n\n";
                }
                else
                {
                    plot += "<no plot points given>\n\n\n";
                }
            }
        }
    }

    const cdn_chapters = await save_json_to_cdn(ctx, chapters);
    const cdn_summary = await save_text_to_cdn(ctx, summary);
    const cdn_plot = await save_text_to_cdn(ctx, plot);

    return { chapters: cdn_chapters, summary: cdn_summary, plot: cdn_plot };


}
// ---------------------------------------------------------------------------
async function chunk_files_component(ctx, payload)
{
    console.log(`--------------------------------`);
    console_log(`[component_chunk_files] payload = ${JSON.stringify(payload)}`);
    const documents = payload.documents;
    const overwrite = true; // looks like the boolean component is broken in the Designer // payload.overwrite || false;
    let chunk_size = payload.chunk_size || DEFAULT_CHUNK_SIZE;
    let vectorstore_name = payload.vectorstore_name || DEFAULT_VECTORSTORE_NAME;

    const texts = await gather_all_texts_from_documents(ctx, documents);
    const embedder = get_embedder(ctx, payload);

    vectorstore_name = clean_vectorstore_name(vectorstore_name);
    chunk_size = adjust_chunk_size(chunk_size);

    const chunks_id = compute_chunks_id(texts, vectorstore_name);

    let chunks_cdn = null;

    if (overwrite)
    {
        await user_db_delete(ctx, chunks_id);
    }
    else
    {
        chunks_cdn = await user_db_get(ctx, chunks_id);
    }
    if (is_valid(chunks_cdn) == false) 
    {
        console_log(`Found no Chunk CDN records for id = ${chunks_id} in the DB. Chunking now...`);

        let chunks = [];
        let total_cost = 0;
        let total_words = 0;

        for (let i = 0; i < texts.length; i++) 
        {
            let text = texts[i];
            const [chunks_list, cost, words] = await compute_chunks(ctx, embedder, text, vectorstore_name, chunk_size);
            total_cost += cost;
            total_words += words;

            if (is_valid(chunks_list) == false)
            {
                console_log(`ERROR could not chunk the document with doc_checksum = ${doc_id}`);
                continue;
            }
            chunks = chunks.concat(chunks_list);
        }

        if (is_valid(chunks) == false) 
        {
            throw new Error(`ERROR could not chunk the documents`);
        }

        chunks_cdn = await save_chunks_to_cdn(ctx, chunks, chunks_id, total_cost, total_words);
        if (is_valid(chunks_cdn) == false) throw new Error(`ERROR: could not save chunks_cdn to cdn`);
        console_log(`files__to_chunks_cdn: = ${JSON.stringify(chunks_cdn)}`);

        const success = await save_chunks_cdn_to_db(ctx, chunks_cdn, chunks_id);
        if (success == false) throw new Error(`ERROR: could not save chunks_cdn to db`);
    }
    else
    {
        console_log(`Found Chunk CDN: ${chunks_cdn} in the DB under id: ${chunks_id}. Skipping chunking...`);
    }
    console_log(`chunks_cdn = ${JSON.stringify(chunks_cdn)}`);
    return chunks_cdn;
}
// ---------------------------------------------------------------------------

export { chunk_files_component, collate_chapters_component, loop_llm_component, query_chunks_component, load_pdf_component };
