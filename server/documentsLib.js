//langchain_script.js

import { FaissStore } from "langchain/vectorstores/faiss";
import { Embeddings } from "langchain/embeddings/base";
import { encoding_for_model } from "@dqbd/tiktoken";
import MurmurHash3 from 'imurmurhash';
import PDFParser from 'pdf2json';
import "@tensorflow/tfjs-backend-cpu";
import { TensorFlowEmbeddings } from "langchain/embeddings/tensorflow";
import { TokenTextSplitter } from "langchain/text_splitter";
import
{
    SupportedTextSplitterLanguages,
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter";
import { chunk, lte, result } from "lodash-es";
import { type } from "os";

const GPT_SIZE_MARGIN = 500;
const GPT3_MODEL_SMALL = "gpt-3.5-turbo";
const GPT3_MODEL_LARGE = "gpt-3.5-turbo-16k";
const GPT3_SIZE_CUTOFF = 4096 - GPT_SIZE_MARGIN;
const GPT3_SIZE_MAX = 16384 - GPT_SIZE_MARGIN;
const DEFAULT_GPT_MODEL = GPT3_MODEL_LARGE;

const GPT4_MODEL_SMALL = "gpt-4";
const GPT4_MODEL_LARGE = "gpt-4-32k";
const GPT4_SIZE_CUTOFF = 8192 - GPT_SIZE_MARGIN;
const GPT4_SIZE_MAX = 32768 - GPT_SIZE_MARGIN;

const GPT_MODEL_TIKTOKEN_GPT3 = "gpt-3.5-turbo";
const OMNITOOL_DOCUMENT_TYPES_USERDOC = 'udoc';

const DEFAULT_VECTORSTORE_NAME = 'omnitool';
const DEFAULT_TEMPERATURE = 0.0;
const DEFAULT_TOP_P = 1.0;
let GLOBAL_OVERWRITE = false;
const VERBOSE = true;


const EMBEDINGS_ADA_2 = "text-embedding-ada-002";
const EMBEDDER_MODEL_OPENAI = "openai";
const EMBEDDER_MODEL_TENSORFLOW = "tensorflow";
const DEFAULT_EMBEDDER_MODEL = EMBEDDER_MODEL_TENSORFLOW;
const HASHER_MODEL_MURMUR3 = "MurmurHash3";
const DEFAULT_HASHER_MODEL = HASHER_MODEL_MURMUR3;
const SPLITTER_MODEL_RECURSIVE = "RecursiveCharacterTextSplitter";
const SPLITTER_MODEL_TOKEN = "TokenTextSplitter";
const SPLITTER_MODEL_CODE = "CodeSplitter_"; // see extractCodeLanguage()
const DEFAULT_SPLITTER_MODEL = SPLITTER_MODEL_RECURSIVE;
const SPLITTER_TOKEN_ENCODING = "gpt2";
const AVERAGE_CHARACTER_PER_WORD = 5;
const AVERAGE_WORD_PER_TOKEN = 0.75;
const DEFAULT_CHUNK_SIZE = 512;
const DEFAULT_CHUNK_OVERLAP = 64;

class Hasher
{
    hash(text)
    {
        throw new Error('You have to implement the method hash!');
    }
}

class Murmur3Hasher extends Hasher
{
    constructor()
    {

        super();
        this.hasher = new MurmurHash3();
    }

    hash(text)
    {
        if (typeof text === "string")
        {
            return this.hasher.hash(text).result().toString();
        }
        throw new Error('hash() only accept string as input');
    }

    hash_list(texts)
    {
        if (typeof texts === "string")
        {
            return this.hash(texts);
        }

        if (Array.isArray(texts))
        {
            let sum_of_hashs = "";
            for (let i = 0; i < texts.length; i++)
            {
                const text = texts[i];
                sum_of_hashs += this.hash(text);
            }
            return this.hash(sum_of_hashs);
        }

        throw new Error('hash_list only accept string and list of strings as input');
    }
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

function adjust_model(text_size, current_model)
{
    if (typeof text_size !== 'number')
    {
        throw new Error(`adjust_model: text_size is not a string or a number: ${text_size}, type=${typeof text_size}`);
    }

    if (current_model == GPT3_MODEL_SMALL) return current_model; 

    if (current_model == GPT3_MODEL_LARGE)
    {
        if (text_size < GPT3_SIZE_CUTOFF) return GPT3_MODEL_SMALL;  else return current_model;
    }

    if (current_model == GPT4_MODEL_SMALL) return current_model; 

    if (current_model == GPT4_MODEL_LARGE)
    {
        if (text_size < GPT4_SIZE_CUTOFF) return GPT3_MODEL_SMALL;  else return current_model;   
    }

    throw new Error(`pick_model: Unknown model: ${current_model}`);
}

class CachedEmbeddings extends Embeddings
{
    // A db-cached version of the embeddings
    // NOTE: This is a general purpose "cached embeddings" class
    // that can wrap any langchain embeddings model
    constructor(ctx, embedder, hasher, vectorstore_name = DEFAULT_VECTORSTORE_NAME)
    {
        super();
        this.embedder = embedder;

        this.ctx = ctx;
        this.db = ctx.app.services.get('db');
        this.user = ctx.user;
        this.vectorstore_name = vectorstore_name;

        this.hasher = hasher;

        if (!this.ctx)
        {
            throw new Error(`[embedQuery] Context not provided`);
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
                const embedding = await this.embedQuery(text);
                embeddings.push(embedding);
            }
        }
        return embeddings;
    }

    async embedQuery(text)
    {
        if (!is_valid(text))
        {
            throw new Error(`[embedQuery] passed text is invalid ${text}`);
        }
        console.log(`[embedQuery] Requested to embed text: ${text.slice(0, 128)}[...]`);

        const embedding_id = compute_chunk_id(this.ctx, text, this.vectorstore_name, this.hasher);
        console.log(`[embedQuery] embedding_id: ${embedding_id}`);

        let embedding = null;

        if (GLOBAL_OVERWRITE) 
        {
            await user_db_delete(this.ctx, embedding_id);
        }
        else
        {
            embedding = await user_db_get(this.ctx, embedding_id);
        }

        if (is_valid(embedding)) 
        {
            console.log(`[embedQuery]: embedding found in DB - returning it`);
            return embedding;
        }

        console_log(`[embedQuery] Not found in DB. Generating embedding for ${text.slice(0, 128)}[...]`);
        try
        {
            console.log(`[embedQuery] Using embedded: ${this.embedder}`);

            embedding = await this.embedder.embedQuery(text);
            if (!is_valid(embedding))
            {
                console.log(`[embedQuery]: [WARNING] embedding ${embedding} is invalid - returning null <---------------`);
                return null;
            }

            console.log(`[embedQuery]: computed embedding: ${embedding.slice(0, 128)}[...]`);
            const success = await user_db_put(this.ctx, embedding, embedding_id);
            if (success == false)
            {
                throw new Error(`[embedQuery] Error saving embedding for text chunk: ${text.slice(0, 128)}[...]`);
            }
            else
            {
                console_log(`[embedQuery] Saved to DB`);
            }

            return embedding;
        }
        catch (error)
        {
            throw new Error(`[embedQuery] Error generating embedding: ${error}`);
        }
    }
}

class OmniOpenAIEmbeddings extends Embeddings
{
    constructor(ctx)
    {
        super();
        this.ctx = ctx;
    }

    async embedDocuments(texts)
    {

        const embeddings = [];
        if (is_valid(texts))
        {
            for (let i = 0; i < texts.length; i += 1)
            {
                let text = texts[i];
                const embedding = await this.embedQuery(text);
                embeddings.push(embedding);
            }
        }
        return embeddings;
    }

    async embedQuery(text)
    {
        console.log(`[OmniOpenAIEmbeddings] embedQuery: Requested to embed text: ${text.slice(0, 128)}[...]`);
        if (!is_valid(text)) 
        {
            console.log(`[OmniOpenAIEmbeddings] WARNING embedQuery: passed text is invalid ${text}`);
            return null;
        }

        console_log(`[OmniOpenAIEmbeddings] generating embedding for ${text.slice(0, 128)}`);
        try
        {
            const response = await this.compute_embedding_via_runblock(this.ctx, text);
            console.log(`[OmniOpenAIEmbeddings] embedQuery: response: ${JSON.stringify(response)}`);
            const embedding = response;
            return embedding;
        } catch (error)
        {
            console.log(`[OmniOpenAIEmbeddings] WARNING embedQuery: Error generating embedding via runBlock for ctx=${this.ctx} and text=${text}\nError: ${error}`);
            return null;
        }
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
            let error_message = `[OmniOpenAIEmbeddings] Error running openai.embeddings: ${err.message}`;
            console.error(error_message);
            throw err;
        }

        if (response == null) { throw new Error(`[OmniOpenAIEmbeddings embedding runBlock response is null`); };

        if (response.error)
        {
            throw new Error(`[OmniOpenAIEmbeddings] embedding runBlock response.error: ${response.error}`);
        }

        let data = response?.data || null;
        if (is_valid(data) == false) { throw new Error(`[OmniOpenAIEmbeddings] embedding runBlock response is invalid: ${JSON.stringify(response)}`); };

        const embedding = response?.data[0]?.embedding || null;
        return embedding;
    }
}

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


