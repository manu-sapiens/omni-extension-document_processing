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
import { chunk, lte } from "lodash-es";

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
const OMNITOOL_DOCUMENT_TYPES_USERDOC = 'udoc';

const DEFAULT_VECTORSTORE_NAME = 'omnitool';
const DEFAULT_TEMPERATURE = 0.0;
const DEFAULT_TOP_P = 1.0;

let GLOBAL_ALLOW_GPT3 = true;
let GLOBAL_ALLOW_GPT4 = false;
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
const DEFAULT_CHUNK_SIZE_IN_TOKENS = 512;
const DEFAULT_CHUNK_OVERLAP_IN_TOKENS = 64;

let global_ctx = null;
let global_user = null;
let global_db = null;
let global_allow_gpt3 = null;
let global_allow_gpt4 = null;
let global_verbose = null;
let global_embedder_model = null;
let global_hasher_model = null;
let global_splitter_model = null;
let global_vectorstore_name = null;
let global_overwrite = null;


function setGlobalVariables(ctx, payload) 
{
    global_ctx = ctx;
    global_user = ctx.userId;
    global_db = ctx.app.db;

    global_allow_gpt3 = payload.allow_gpt3 || true;
    global_allow_gpt4 = payload.allow_gpt4 || false;
    global_verbose = payload.verbose || false;
    global_embedder_model = payload.embedder_model || DEFAULT_EMBEDDER_MODEL;
    global_hasher_model = payload.hasher_model || DEFAULT_HASHER_MODEL;
    global_splitter_model = payload.splitter_model || DEFAULT_SPLITTER_MODEL;
    global_vectorstore_name = payload.vectorstore_name || DEFAULT_VECTORSTORE_NAME;
    global_overwrite = payload.overwrite || false;
}


class OmniChunk
{
    constructor(chunkData)
    {
        this._chunk_text = chunkData.chunk_text || '';
        this._chunk_hash = chunkData.chunk_hash || '';
        this._chunk_embedding = chunkData.embedding || null;

        /*this._summary = chunkData.summary || null;
        this._entities = chunkData.entities || null;
        this._start_word_index = chunkData.start_word_index || 0;
        this._end_word_index = chunkData.end_word_index || 0;
        this._chunk_index = chunkData.chunk_index || 0;
        this._words_count = chunkData.words_count || 0;
        this._tokens_count = chunkData.tokens_count || -1;*/
    }

    // Getters
    get chunk_text() { return this._chunk_text; }
    get chunk_id() { return this._chunk_hash; }
    get chuck_embedding() { return this._chunk_embedding; }

    /*get summary() { return this._summary; }
    get entities() { return this._entities; }
    get start_word_index() { return this._start_word_index; }
    get end_word_index() { return this._end_word_index; }
    get chunk_index() { return this._chunk_index; }
    get words_count() { return this._words_count; }
    get tokens_count() { return this._tokens_count; }*/

    // Setters
    set chunk_text(value) { this._chunk_text = value; }
    set chunk_id(value) { this._chunk_hash = value; }
    set chuck_embedding(value) { this._chunk_embedding = value; }

    /*set summary(value) { this._summary = value; }
    set entities(value) { this._entities = value; }
    set start_word_index(value) { this._start_word_index = value; }
    set end_word_index(value) { this._end_word_index = value; }
    set chunk_index(value) { this._chunk_index = value; }
    set words_count(value) { this._words_count = value; }
    set tokens_count(value) { this._tokens_count = value; }*/
}

class OmniDocument
{
    constructor(docData)
    {
        this._texts = docData.texts || [];
        this._id = docData.hash || '';
        this._hasher = docData.hasher || '';
        this._splitter = docData.splitter || '';
        this._embedder = docData.embedder || '';
        this._chunker = docData.chunker || '';
        this._overlap = docData.overlap || 0;
        this._chunks = (docData.chunks || []).map(chunk => new OmniChunk(chunk));
    }

    // Getters
    get texts() { return this._texts; }
    get id() { return this._id; }
    get hasher() { return this._hasher; }
    get splitter() { return this._splitter; }
    get embedder() { return this._embedder; }
    get chunker() { return this._chunker; }
    get overlap() { return this._overlap; }
    get chunks() { return this._chunks; }

