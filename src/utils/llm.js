// llm.js
import { is_valid, console_log, clean_string, pauseForSeconds } from './utils.js';
import { runBlock } from './blocks.js';
import { count_tokens_in_text } from './tiktoken.js';
import { createCompletion, loadModel } from '../gpt4all/gpt4all.js';
// --------------------

import path from "path";
import os from "os";
import { omnilog } from 'mercs_shared';
import { walkDirForExtension, validateFileExists, read_json_file } from './files.js';


const LLM_CONTEXT_SIZE_MARGIN = 500;
const GPT3_MODEL_SMALL = "gpt-3.5-turbo";
const GPT3_MODEL_LARGE = "gpt-3.5-turbo-16k";
const GPT3_SIZE_CUTOFF = 4096 - LLM_CONTEXT_SIZE_MARGIN;
const DEFAULT_GPT_MODEL = GPT3_MODEL_LARGE;

const GPT4_MODEL_SMALL = "gpt-4";
const GPT4_MODEL_LARGE = "gpt-4-32k";
const GPT4_SIZE_CUTOFF = 8192 - LLM_CONTEXT_SIZE_MARGIN;
const GPT4_SIZE_MAX = 32768 - LLM_CONTEXT_SIZE_MARGIN;

const MODEL_TYPE_OPENAI = "openai";
const MODEL_TYPE_OTHER = "other";
const DEFAULT_UNKNOWN_CONTEXT_SIZE = 4096;
const DEFAULT_UNKNOWN_MEMORY_NEED = 8192;

const LLM_USER_PROVIDED_MODELS_DIRECTORY = path.resolve(process.cwd(), "user_provided_models");
const LLM_LM_STUDIO_CACHE_DIRECTORY = path.resolve(os.homedir(), ".cache/lm-studio", "models");
import { DEFAULT_DIRECTORY as LLM_GPT4ALL_CACHE_DIRECTORY } from '../gpt4all/config.js';

const LLM_LOCATION_OPENAI_SERVER = "openai_server"
const LLM_LOCATION_GPT4ALL_CACHE = "gpt4all_cache"
const LLM_LOCATION_LM_STUDIO_CACHE = "lm_studio_cache"
const LLM_LOCATION_USER_PROVIDED = "user_provided"
const LLM_LOCATION_GPT4ALL_SERVER = "gpt4all_server"


//const {
//    DEFAULT_DIRECTORY,
//    DEFAULT_LIBRARIES_DIRECTORY,
//    DEFAULT_PROMPT_CONTEXT,
//    DEFAULT_MODEL_CONFIG,
//    DEFAULT_MODEL_LIST_URL,
//} = require("../gpt4all/config.js");