function sanitizeString(original, use_escape_character = false)
{
    return use_escape_character
        ? original.replace(/'/g, "\\'").replace(/"/g, '\\"')
        : original.replace(/'/g, "‘").replace(/"/g, '“');
}


function sanitizeJSON(jsonData)
{
    
    if (!is_valid(jsonData)) return null;

    if (typeof jsonData === 'string')
    {
        return sanitizeString(jsonData);
    }

    if (typeof jsonData === 'object')
    {
        if (Array.isArray(jsonData))
        {
            const new_json_array = [];
            for (let i=0; i<jsonData.length; i++)
            {
                const data = jsonData[i];
                const sanetized_data = sanitizeJSON(data);
                if (is_valid(sanetized_data)) new_json_array.push(sanetized_data);
            }
            return new_json_array;
        }
        else
        {
            let new_json = {};
            for (const key in jsonData) 
            {
                if (jsonData.hasOwnProperty(key)) 
                {
                    const value = jsonData[key];
                    if (is_valid(value))
                    {
                        const new_value = sanitizeJSON(value);
                        if (is_valid(new_value)) new_json[key] = new_value;
                    }
                }
            }
            return new_json;
        }
    }

    return jsonData;
}

function get_model_max_size(model)
{
    if (model == GPT3_MODEL_SMALL) return GPT3_SIZE_CUTOFF;
    if (model == GPT3_MODEL_LARGE) return GPT3_SIZE_MAX;
    if (model == GPT4_MODEL_SMALL) return GPT4_SIZE_CUTOFF;
    if (model == GPT4_MODEL_LARGE) return GPT4_SIZE_MAX;

    throw new Error(`get_model_max_size: Unknown model: ${model}`);

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
    const model = args.model;

    const prompt_cost = count_tokens_in_text(prompt);
    const instruction_cost = count_tokens_in_text(instruction);
    const cost = prompt_cost + instruction_cost;

    args.model = adjust_model(cost, model);

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
    if (typeof passed_string !== 'string')
    {
        throw new Error(`[FIXING] fix_json_string: passed string is not a string: ${passed_string}, type = ${typeof passed_string}`);
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

async function query_advanced_chatgpt(ctx, prompt, instruction, llm_functions = [], temperature = 0, top_p = 1, model = GPT3_MODEL_SMALL)
{

    let args = {};
    args.user = ctx.user.id;
    args.prompt = prompt;
    args.instruction = instruction;
    args.temperature = temperature;
    args.top_p = top_p;
    args.model = model;
    args.functions = llm_functions;

    console.log(`[query_advanced_chatgpt] args: ${JSON.stringify(args)}`);

    const response = await runChatGPTBlock(ctx, args);
    if (response.error) throw new Error(response.error);

    const total_tokens = response?.usage?.total_tokens || 0;
    let text = response?.answer_text || "";
    const function_arguments_string = response?.function_arguments_string || "";
    let function_arguments = null;

    if (is_valid(function_arguments_string) == true) function_arguments = await fix_json_string(ctx, function_arguments_string);
    if (is_valid(text) == true) text = clean_string(text);

    const return_value = {
        text: text,
        function_arguments_string: function_arguments_string,
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

function compute_chunk_id(ctx, text, vectorstore_name, hasher)
{
    const user = ctx.userId;
    const hash = hasher.hash(text);
    const chunk_id = `chunk_${vectorstore_name}_${user}_${hash}`;
    return chunk_id;
}

async function get_cached_cdn(ctx, object_id, overwrite = false)
{
    let cdn = null;
    if (overwrite)
    {
        await user_db_delete(ctx, object_id);
    }
    else
    {
        cdn = await user_db_get(ctx, object_id);
    }
    console.log(`[get_cached_cdn] cdn = ${JSON.stringify(cdn)}, typeof cdn = ${typeof cdn}`);

    return cdn;
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


function get_texts_and_ids(chunks)
{
    if (is_valid(chunks) == false) throw new Error(`get_texts_and_ids: chunks_list is invalid`);
    let chunk_texts = [];
    let chunk_ids = [];
    for (let i = 0; i < chunks.length; i++)
    {
        const chunk = chunks[i];

        const chunk_text = chunk.text;
        const chunk_id = chunk.id;

        chunk_ids.push({ id: chunk_id });
        chunk_texts.push(chunk_text);

    }
    return [chunk_texts, chunk_ids];
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


async function smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model)
{
    console_log(`[smartquery_from_vectorstore] query = ${query}, embedder = ${embedder != null}, vectorstore = ${vectorstore != null}`);

    if (is_valid(query) == false) throw new Error(`ERROR: query is invalid`);
    let vectorstore_responses = await query_vectorstore(vectorstore, query, 10, embedder);
    // TBD we should have a better way of deciding how many results to return, also  we should check for a minimum score

    let total_tokens = 0;

    let max_size = get_model_max_size(model);
    
    const instruction = `Please review the snippets of texts and see if you can find answers to the following question in them: ${query}.\nHowever, do not say 'Based solely on the document,' or anything like that. Instead, just answer the question giving as much details as possible, quoting the source if is is useful. Thanks!`;

    let combined_text = "";
    for (let i = 0; i < vectorstore_responses.length; i++) 
    {
        const vectorestore_response_array = vectorstore_responses[i];
        const [vectorstore_response, score] = vectorestore_response_array;

        console.log(`vectorstore_responses[${i}] score = ${score}`);

        const raw_text = vectorstore_response?.pageContent;
        const text = `[...] ${raw_text} [...]\n\n`;
        const token_cost = count_tokens_in_text(text);
        const metadata = vectorstore_response?.metadata; // TBD: contains reference to the chunk that was matched. We could read the token_cost from there
        console.log(`vectorstore_responses[${i}] metadata = ${JSON.stringify(metadata)}`);

        if (total_tokens + token_cost > max_size) break;
        total_tokens += token_cost;
        combined_text += text;
    }

    const query_answer_json = await query_advanced_chatgpt(ctx, combined_text, instruction, [], 0, 1, model);
    const query_answer = query_answer_json?.text || null;
    if (is_valid(query_answer) == false) throw new Error(`ERROR: query_answer is invalid`);

    return query_answer;
}


function clean_vectorstore_name(vectorstore_name)
{
    if (is_valid(vectorstore_name) == false) throw new Error(`ERROR: vectorstore_name is invalid`);
    const clean_name = vectorstore_name.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]+/g, "");
    return clean_name;
}

function compute_document_id(ctx, texts, vectorstore_name, hasher)
{
    // get the key so that we can pass it around
    if (is_valid(texts) == false) throw new Error(`ERROR: texts is invalid`);

    const user = ctx.userId;
    const document_hash = hasher.hash_list(texts);
    const document_id = `doc_${vectorstore_name}_${user}_${document_hash}`;

    return document_id;
}


// return an array of texts gathered from all the documents (1 per document)
async function gather_all_texts_from_documents(ctx, documents)
{
    if (is_valid(documents) == false) throw new Error(`ERROR: documents is invalid. documents = ${JSON.stringify(documents)}`);

    let texts = [];
    for (let i = 0; i < documents.length; i++) 
    {

        const document_cdn = documents[i];
        //TBD: convert docs files to text when necessary
        try
        {
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
        catch (error)
        {
            console_log(`WARNING: document ${JSON.stringify(document_cdn)} cannot be retrieved from cdn`);
        }
    }

    if (is_valid(texts) == false) throw new Error(`ERROR: texts is invalid`);

    return texts;
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

function initialize_embedder(ctx, embedder_model = DEFAULT_EMBEDDER_MODEL, hasher, vectorstore_name = DEFAULT_VECTORSTORE_NAME)
{

    let embedder = null;
    if (embedder_model == EMBEDDER_MODEL_OPENAI)
    {
        console.log("Using embedder: EMBEDDER_MODEL_OPENAI <------------------");
        const raw_embedder = new OmniOpenAIEmbeddings(ctx);
        embedder = new CachedEmbeddings(ctx, raw_embedder, hasher, vectorstore_name);
    }
    else if (embedder_model == EMBEDDER_MODEL_TENSORFLOW) 
    {
        console.log("Using embedder: EMBEDDER_MODEL_TENSORFLOW <------------------");
        const raw_embedder = new TensorFlowEmbeddings();
        embedder = new CachedEmbeddings(ctx, raw_embedder, hasher, vectorstore_name);
    }

    // TBD: more embeddings here

    if (embedder == null || embedder == undefined) throw new Error(`get_embedder: Failed to initialize embeddings_model ${embedder_model}`);
    return embedder;
}

function initialize_hasher(hasher_model = DEFAULT_HASHER_MODEL)
{

    let hasher = null;
    if (hasher_model == HASHER_MODEL_MURMUR3) hasher = new Murmur3Hasher();
    else  
    {
        throw new Error(`initialize_hasher: Unknown hasher model: ${hasher_model}`);
    }
    // TBD: more hasher choices here

    if (!is_valid(hasher)) throw new Error(`get_hasher: Failed to initialize hasher_model ${hasher_model}`);
    return hasher;
}

function extractCodeLanguage(str)
{
    const pattern = new RegExp('^' + SPLITTER_MODEL_CODE + '(\\w+)$', 'i');
    const match = str.match(pattern);

    if (match)
    {
        const language = match[1].toLowerCase();
        const validLanguages = SupportedTextSplitterLanguages;
        /*
        [
            'cpp', 'go', 'java', 'js', 'php', 'proto',
            'python', 'rst', 'ruby', 'rust', 'scala',
            'swift', 'markdown', 'latex', 'html'
        ];
        */
        if (validLanguages.includes(language))
        {
            return language;
        }
    }

    return null;
}


function initialize_splitter(splitter_model = DEFAULT_SPLITTER_MODEL, chunk_size = DEFAULT_CHUNK_SIZE, chunk_overlap = DEFAULT_CHUNK_OVERLAP)
{

    let splitter = null;
    if (splitter_model == SPLITTER_MODEL_RECURSIVE) 
    {
        splitter = new RecursiveCharacterTextSplitter({
            chunkSize: chunk_size, // in characters!
            chunkOverlap: chunk_overlap, // in characters!
        });
    }
    else if (splitter_model == SPLITTER_MODEL_TOKEN) 
    {
        splitter = new TokenTextSplitter({
            encodingName: SPLITTER_TOKEN_ENCODING,
            chunkSize: chunk_size, // in tokens!
            chunkOverlap: chunk_overlap, // in tokens!
        });
    }
    else
    {
        // SPLITTER_CODE
        const code_language = extractCodeLanguage(splitter_model);
        if (code_language)
        {
            splitter = RecursiveCharacterTextSplitter.fromLanguage(code_language, {
                chunkSize: chunk_size, // in characters!
                chunkOverlap: chunk_overlap, // in characters!
            });
        }
    }
    // TBD: more splitters here

    if (splitter == null || splitter == undefined) throw new Error(`initialize_splitter: Failed to initialize splitter_model ${splitter_model}`);
    return splitter;
}


function parse_text_to_array(candidate_text)
{
    var texts = [];
    if (is_valid(candidate_text) == false) return texts;
    try
    {
        const parsedArray = JSON.parse(candidate_text);
        if (Array.isArray(parsedArray) && parsedArray.every(elem => typeof elem === 'string'))
        {
            texts = parsedArray;
        }
    }
    catch (error)
    {
        texts = [candidate_text];
    }

    console.log(`parse_text_to_array: texts = ${JSON.stringify(texts)}`);
    if (texts.length == 0) return null;
    if (texts.length == 1 && texts[0] == "") return [];

    return texts;
}


// ---------------------------------------------------------------------------
async function load_pdf_component(ctx, documents, overwrite = false)
{

    console.time("load_pdf_component_processTime");
    if (is_valid(documents) == false) throw new Error(`load_pdf_component: documents_array = ${JSON.stringify(documents)} is invalid`);

    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => 
    {
        console.log(pdfData);
    });

    GLOBAL_OVERWRITE = overwrite;

    const texts_cdns = [];
    for (let i = 0; i < documents.length; i++)
    {
        const documents_cdn = documents[i];
        if ("ticket" in documents_cdn == false) throw new Error(`get_json_from_cdn: documents_cdn = ${JSON.stringify(documents_cdn)} is invalid`);

        const response_from_cdn = await ctx.app.cdn.get(documents_cdn.ticket, null, 'asBase64');
        if (response_from_cdn == null) throw new Error(`get_json_from_cdn: document = ${JSON.stringify(response_from_cdn)} is invalid`);

        const str = response_from_cdn.data.toString();
        const dataBuffer = Buffer.from(str, 'base64');

        const pdfData = await parsePDF(dataBuffer);
        const extractedTextFields = extractTextFields(pdfData);
        const all_texts = extractedTextFields.join(' ');
        const cleaned_texts = clean_string(all_texts);

        const hasher = initialize_hasher(DEFAULT_HASHER_MODEL);
        const texts_id = "converted_pdf_texts_" + ctx.userId + "_" + hasher.hash(cleaned_texts);

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

    console.timeEnd("load_pdf_component_processTime");
    return texts_cdns;
}


// ---------------------------------------------------------------------------
async function query_chunks_component(ctx, document_cdns, query, model, concat = true)
{
    console.time("query_chunks_component_processTime");
    let combined_answer = "";
    for (let i = 0; i < document_cdns.length; i++)
    {
        const document_cdn = document_cdns[i];
        const document_json = await get_json_from_cdn(ctx, document_cdn);
        if (is_valid(document_json) == false) throw new Error(`[component_query_chunks] Error getting chunks from database with id ${JSON.stringify(document_cdn)}`);

        const vectorstore_name = document_json.vectorstore_name;
        const hasher_model = document_json.hasher_model;
        const embedder_model = document_json.embedder_model;
        const chunks = document_json.chunks;
        if (is_valid(chunks) == false) throw new Error(`[query_chunks_component] Error getting chunks from document_json: ${JSON.stringify(document_json)}`);

        console_log(`[query_chunks_component] Read from the document:\nchunks #= ${chunks}, vectorstore_name = ${vectorstore_name}, hasher_model = ${hasher_model}, embedder_model = ${embedder_model}`);

        const hasher = initialize_hasher(hasher_model);
        const embedder = initialize_embedder(ctx, embedder_model, hasher, vectorstore_name);

        const vectorstore = await compute_vectorstore(chunks, embedder);
        const query_result = await smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model);
        combined_answer += query_result + "\n\n";
    }

    const results_cdn = await save_json_to_cdn(ctx, { answer: combined_answer });
    const response = { cdn: results_cdn, answer: combined_answer };
    console.timeEnd("query_chunks_component_processTime");
    return response;
}

// ---------------------------------------------------------------------------
function combineStringsWithoutOverlap(str1, str2)
{
    // Find the maximum possible overlap between the two strings
    let overlap = 0;
    for (let i = 1; i <= Math.min(str1.length, str2.length); i++)
    {
        if (str1.endsWith(str2.substring(0, i)))
        {
            overlap = i;
        }
    }

    // Combine the strings and remove the overlapping portion from the second string
    return str1 + str2.substring(overlap);
}
// ---------------------------------------------------------------------------
async function loop_llm_component(ctx, chapters_cdns, instruction, llm_functions = [], llm_model=DEFAULT_GPT_MODEL, temperature = 0, top_p = 1, chunk_size = 2000)
{
    console.log(`[loop_llm_component] type of llm_functions = ${typeof llm_functions}, llm_functions = ${JSON.stringify(llm_functions)}<------------------`);

    let maximize_chunks = false;
    let max_size = chunk_size;

    if (chunk_size == -1) 
    {
        maximize_chunks = true;
        max_size = get_model_max_size(llm_model);
    }
    else if (chunk_size > 0)
    {
        maximize_chunks = true;
        max_size = Math.min(chunk_size, get_model_max_size(llm_model));
    }
    console.time("loop_llm_component_processTime");

    const chunks_results = [];
    console.log(`Processing ${chapters_cdns.length} chapter(s)`)
    for (let chapter_index = 0; chapter_index < chapters_cdns.length; chapter_index++)
    {
        const chunks_cdn = chapters_cdns[chapter_index];
        const chunks = await get_chunks_from_cdn(ctx, chunks_cdn);
        if (is_valid(chunks) == false) throw new Error(`[component_loop_llm_on_chunks] Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

        let count = 0;
        let total_token_cost = 0;
        let combined_text = "";

        console.log(`Processing chapter #${chapter_index} with ${chunks.length} chunk(s)`)
        for (let chunk_index = 0; chunk_index < chunks.length; chunk_index++)
        {
            //concatenate chunks into something that fits in the max size of the model. Although don't concatenate across chapters.
            const chunk = chunks[chunk_index];

            if (is_valid(chunk) && is_valid(chunk.text))
            {

                const text = chunk.text;
                const token_cost = count_tokens_in_text(text);
                if (maximize_chunks)
                {
                    console.log(`total_token_cost = ${total_token_cost} + token_cost = ${token_cost} <? max_size = ${max_size}`);

                    const can_fit = (total_token_cost + token_cost <= max_size);
                    const is_last_index = (chunk_index == chunks.length - 1);

                    if (can_fit)
                    {
                        combined_text = combineStringsWithoutOverlap(combined_text, text);
                        total_token_cost += token_cost; // TBD: this is not accurate because we are not counting the tokens in the overlap or the instructions

                    }
                    if (!can_fit || is_last_index)
                    {
                        const model = adjust_model(total_token_cost, llm_model);
                        const gpt_results = await query_advanced_chatgpt(ctx, combined_text, instruction, llm_functions, temperature, top_p, model);
                        const sanetized_results = sanitizeJSON(gpt_results);

                        console.log('sanetized_results = ' + JSON.stringify(sanetized_results, null, 2) + '\n\n');
                        chunks_results.push(sanetized_results);

                        //reset the combined text and token cost
                        combined_text = text;
                        total_token_cost = token_cost;
                    }
                }
                else
                {
                    const model = adjust_model(token_cost, llm_model);
                    const gpt_results = await query_advanced_chatgpt(ctx, text, instruction, llm_functions, temperature, top_p, model);
                    const sanetized_results = sanitizeJSON(gpt_results);
                    console.log('sanetized_results = ' + JSON.stringify(sanetized_results, null, 2) + '\n\n');

                    chunks_results.push(sanetized_results);
                }
            }
            else
            {
                console.log(`[WARNING][loop_llm_component]: chunk is invalid or chunk.text is invalid. chunk = ${JSON.stringify(chunk)}`);
            }
        }


    }

    let combined_answer = "";
    let combined_function_argumnets = [];
    console.log(`chunks_results.length = ${chunks_results.length}`);
    for (let i = 0; i < chunks_results.length; i++)
    {
        const chunk_result = chunks_results[i];
        console.log(`chunk_result = ${JSON.stringify(chunk_result)}`);

        const result_text = chunk_result.text || "";
        const function_string = chunk_result.function_arguments_string || "";
        const function_arguments = chunk_result.function_arguments || [];

        combined_answer += result_text + function_string + "\n\n";
        console.log(`[$[i}] combined_answer = ${combined_answer}`)
        combined_function_argumnets = combined_function_argumnets.concat(function_arguments);
    }

    const results_cdn = await save_json_to_cdn(ctx, chunks_results);
    const response = { cdn: results_cdn, answer: combined_answer, function_arguments: combined_function_argumnets };
    console.timeEnd("loop_llm_component_processTime");
    return response;
}
// ---------------------------------------------------------------------------
async function collate_chapters_component(ctx, chunks_cdn, args)
{
    console.time("processTime");

    const chapter_name_field = args.chapter_name_field || "chapter_name";
    const current_chapter_field = args.current_chapter || "current_chapter";
    const new_chapter_field = args.new_chapter || "new_chapter";
    const overwrite = args.overwrite || false;
    GLOBAL_OVERWRITE = overwrite;


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

    console.timeEnd("processTime");
    return { chapters: cdn_chapters, summary: cdn_summary, plot: cdn_plot };

}


function rebuildToTicketObjectsIfNeeded(data) 
{
    const documents = [];

    // Check if the data is an array of tickets

    if (Array.isArray(data) && data.every(item => typeof item === 'object' && item !== null && item.ticket))
    {
        return data; // Already in the ticket format, return as is.
    }

    // Check if the data is an array of URLs pointing to fids
    if (Array.isArray(data) && data.every(item => typeof item === 'string'))
    {
        // Rebuild URLs into ticket objects

        for (let i = 0; i < data.length; i++)
        {
            const url = data[i];
            const fidRegex = /\/fid\/(.+)/; // Regular expression to extract the fid part after "/fid/"
            const match = url.match(fidRegex);

            if (match)
            {
                const baseurl = url.substring(0, match.index); // Extract the base URL before "/fid/"
                const fid = match[1]; // Extract the fid part from the regex match
                const filename = `${fid}.txt`;

                const rebuilt_cdn = {
                    ticket: {
                        fid: fid,
                        count: 1,
                        url: baseurl,
                        publicUrl: baseurl,
                    },
                    fileName: filename,
                    size: 0,
                    url: url,
                    furl: `fid://${filename}`,
                    mimeType: "text/plain; charset=utf-8",
                    expires: 0,
                    meta:
                    {
                        created: 0
                    }
                };
                // we recerate a cdn object, knowing that most likely only the ticket will be used
                documents.push(rebuilt_cdn);
                console.log(`rebuild url = ${url} into rebuilt_cdn = ${JSON.stringify(rebuilt_cdn)}`);

            }
        }
    }

    console.timeEnd("processTime");
    return documents;
}

// ---------------------------------------------------------------------------
async function read_text_file_component(ctx, url, text = "")
{
    console.log(`[read_text_file_component] url = ${url}, text = ${text}`);
    console.time("read_text_file_component_processTime");

    const documents = [];
    console.log(`--------------------------------`);

    const urls = parse_text_to_array(url);
    console.log(`[read_text_file_component] urls #  ${urls.length}`);

    const cdn_tickets_from_urls = rebuildToTicketObjectsIfNeeded(urls);
    console.log(`[read_text_file_component] cdn_tickets_from_urls #  ${cdn_tickets_from_urls.length}`);

    for (let i = 0; i < cdn_tickets_from_urls.length; i++) 
    {
        const cdn_ticket = cdn_tickets_from_urls[i];
        documents.push(cdn_ticket);
    }

    if (text != "")
    {
        const texts = parse_text_to_array(text);
        console.log(`[read_text_file_component] texts #  ${texts.length}`);

        for (let i = 0; i < texts.length; i++) 
        {
            const individual_text = texts[i];
            const buffer = Buffer.from(individual_text);
            const document_cdn = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });

            documents.push(document_cdn);
        }
    }

    if (is_valid(documents) == false) throw new Error(`ERROR: could not convert to documents`);
    console.log(`[read_text_file_component] documents # = ${documents.length}`);
    console.log(`[read_text_file_component] documents = ${JSON.stringify(documents)}`);

    console.timeEnd("read_text_file_component_processTime");
    return documents;
}
// ---------------------------------------------------------------------------
async function advanced_llm_component(ctx, instruction, prompt, llm_functions = [], llm_model = DEFAULT_GPT_MODEL, temperature = 0, top_p = 1)  
{
    console.time("processTime");

    console.log(`--------------------------------`);
    const instructions = parse_text_to_array(instruction);
    const prompts = parse_text_to_array(prompt);
    const max_size = get_model_max_size(llm_model);

    console.log('[advanced_llm_component] llm_functions = ' + JSON.stringify(llm_functions));

    let actual_token_cost = 0;
    const answers = {};
    let answer_string = "";
    for (let i = 0; i < instructions.length; i++)
    {
        const instruction = instructions[i];
        for (let p = 0; p < prompts.length; p++)
        {
            let id = "answer";
            if (instructions.length > 1) id += `_i${i + 1}`;
            if (prompts.length > 1) id += `_p${p + 1}`;

            const prompt = prompts[p];

            console_log(`instruction = ${instruction}, prompt = ${prompt}, id = ${id}`);

            const token_cost = count_tokens_in_text(prompt);
            let model = adjust_model(token_cost, llm_model);

            if (token_cost > GPT4_SIZE_MAX) { console.log('WARNING: token cost > GPT4_SIZE_MAX'); }
            const answer_object = await query_advanced_chatgpt(ctx, prompt, instruction, llm_functions, temperature, top_p, model);
            if (is_valid(answer_object) == false) continue;

            const answer_text = answer_object.text;
            const answer_fa = answer_object.function_arguments;
            const answer_fa_string = answer_object.function_arguments_string;

            if (is_valid(answer_text))
            {
                answers[id] = answer_text;
                answer_string += answer_text + "\n";
            }
            else
            {
                answers[id] = answer_fa;
                answer_string += answer_fa_string + "\n";
            }
            actual_token_cost += answer_object.total_tokens;
        }
    }
    answers["text"] = answer_string;


    const cdn_response = await save_json_to_cdn(ctx, answers);
    answers["document"] = cdn_response;
    answers["url"] = cdn_response.url;


    console.timeEnd("processTime");
    return answers;
}

// ---------------------------------------------------------------------------
async function process_chapter(ctx, chapter_text, vectorstore_name, hasher, embedder, splitter, document_id, overwrite, hasher_model, embedder_model, splitter_model)
{
    let document_cdn = await get_cached_cdn(ctx, document_id, overwrite);
    let document_json = null;
    if (is_valid(document_cdn))
    {
        console.log(`[process_chapter] Found document_cdn: ${JSON.stringify(document_cdn)} in the DB under id: ${document_id}. Skipping chunking...`);
        try
        {
            document_json = await get_json_from_cdn(ctx, document_cdn);
        }
        catch (error)
        {
            console.log(`[process_chapter] WARNING: could not get document_json from cdn`);
            document_cdn = null;
        }
    }

    if (!is_valid(document_cdn))
    {
        console.log(`[process_chapter] Found no records for document id = ${document_id} in the DB. Chunking now...`);

        const chunker_results = await break_chapter_into_chunks(ctx, chapter_text, vectorstore_name, hasher, embedder, splitter);
        const chapter_chunks = chunker_results.chunks;

        document_json = { id: document_id, hasher_model: hasher_model, embedder_model: embedder_model, splitter_model: splitter_model, vectorstore_name: vectorstore_name, chunks: chapter_chunks, chapters: [chapter_text] };
        document_cdn = await save_json_to_cdn_as_buffer(ctx, document_json);

        if (is_valid(document_cdn) == false) throw new Error(`ERROR: could not save document_cdn to cdn`);
        console.log(`[process_chapter] document_cdn: = ${JSON.stringify(document_cdn)}`);

        const success = await save_chunks_cdn_to_db(ctx, document_cdn, document_id);
        if (success == false) throw new Error(`ERROR: could not save document_cdn to db`);
    }

    console.timeEnd("processTime");
    return { cdn: document_cdn, json: document_json };
}

async function break_chapter_into_chunks(ctx, text, vectorstore_name, hasher, embedder, splitter)
{

    const chunks = [];
    const splitted_texts = await splitter.splitText(text);

    let total_nb_of_chars = 0;
    console.log(`[break_chapter_into_chunks] splitted texts # = ${splitted_texts.length}`);

    for (let splitted_index = 0; splitted_index < splitted_texts.length; splitted_index++)
    {
        const nb_of_chars = splitted_texts[splitted_index].length;
        if (nb_of_chars > 0)
        {
            console.log(`[break_chapter_into_chunks] splitted text nb of chars = ${nb_of_chars}`);
            total_nb_of_chars += nb_of_chars;

            const chunk_text = splitted_texts[splitted_index];
            console.log(`[break_chapter_into_chunks] [${splitted_index}] splitted text (first 1024)= ${chunk_text.slice(0, 1024)}`);
            const chunk_id = compute_chunk_id(ctx, chunk_text, vectorstore_name, hasher);
            const chunk_embedding = await embedder.embedQuery(chunk_text);
            const chunk_token_count = count_tokens_in_text(chunk_text);
            const chunk_json = { text: chunk_text, id: chunk_id, token_count: chunk_token_count, embedding: chunk_embedding };
            chunks.push(chunk_json);
        }
    }
    const average_nb_of_chars = total_nb_of_chars / splitted_texts.length;
    console.log(`[break_chapter_into_chunks] average_nb_of_chars = ${average_nb_of_chars}`);

    if (is_valid(chunks) == false) 
    {
        throw new Error(`ERROR could not chunk the documents`);
    }

    console.timeEnd("processTime");
    return { chunks: chunks, nb_of_chunks: splitted_texts.length, total_nb_of_chars: total_nb_of_chars, average_nb_of_chars: average_nb_of_chars };
}
async function chunk_files_component(ctx, documents, overwrite = false, vectorstore_name = DEFAULT_VECTORSTORE_NAME, collate = true, embedder_model = DEFAULT_EMBEDDER_MODEL, splitter_model = DEFAULT_SPLITTER_MODEL, chunk_size = DEFAULT_CHUNK_SIZE, chunk_overlap = DEFAULT_CHUNK_OVERLAP)
{
    console.log(`--------------------------------`);
    console.time("processTime");

    vectorstore_name = clean_vectorstore_name(vectorstore_name);
    const hasher_model = DEFAULT_HASHER_MODEL;
    const hasher = initialize_hasher(hasher_model);
    const splitter = initialize_splitter(splitter_model, chunk_size, chunk_overlap);
    const embedder = initialize_embedder(ctx, embedder_model, hasher, vectorstore_name);

    console.log(`[chunk_files_component] splitter_model = ${splitter_model}, embedder_model = ${embedder_model}`);


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
        const document_id = compute_document_id(ctx, [text], vectorstore_name, hasher);
        let response = await process_chapter(ctx, text, vectorstore_name, hasher, embedder, splitter, document_id, overwrite, hasher_model, embedder_model, splitter_model);

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
        console.log(`collating #${chapters.length} chapters. # of chunks = ${all_chunks.length}`);
        const collated_document_id = compute_document_id(ctx, [all_texts], vectorstore_name, hasher);
        const collated_json = { id: collated_document_id, hasher_model: hasher_model, embedder_model: embedder_model, splitter_model: splitter_model, vectorstore_name: vectorstore_name, chunks: all_chunks, chapters: chapters };
        const collated_document_cdn = await save_json_to_cdn_as_buffer(ctx, collated_json);
        cdns = [collated_document_cdn];
    }

    console.timeEnd("processTime");
    return cdns;
}



export { advanced_llm_component, read_text_file_component, chunk_files_component, collate_chapters_component, loop_llm_component, query_chunks_component, load_pdf_component };