    // Setters
    set texts(value) { this._texts = value; }
    set id(value) { this._id = value; }
    set hasher(value) { this._hasher = value; }
    set splitter(value) { this._splitter = value; }
    set embedder(value) { this._embedder = value; }
    set chunker(value) { this._chunker = value; }
    set overlap(value) { this._overlap = value; }
    set chunks(value) { this._chunks = value.map(chunk => new OmniChunk(chunk)); }

    // Method to add a chunk
    addChunk(chunkData)
    {
        this._chunks.push(new OmniChunk(chunkData));
    }
}

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
/*

class SentenceTextSplitter
{
    constructor(chunkSize, chunkOverlap, wordToTokenRatio = 0.8)
    {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
        this.wordToTokenRatio = wordToTokenRatio;
    }

    // Splits text into sentences and then creates chunks
    splitText(text)
    {
        const sentences = text.match(/[^.!?]*[.!?]/g) || [];
        const chunks = [];
        let chunk = [];
        let overlap = [];
        let tokenCount = 0;

        for (let i=0; i<sentences.length; i++)
        {
            const sentence = sentences[i].trim();
            const words = sentence.split(' ');
            const nb_of_words = words.length;
            const sentenceTokenCount = nb_of_words * this.wordToTokenRatio;
             if (tokenCount + sentenceTokenCount <= this.chunkSize)
            {
                chunk.push(sentence);
                tokenCount += sentenceTokenCount;
            } 
            else
            {
                // Add overlap from the previous chunk
                if (overlap.length > 0)
                {
                    chunk = overlap.concat(chunk);
                }
                
                chunks.push(chunk.join(' '));
                
                // Calculate overlap for the next chunk
                const overlapStart = Math.max(0, chunk.length - this.chunkOverlap);
                overlap = chunk.slice(overlapStart);
                
                chunk = [sentence];
                tokenCount = sentenceTokenCount;
            }
        }

        // Add overlap and push the last chunk
        if (chunk.length > 0)
        {
            if (overlap.length > 0)
            {
                chunk = overlap.concat(chunk);
            }
            chunks.push(chunk.join(' '));
        }

        return chunks;
    }
}
*/


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
        console.log(`[embedQuery] Requested to embed text: ${text.slice(0, 128)}[...]`)
        
        const embedding_id = compute_chunk_id(this.ctx, text, this.vectorstore_name, this.hasher);
        console.log(`[embedQuery] embedding_id: ${embedding_id}`)

        let embedding = null;

        if (global_overwrite) 
        {
            await user_db_delete(this.ctx, embedding_id);
        }
        else
        {
            embedding = await user_db_get(this.ctx, embedding_id);
        }

        if (is_valid(embedding)) 
        {
            console.log(`[embedQuery]: embedding found in DB - returning it`)
            return embedding;
        }

        console_log(`[embedQuery] Not found in DB. Generating embedding for ${text.slice(0, 128)}[...]`);
        try
        {
            console.log(`[embedQuery] Using embedded: ${this.embedder}`)

            embedding = await this.embedder.embedQuery(text);
            if (!is_valid(embedding))
            {
                console.log(`[embedQuery]: [WARNING] embedding ${embedding} is invalid - returning null <---------------`)
                return null;
            }

            console.log(`[embedQuery]: computed embedding: ${embedding.slice(0, 128)}[...]`)
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
/*
class OmniTensorflowEmbeddings extends Embeddings
{
    // a db-cached version of the tensorflow embeddings
    // NOTE: this can easily be extened to a general purpose "cached embeddings" class
    // wrapper around any embeddings model
    constructor(ctx, hasher, vectorstore_name = DEFAULT_VECTORSTORE_NAME)
    {

        super();
        const embedder_model = EMBEDDER_MODEL_TENSORFLOW;
        this.embedder = new TensorFlowEmbeddings();

        this.ctx = ctx;
        this.db = ctx.app.services.get('db');
        this.user = ctx.user;
        this.vectorstore_name = vectorstore_name;

        this.hasher = hasher;
        this.modelName = embedder_model;

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
                const embedding = await this.embedQuery(text);
                embeddings.push(embedding);
            }
        }
        return embeddings;
    }

    async embedQuery(text)
    {
        const embedding_id = compute_chunk_id(text, this.vectorstore_name, this.hasher);
        const db_embedding = await user_db_get(this.ctx, embedding_id);
        if (is_valid(db_embedding)) return db_embedding;

        console_log(`Generating embedding for ${text.slice(0, 128)}[...]`);
        try
        {
            const embedding = await this.embedder.embedQuery(text);
            const success = await user_db_put(this.ctx, embedding, embedding_id);
            if (success == false)
            {
                throw new Error(`Error saving embedding for text chunk: ${text.slice(0, 128)}[...]`);
            }
            else
            {
                console_log(`Saved to DB`);
            }

            return embedding;
        }
        catch (error)
        {
            throw new Error(`Error generating embedding for text index ${i}: ${error}`);
        }
    }

}
*/

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
        console.log(`[OmniOpenAIEmbeddings] embedQuery: Requested to embed text: ${text.slice(0, 128)}[...]`)
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

    if (is_valid(functions)) args.functions = functions;
    console.log(`[query_advanced_chatgpt] args: ${JSON.stringify(args)}`);

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
/*
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
*/

function split_into_sentences(text)
{
    // Use a regular expression to consider sequences not containing '. ', '? ', or '! ' followed by a '.', '?', or '!'
    return text.match(/[^.!?]*[.!?]/g) || [];
}


/*
// Main function to populate chunks
async function compute_chunks(ctx, embedder, hasher, text, base_name, chunk_size = 3000, overlap_sentences = 1)
{
    if (embedder == null) throw new Error("No global embeddings available");

    console.log(`----------------> initial text = ${text}`);
    const [chunks_list, total_cost, total_words] = create_chunks(text, base_name, hasher, chunk_size, overlap_sentences);

    for (let i = 0; i < chunks_list.length; i++) 
    {
        const embedding_value = await await compute_and_cache_chunk_embedding(ctx, embedder, chunks_list[i]);
        chunks_list[i].embedding = embedding_value;
        console.log(`Computed embeddings for Chunk  ${i}`);
    }

    return [chunks_list, total_cost, total_words];
}
*/
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
/*
// Main function to create chunks
function create_chunks(text, base_name, hasher, chunk_size_in_tokens, overlap_size = 1, word_to_token_ratio = 0.8)
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
            chunk.id = base_name + "_" + hasher.hash(chunk.text);
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
*/
/*
async function compute_and_cache_chunk_embedding(ctx, embedder, chunk)
{
    const chunk_text = chunk.text;
    const chunk_id = chunk.id;
    const embedding = await embedder.embedQuery(chunk_text);
    await save_embedding_to_db(ctx, embedding, chunk_id);
    return embedding;
}
*/
/*
async function save_embedding_to_db(ctx, embedding, embedding_id)
{
    const db = get_db(ctx);
    const success = await user_db_put(ctx, embedding, embedding_id);
    if (!success) throw new Error("Failed to save embedding to db");
}
*/
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
/*
function calculate_hash(text, hasher)
{
    const hashed = hasher.hash(text);
    return hashed;
}
*/
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

/*
function adjust_chunk_size(chunk_size, allow_gpt4)
{

    if (allow_gpt4)
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
*/
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

/*
async function save_chunk_to_cdn(ctx, chunk_json)
{
    const chunk_cdn = await save_json_to_cdn_as_buffer(ctx, chunk_json);
    if (is_valid(chunk_cdn) == false) throw new Error(`ERROR: could not save chunks_cdn to cdn`);
    return chunk_cdn;
}
*/

/*
async function save_chunks_to_cdn(ctx, chunks, chunks_id, total_cost, total_words)
{
    const chunks_json = { chunks: chunks, chunks_id: chunks_id, total_cost: total_cost, total_words: total_words };
    const chunks_cdn = await save_json_to_cdn_as_buffer(ctx, chunks_json);
    if (is_valid(chunks_cdn) == false) throw new Error(`ERROR: could not save chunks_cdn to cdn`);
    return chunks_cdn;
}
*/

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
        console.log("Using embedder: EMBEDDER_MODEL_OPENAI <------------------")
        const raw_embedder = new OmniOpenAIEmbeddings(ctx);
        embedder = new CachedEmbeddings(ctx, raw_embedder, hasher, vectorstore_name);
    }
    else if (embedder_model == EMBEDDER_MODEL_TENSORFLOW) 
    {
        console.log("Using embedder: EMBEDDER_MODEL_TENSORFLOW <------------------")
        const raw_embedder = new TensorFlowEmbeddings();
        embedder = new CachedEmbeddings(ctx, raw_embedder, hasher, vectorstore_name);
    }

    // TBD: more embeddings here

    if (embedder == null || embedder == undefined) throw new Error(`get_embedder: Failed to initialize embeddings_model ${embedder_model}`);
    return embedder;
}