const llm_remote_models = [
    { model_name: "gpt-3.5-turbo", model_type: "openai", memory_need: 0, context_size: 4096, location: LLM_LOCATION_OPENAI_SERVER },
    { model_name: "gpt-3.5-turbo-16k", model_type: "openai", memory_need: 0, context_size: 16384, location:LLM_LOCATION_OPENAI_SERVER },
    { model_name: "gpt-4", model_type: "openai", memory_need: 0, context_size: 8192, location: LLM_LOCATION_OPENAI_SERVER },
    { model_name: "gpt-4-32k", model_type: "openai", memory_need: 0, context_size: 32768, location: LLM_LOCATION_OPENAI_SERVER },
    { model_name: "ggml-gpt4all-j-v1.3-groovy.bin", model_type: "gptj", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER},
    { model_name: "ggml-gpt4all-j-v1.2-jazzy.bin", model_type: "gptj", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-gpt4all-j-v1.1-breezy.bin", model_type: "gptj", memory_need: 8192, context_size: 4096, location:LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-gpt4all-j.bin", model_type: "gptj", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-gpt4all-l13b-snoozy.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-vicuna-7b-1.1-q4_2.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-vicuna-13b-1.1-q4_2.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER},
    { model_name: "ggml-wizardLM-7B.q4_2.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-stable-vicuna-13B.q4_2.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-nous-gpt4-vicuna-13b.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-v3-13b-hermes-q5_1.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-mpt-7b-base.bin", model_type: "mpt", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-mpt-7b-chat.bin", model_type: "mpt", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-mpt-7b-instruct.bin", model_type: "mpt", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-replit-code-v1-3b.bin", model_type: "replit", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
];
// TBD: read that info from online source
const llm_model_types = {};
const llm_context_sizes = {};
const llm_memory_needs = {};
const llm_location = {};
const llm_local_choices = {};
const loaded_models = {};

async function get_llm_choices()
{
    await add_local_llm_choices(LLM_GPT4ALL_CACHE_DIRECTORY, LLM_LOCATION_GPT4ALL_CACHE);
    await add_local_llm_choices(LLM_LM_STUDIO_CACHE_DIRECTORY, LLM_LOCATION_LM_STUDIO_CACHE);
    await add_local_llm_choices(LLM_USER_PROVIDED_MODELS_DIRECTORY, LLM_LOCATION_USER_PROVIDED);

    const choices = [];
    const directory_path = LLM_GPT4ALL_CACHE_DIRECTORY;

    const remote_models = Object.values(llm_remote_models);
    for (const model of remote_models)
    {
        
        let name = model.model_name;

        if (name in llm_local_choices == false)
        {
            let title, description;
            title = deduce_llm_title(name);
            description = deduce_llm_description(name, model.context_size);

            if (model.location === LLM_LOCATION_GPT4ALL_SERVER)
            {
                const filename = path.join(directory_path, model.model_name);
                const fileExist = await validateFileExists(filename);   
                if (!fileExist)
                {
                    title = '\u2B07' + title;
                }
            }

            if (name in llm_model_types == false) llm_model_types[name] = model.model_type;
            if (name in llm_context_sizes == false) llm_context_sizes[name] = model.context_size;
            if (name in llm_memory_needs == false) llm_memory_needs[name] = model.memory_need;
            if (name in llm_location == false) llm_location[name] = model.location;
            // we do NOT add name to llm_local_choices on purpose to distinguish between local and remote models
        
            choices.push({ value: name, title: title, description: description });

        }

    };

    const local_choices =  Object.values(llm_local_choices);
    for (const choice of local_choices)
    {
        choices.push(choice);
    }

    return choices;
}

async function add_local_llm_choices(model_dir, location) 
{
    // adding externally downloaded llms
    let filePaths = [];
    omnilog.warn(`external model_dir = ${model_dir}`);
    
    filePaths = await walkDirForExtension(filePaths, model_dir, '.bin');
    omnilog.warn(`external filePaths # = ${filePaths.length}`);
    
    for (const filepath of filePaths)
    {
        const name = path.basename(filepath);
        omnilog.warn(`name = ${name}`);
        const jsonPath = filepath.replace('.bin', '.json');
        let title, description, model_type, context_size, memory_need;

        if (name in llm_model_types == false) 
        {
            omnilog.warn(`not known yet: ${name}`);
            if (await validateFileExists(jsonPath)) 
            {
                
                const jsonContent = await read_json_file(jsonPath);
                title = jsonContent.title ?? deduce_llm_title(name);;
                description = jsonContent.description ?? deduce_llm_description(name, jsonContent.context_size ?? 0);
                model_type = jsonContent.model_type ?? MODEL_TYPE_OTHER;
                context_size = jsonContent.context_size ?? DEFAULT_UNKNOWN_CONTEXT_SIZE;
                memory_need = jsonContent.memory_need ?? DEFAULT_UNKNOWN_MEMORY_NEED;

            }
            else 
            {

                title = deduce_llm_title(name);
                description = deduce_llm_description(name);
                model_type = MODEL_TYPE_OTHER;
                context_size = DEFAULT_UNKNOWN_CONTEXT_SIZE;
                memory_need = DEFAULT_UNKNOWN_MEMORY_NEED;

            }

            llm_model_types[name] = model_type;
            llm_context_sizes[name] = context_size;
            llm_memory_needs[name] = memory_need;
            llm_location[name] = location;
            const choice = { value: name, title: title, description: description };
            llm_local_choices[name] = choice;

            omnilog.warn(`added: ${name} with choices: ${JSON.stringify(choice)}`);
        }
    }

}

function adjust_model(text_size, current_model)
{
    if (current_model in llm_model_types == false) return current_models;
    if (llm_model_types[current_model] != MODEL_TYPE_OPENAI) return current_model;

    if (typeof text_size !== 'number')
    {
        throw new Error(`adjust_model: text_size is not a string or a number: ${text_size}, type=${typeof text_size}`);
    }

    if (current_model == GPT3_MODEL_SMALL) return current_model;

    if (current_model == GPT3_MODEL_LARGE)
    {
        if (text_size < GPT3_SIZE_CUTOFF) return GPT3_MODEL_SMALL; else return current_model;
    }

    if (current_model == GPT4_MODEL_SMALL) return current_model;

    if (current_model == GPT4_MODEL_LARGE)
    {
        if (text_size < GPT4_SIZE_CUTOFF) return GPT3_MODEL_SMALL; else return current_model;
    }

    throw new Error(`pick_model: Unknown model: ${current_model}`);
}

function get_model_max_size(model_name, use_a_margin = true)
{
    if (use_a_margin == false) return get_model_context_size(model_name);
    const safe_size = Math.floor(get_model_context_size(model_name)*0.9);
    return safe_size;
}

async function fix_with_llm(ctx, json_string_to_fix)
{
    // TBD use 'selected LLM' here instead of chatGPT
    console_log(`[FIXING] fix_with_llm: Fixing JSON string with LLM: ${json_string_to_fix}`);
    let response = null;
    let args = {};
    args.user = ctx.userId;
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

function get_llm_type(model_name)
{
    if (model_name in llm_model_types == false) return MODEL_TYPE_OTHER;
    const model_type = llm_model_types[model_name];
    return model_type;
}

function get_model_context_size(model_name)
{
    if (model_name in llm_context_sizes == false) return DEFAULT_UNKNOWN_CONTEXT_SIZE;
    const context_size = llm_context_sizes[model_name];
    return context_size;
}

async function query_llm(ctx, prompt, instruction, model_name = GPT3_MODEL_SMALL, llm_functions = null, temperature = 0, top_p = 1)
{
    omnilog.warn(`query_llm: model_name = ${model_name}, prompt = ${prompt}, instruction = ${instruction}, llm_functions = ${JSON.stringify(llm_functions)}, temperature = ${temperature}, top_p = ${top_p}`);
    let response = null;

    if (get_llm_type(model_name) == MODEL_TYPE_OPENAI)
    {
        response = await query_openai_llm(ctx, prompt, instruction, model_name, llm_functions, temperature, top_p);
    }
    else
    {
        response = await query_gpt4all_llm(prompt, instruction, model_name, llm_functions, temperature, top_p);
    }

    return response;
}

async function query_openai_llm(ctx, prompt, instruction, model = GPT3_MODEL_SMALL, llm_functions = null, temperature = 0, top_p = 1)
{

    let args = {};
    args.user = ctx.userId;
    args.prompt = prompt;
    args.instruction = instruction;
    args.temperature = temperature;
    args.top_p = top_p;
    args.model = model;
    if (is_valid(llm_functions)) args.functions = llm_functions;

    console_log(`[query_advanced_chatgpt] args: ${JSON.stringify(args)}`);

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

async function query_gpt4all_llm(prompt, instruction, model_name, llm_functions = null, temperature = 0, top_p = 1, numPredict = 512, numCtxTokens = 128)
{

    omnilog.log(`Using model_name = ${model_name}`);

    let model = null;

    if (model_name in loaded_models) model = loaded_models[model_name];
    else
    {
        if (model_name in llm_model_types == false) throw new Error(`Unknown model: ${model_name}.`);

        process.env.GPT4ALL_NODE_LIBRARY_PATH = path.join('extensions', 'omni-extension-document_processing', 'src', 'gpt4all');

        omnilog.log(`LOADING NEW MODEL: ${model_name}`);
        model = await loadModel(model_name, { verbose: true });
        loaded_models[model_name] = model;
    }

    const dialog = [{ role : 'system', content : instruction}, {role : 'user', content : prompt} ];
    omnilog.warn(`dialog = ${JSON.stringify(dialog)}`);
    const response = await createCompletion(model, dialog);

    omnilog.log(`response = ${JSON.stringify(response)}`);
    const choices = response?.choices;

    let result = { text: "" };
    if (choices && Array.isArray(choices) && choices.length > 0)
    {
        const choice = choices[0];
        const message = choice?.message;
        const content = message?.content;
        const usage = response?.usage;
        const total_tokens = usage.total_tokens;

        result.text = content;
        omnilog.log(`result = ${JSON.stringify(result)}`);
    }
    return result;

}

function deduce_llm_title(name)
{
    const title = name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return title;
}

function deduce_llm_description(name, context_size = 0)
{
    let description = name.substring(0, name.length - 4); // remove ".bin"
    if (context_size > 0) description += ` (${Math.floor(context_size/1024)}k)`;
    return description;
}

export { query_llm, runChatGPTBlock, get_model_max_size, adjust_model, get_llm_choices };
export { DEFAULT_GPT_MODEL, GPT4_SIZE_MAX }