function initialize_hasher(ctx, hasher_model = DEFAULT_HASHER_MODEL)
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


function initialize_splitter(ctx, splitter_model = DEFAULT_SPLITTER_MODEL, args = {})
{

    const average_character_per_word = args.average_character_per_word || AVERAGE_CHARACTER_PER_WORD;
    const average_word_per_token = args.average_word_per_token || AVERAGE_WORD_PER_TOKEN;

    const characters_per_token = average_character_per_word * average_word_per_token;

    const chunk_size_in_tokens = args.chunk_size_in_tokens || DEFAULT_CHUNK_SIZE_IN_TOKENS;
    const chunk_size_in_characters = args.chunk_size_in_characters || chunk_size_in_tokens * characters_per_token;
    const chunk_overlap_in_tokens = args.chunk_overlap_in_tokens || DEFAULT_CHUNK_OVERLAP_IN_TOKENS;
    const chunk_overlap_in_characters = args.chunk_overlap_in_characters || chunk_overlap_in_tokens * characters_per_token;

    let splitter = null;
    if (splitter_model == SPLITTER_MODEL_RECURSIVE) 
    {
        splitter = new RecursiveCharacterTextSplitter({
            chunkSize: chunk_size_in_characters, // in characters!
            chunkOverlap: chunk_overlap_in_characters, // in characters!
        });
    }
    else if (splitter_model == SPLITTER_MODEL_TOKEN) 
    {
        splitter = new TokenTextSplitter({
            encodingName: SPLITTER_TOKEN_ENCODING,
            chunkSize: chunk_size_in_tokens, // in tokens!
            chunkOverlap: chunk_overlap_in_tokens, // in tokens!
        });
    }
    else
    {
        // SPLITTER_CODE
        const code_language = extractCodeLanguage(splitter_model);
        if (code_language)
        {
            splitter = RecursiveCharacterTextSplitter.fromLanguage(code_language, {
                chunkSize: chunk_size_in_characters, // in characters!
                chunkOverlap: chunk_overlap_in_characters, // in characters!
            });
        }
    }
    // TBD: more splitters here

    if (splitter == null || splitter == undefined) throw new Error(`initialize_splitter: Failed to initialize splitter_model ${splitter_model}`);
    return splitter;
}

function parse_object_to_array_of_objects(candidate_object)
{
    console_log(`parse_object_to_array_of_objects: candidate_object = ${JSON.stringify(candidate_object)}`);
    var objs = [];
    try
    {
        if (Array.isArray(candidate_object) && candidate_object.every(elem => typeof elem === 'object' && elem !== null))
        {
            objs = candidate_object;
        }
        else if (typeof candidate_object === 'object' && candidate_object !== null)
        {
            objs = [candidate_object];
        }
    }
    catch (error)
    {
        throw new Error(`parse_object_to_array_of_objects: Failed to parse candidate_object = ${JSON.stringify(candidate_object)} to array of objects`);
        objs = [];
    }
    return objs;
}

function parse_text_to_array(candidate_text)
{
    var texts = [];
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
async function load_pdf_component(ctx, payload)
{
    console.time("processTime");
    setGlobalVariables(ctx, payload);

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

        const hasher_model = payload.hasher || DEFAULT_HASHER_MODEL;
        const hasher = initialize_hasher(ctx, hasher_model);

        const texts_id = "converted_pdf_texts_" + hasher.hash(cleaned_texts);


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

    console.timeEnd("processTime");
    return texts_cdns;
}
// ---------------------------------------------------------------------------
async function query_chunks_component(ctx, document_cdn, query, payload)
{
    console.time("query_chunks_component_processTime");
    setGlobalVariables(ctx, payload);

    const nb_of_results = payload.nb_of_results;
    const document_json = await get_json_from_cdn(ctx, document_cdn);
    if (is_valid(document_json) == false) throw new Error(`[component_query_chunks] Error getting chunks from database with id ${JSON.stringify(document_cdn)}`);

    const vectorstore_name = document_json.vectorstore_name;
    const hasher_model = document_json.hasher_model;
    const embedder_model = document_json.embedder_model;
    const chunks = document_json.chunks;
    if (is_valid(chunks) == false) throw new Error(`[query_chunks_component] Error getting chunks from document_json: ${JSON.stringify(document_json)}`);

    console_log(`[query_chunks_component] Read from the document:\nchunks #= ${chunks}, vectorstore_name = ${vectorstore_name}, hasher_model = ${hasher_model}, embedder_model = ${embedder_model}`);

    const hasher = initialize_hasher(ctx, hasher_model);
    const embedder = initialize_embedder(ctx, embedder_model, hasher, vectorstore_name);
 
    const vectorstore = await compute_vectorstore(chunks, embedder);
    const query_answers = await smartquery_from_vectorstore(ctx, vectorstore, query, nb_of_results, embedder);
    const cdn_response = await save_json_to_cdn(ctx, query_answers);

    console.timeEnd("query_chunks_component_processTime");
    return cdn_response;
}
// ---------------------------------------------------------------------------
async function loop_llm_component(ctx, chunks_cdn, instruction, functions, args)
{
    console.time("loop_llm_component_processTime");
    setGlobalVariables(ctx, payload);

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

    console.timeEnd("loop_llm_component_processTime");
    return cdn_response;
}
// ---------------------------------------------------------------------------
async function collate_chapters_component(ctx, chunks_cdn, args)
{
    console.time("processTime");
    setGlobalVariables(ctx, payload);

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

    console.timeEnd("processTime");
    return { chapters: cdn_chapters, summary: cdn_summary, plot: cdn_plot };

}
/*
// ---------------------------------------------------------------------------
async function chunk_files_component(ctx, payload)
{
    console.log(`--------------------------------`);
    console_log(`[component_chunk_files] payload = ${JSON.stringify(payload)}`);
    const documents = payload.documents;
    const overwrite = true; // looks like the boolean component is broken in the Designer // payload.overwrite || false;
    let chunk_size = payload.chunk_size || DEFAULT_CHUNK_SIZE;
    let vectorstore_name = payload.vectorstore_name || DEFAULT_VECTORSTORE_NAME;


    // tbd replace these by a comma separated list of models (payload.models)
    const allow_gpt3 = payload.allow_gpt3 || true;
    const allow_gpt4 = payload.allow_gpt4 || false;
    if (!allow_gpt3 && !allow_gpt4) throw new Error(`ERROR: You must allow at least one LLM model`);

    const texts = await gather_all_texts_from_documents(ctx, documents);

    const embedder_model = payload.embeddings || DEFAULT_EMBEDDER;
    const embedder = initialize_embedder(ctx, embedder_model);

    const hasher_model = payload.hasher || DEFAULT_HASHER;
    const hasher = initialize_hasher(ctx, hasher_model);

    vectorstore_name = clean_vectorstore_name(vectorstore_name);
    chunk_size = adjust_chunk_size(chunk_size);

    const chunks_id = compute_document_id(texts, vectorstore_name, hasher);

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
            const [chunks_list, cost, words] = await compute_chunks(ctx, embedder, hasher, text, vectorstore_name, chunk_size);
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
*/
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
async function read_text_file_component(ctx, payload)
{
    console.time("processTime");
    setGlobalVariables(ctx, payload);

    const documents = [];
    console.log(`--------------------------------`);
    console_log(`[read_text_file_component] payload = ${JSON.stringify(payload)}`);

    const texts = parse_text_to_array(payload.text);
    console.log(`[read_text_file_component] texts #  ${texts.length}`);

    const urls = parse_text_to_array(payload.url);
    console.log(`[read_text_file_component] urls #  ${urls.length}`);

    const cdn_tickets_from_urls = rebuildToTicketObjectsIfNeeded(urls);
    console.log(`[read_text_file_component] cdn_tickets_from_urls #  ${cdn_tickets_from_urls.length}`);

    for (let i = 0; i < cdn_tickets_from_urls.length; i++) 
    {
        const cdn_ticket = cdn_tickets_from_urls[i];
        documents.push(cdn_ticket);
    }

    for (let i = 0; i < texts.length; i++) 
    {
        const text = texts[i];
        const buffer = Buffer.from(text);
        const document_cdn = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });

        documents.push(document_cdn);
    }

    if (is_valid(documents) == false) throw new Error(`ERROR: could not convert to documents`);
    console.log(`[read_text_file_component] documents # = ${documents.length}`);
    console.log(`[read_text_file_component] documents = ${JSON.stringify(documents)}`);

    console.timeEnd("processTime");
    return documents;
}
// ---------------------------------------------------------------------------
async function advanced_llm_component(ctx, payload)
{
    console.time("processTime");
    setGlobalVariables(ctx, payload);

    console.log(`--------------------------------`);
    console_log(`[advanced_llm_component] payload = ${JSON.stringify(payload)}`);
    const instructions = parse_text_to_array(payload.instruction);
    const prompts = parse_text_to_array(payload.prompt);
    const llm_functions = parse_object_to_array_of_objects(payload.llm_function);
    const temperature = payload.temperature || 0;
    const top_p = payload.top_p || 1;
    const allow_gpt3 = payload.allow_gpt3 || true;
    const allow_gpt4 = payload.allow_gpt4 || false;
    GLOBAL_ALLOW_GPT3 = allow_gpt3;
    GLOBAL_ALLOW_GPT4 = allow_gpt4;
    if (!allow_gpt3 && !allow_gpt4) throw new Error(`ERROR: You must allow at least one LLM model`);

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

            const answer_object = await query_advanced_chatgpt(ctx, prompt, instruction, llm_functions, temperature, top_p);
            if (is_valid(answer_object) == false) continue;

            const answer_text = answer_object.text;
            const answer_fa = answer_object.function_arguments;

            if (is_valid(answer_text))
            {
                answers[id] = answer_text;
                answer_string += answer_text + "\n";
            }
            else
            {
                answers[id] = answer_fa;
                try
                {
                    answer_string += JSON.stringify(answer_fa) + "\n";
                }
                catch (e)
                {
                    answer_string += "n/a\n";
                }
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
async function process_chapter(ctx, chapter_text, vectorstore_name, hasher, embedder, splitter, document_id, overwrite, payload)
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

        const hasher_model = payload.hasher_model;
        const embedder_model = payload.embedder_model;
        const splitter_model = payload.splitter_model;

        document_json = { id: document_id, hasher_model: hasher_model, embedder_model: embedder_model, splitter_model: splitter_model, vectorstore_name: vectorstore_name, chunks: chapter_chunks, chapters: [chapter_text], args: payload};
        document_cdn = await save_json_to_cdn_as_buffer(ctx, document_json);

        if (is_valid(document_cdn) == false) throw new Error(`ERROR: could not save document_cdn to cdn`);
        console.log(`[process_chapter] document_cdn: = ${JSON.stringify(document_cdn)}`);

        const success = await save_chunks_cdn_to_db(ctx, document_cdn, document_id);
        if (success == false) throw new Error(`ERROR: could not save document_cdn to db`);
    }

    console.timeEnd("processTime");
    return {cdn: document_cdn, json: document_json};
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
            const chunk_json = { text: chunk_text, id: chunk_id, embedding: chunk_embedding };
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
async function chunk_files_component(ctx, payload)
{
    console.log(`--------------------------------`);
    console_log(`[chunk_files_component] payload = ${JSON.stringify(payload)}`);

    console.time("processTime");
    setGlobalVariables(ctx, payload);

    const documents = payload.documents;
    const overwrite = payload.overwrite || false;
    const collate = payload.collate || true;

    let vectorstore_name = payload.vectorstore_name || DEFAULT_VECTORSTORE_NAME;
    vectorstore_name = clean_vectorstore_name(vectorstore_name);

    const hasher_model = payload.hasher_model || DEFAULT_HASHER_MODEL;
    const hasher = initialize_hasher(ctx, hasher_model);

    const splitter_model = payload.splitter_model || DEFAULT_SPLITTER_MODEL;
    const splitter = initialize_splitter(ctx, splitter_model, payload); // payload is passed to the splitter for initialization purposes

    const embedder_model = payload.embedder_model || DEFAULT_EMBEDDER_MODEL;
    const embedder = initialize_embedder(ctx, embedder_model, hasher, vectorstore_name);

    console.log(`[chunk_files_component] hasher_model = ${hasher_model}, splitter_model = ${splitter_model}, embedder_model = ${embedder_model}`   )


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
        let response = await process_chapter(ctx, text, vectorstore_name, hasher, embedder, splitter, document_id, overwrite, payload);

        if (collate)
        {
            const document_json = response.json;
            all_texts += text+"\n\n";
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
        const collated_json = {id: collated_document_id, hasher_model: hasher_model, embedder_model: embedder_model, splitter_model: splitter_model, vectorstore_name: vectorstore_name, chunks: all_chunks, chapters: chapters, args: payload};
        const collated_document_cdn = await save_json_to_cdn_as_buffer(ctx, collated_json);
        cdns = [collated_document_cdn];
    }

    console.timeEnd("processTime");
    return cdns;
}

  

export { advanced_llm_component, read_text_file_component, chunk_files_component, collate_chapters_component, loop_llm_component, query_chunks_component, load_pdf_component };
