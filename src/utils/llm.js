//@ts-check
// llm.js
import { is_valid, console_log, clean_string, pauseForSeconds } from './utils.js';
import { runBlock } from './blocks.js';
import { count_tokens_in_text } from './tiktoken.js';
import path from "path";
import os from "os";
import { omnilog } from 'mercs_shared';
import { walkDirForExtension, validateDirectoryExists, validateFileExists, readJsonFromDisk, fetchJsonFromUrl } from './files.js';

const LLM_CONTEXT_SIZE_MARGIN = 500;
const GPT3_MODEL_SMALL = "gpt-3.5-turbo";
const GPT3_MODEL_LARGE = "gpt-3.5-turbo-16k";
const GPT3_SIZE_CUTOFF = 4096 - LLM_CONTEXT_SIZE_MARGIN;
const DEFAULT_GPT_MODEL = GPT3_MODEL_LARGE;

const GPT4_MODEL_SMALL = "gpt-4";
const GPT4_MODEL_LARGE = "gpt-4-32k";
const GPT4_SIZE_CUTOFF = 8192 - LLM_CONTEXT_SIZE_MARGIN;
const GPT4_SIZE_MAX = 32768 - LLM_CONTEXT_SIZE_MARGIN;

const DEFAULT_UNKNOWN_CONTEXT_SIZE = 4096;
const DEFAULT_UNKNOWN_MEMORY_NEED = 8192;

const MODELS_DIR_JSON_PATH = ["..", "..", "user_files", "local_llms_directories.json"]; // from process.cwd(), which is ./packages/server/

const LLM_PROVIDER_OPENAI_SERVER = "openai"; // we may need to support Azure and other providers (e.g. Poe)
const LLM_MODEL_TYPE_OPENAI = "openai";
const BLOCK_OPENAI_ADVANCED_CHATGPT = "openai.advancedChatGPT";

const LOAD_LOCAL_LLMS = true
const llm_openai_models = [
    { model_name: "gpt-3.5-turbo", model_type: LLM_MODEL_TYPE_OPENAI, context_size: 4096, provider: LLM_PROVIDER_OPENAI_SERVER },
    { model_name: "gpt-3.5-turbo-16k", model_type: LLM_MODEL_TYPE_OPENAI, context_size: 16384, provider: LLM_PROVIDER_OPENAI_SERVER },
    { model_name: "gpt-4", model_type: LLM_MODEL_TYPE_OPENAI, context_size: 8192, provider: LLM_PROVIDER_OPENAI_SERVER },
    { model_name: "gpt-4-32k", model_type: LLM_MODEL_TYPE_OPENAI, context_size: 32768, provider: LLM_PROVIDER_OPENAI_SERVER },
];

const llm_model_types = {};
const llm_context_sizes = {};


// --- oobabooga ---
const LLM_MODEL_TYPE_OOBABOOGA = "oobabooga";
const LLM_PROVIDER_OOBABOOGA_LOCAL = "oobabooga";
const BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT = "oobabooga.simpleGenerateText";
const BLOCK_OOBABOOGA_MANAGE_MODEL = "oobabooga.manageModelComponent";

// --- lm-studio ---
const LLM_PROVIDER_LM_STUDIO_LOCAL = "lm-studio"
const LLM_MODEL_TYPE_LM_STUDIO = "lm-studio"
const BLOCK_LM_STUDIO_SIMPLE_CHATGPT = "lm-studio.simpleGenerateTextViaLmStudio";

function addOpenaiLlmChoices(choices)
{
    const remote_models = Object.values(llm_openai_models);
    for (const model of remote_models)
    {

        let model_name = model.model_name;
        let provider = model.provider;
        let combined = combineModelNameAndProvider(model_name, provider);

        const title = model.title || deduceLlmTitle(model_name, provider);
        const description = model.description || deduceLlmDescription(model_name, model.context_size);

        llm_model_types[model_name] = model.type;
        llm_context_sizes[model_name] = model.context_size;

        const choice = { value: combined, title: title, description: description };
        choices.push(choice);
    }
    return choices
}
async function getLlmChoices()
{
    debugger;
    let choices = [];
    choices = await addOpenaiLlmChoices(choices);
    if (LOAD_LOCAL_LLMS)
    {
        const models_dir_json = await getModelsDirJson()
        if (models_dir_json)
        {
            choices = await addLocalLlmChoices(choices, models_dir_json, LLM_PROVIDER_OOBABOOGA_LOCAL);
            if (models_dir_json[LLM_PROVIDER_LM_STUDIO_LOCAL]) choices.push({ value: combineModelNameAndProvider("loaded_model", LLM_PROVIDER_LM_STUDIO_LOCAL), title: '🖥model currently loaded in (LM-Studio)', description: "Use the model currently loaded in LM-Studio if that model's server is running." });
        }
    }
   
    return choices;
}
function combineModelNameAndProvider(model_name, model_provider)
{
    return `${model_name}|${model_provider}`;
}

function splitModelNameFromProvider(model_combined)
{
    const splits = model_combined.split('|');
    if (splits.length != 2) throw new Error(`splitModelNameFromType: model_combined is not valid: ${model_combined}`);
    return { model_name: splits[0], model_provider: splits[1] };
}

async function addLocalLlmChoices(choices, models_dir_json, model_provider) 
{
    const model_dir = models_dir_json[model_provider];
    if (!model_dir) return choices;

    const dir_exists = await validateDirectoryExists(model_dir)
    if (!dir_exists) return choices;

    let filePaths = [];
    filePaths = await walkDirForExtension(filePaths, model_dir, '.bin');

    //debug
    omnilog.warn(`external model_dir = ${model_dir}, external filePaths # = ${filePaths.length}`);

    for (const filepath of filePaths)
    {
        const name = path.basename(filepath);
        const combined = combineModelNameAndProvider(name, model_provider);
        const title = deduceLlmTitle(name, model_provider);
        const description = deduceLlmDescription(name);
        const choice = { value: combined, title: title, description: description };

        llm_context_sizes[name] = DEFAULT_UNKNOWN_CONTEXT_SIZE;
        choices.push(choice);
}

    return choices;
}

function adjustOpenaiModel(text_size, model_name)
{
    if (typeof text_size !== 'number')
    {
        throw new Error(`adjust_model: text_size is not a string or a number: ${text_size}, type=${typeof text_size}`);
    }

    if (model_name == GPT3_MODEL_SMALL) return model_name;

    if (model_name == GPT3_MODEL_LARGE)
    {
        if (text_size < GPT3_SIZE_CUTOFF) return GPT3_MODEL_SMALL; else return model_name;
    }

    if (model_name == GPT4_MODEL_SMALL) return model_name;

    if (model_name == GPT4_MODEL_LARGE)
    {
        if (text_size < GPT4_SIZE_CUTOFF) return GPT3_MODEL_SMALL; else return model_name;
    }

    throw new Error(`pick_model: Unknown model: ${model_name}`);
}

function get_model_max_size(model_name, use_a_margin = true)
{
    if (use_a_margin == false) return get_model_context_size(model_name);
    const safe_size = Math.floor(get_model_context_size(model_name) * 0.9);
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

function get_model_context_size(model_name)
{
    if (model_name in llm_context_sizes == false) return DEFAULT_UNKNOWN_CONTEXT_SIZE;
    const context_size = llm_context_sizes[model_name];
    return context_size;
}

async function queryLlm(ctx, prompt, instruction, combined = GPT3_MODEL_SMALL+"|"+LLM_PROVIDER_OPENAI_SERVER, llm_functions = null, temperature = 0, top_p = 1)
{
    let response = null;
    const splits = splitModelNameFromProvider(combined);
    const model_name = splits.model_name;
    const model_provider = splits.model_provider;

    omnilog.warn(`[queryLlm] model_name = ${model_name}, model_type = ${model_provider}`);
    if (model_provider == LLM_PROVIDER_OPENAI_SERVER)
    {
        response = await query_openai_llm(ctx, prompt, instruction, model_name, llm_functions, temperature, top_p);
    }
    else if (model_provider == LLM_MODEL_TYPE_OOBABOOGA)
    {
        const prompt_and_instructions = `${instruction}\n\n${prompt}`;
        response = await queryOobaboogaLlm(ctx, prompt_and_instructions, model_name, temperature);
    }
    else if (model_provider == LLM_MODEL_TYPE_LM_STUDIO)
    {
        response = await queryLmStudioLlm(ctx, prompt, instruction, temperature);
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

    args.model = adjustOpenaiModel(cost, model);

    let response = null;
    try
    {
        response = await runBlock(ctx, BLOCK_OPENAI_ADVANCED_CHATGPT, args);
    }
    catch (err)
    {
        let error_message = `Error running openai.advancedChatGPT: ${err.message}`;
        console.error(error_message);
        throw err;
    }
    return response;
}


function deduceLlmTitle(name, model_provider)
{
    let icon = '';
    let postfix = '';
    switch (model_provider)
    {
        case LLM_PROVIDER_OPENAI_SERVER:
            icon = '💰';
            postfix = 'openai'
            break;
        case LLM_PROVIDER_OOBABOOGA_LOCAL:
            icon = '📁';
            postfix = 'oobabooga'
            break;
        case LLM_PROVIDER_LM_STUDIO_LOCAL:
            icon = '🖥';
            postfix = 'lm-studio'
            break;
        default:
            icon = '?';
            break;    
    }
    const title = icon + name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) + ' (' + postfix + ')';

    return title;
}

function deduceLlmDescription(model_name, context_size = 0)
{
    let description = model_name.substring(0, model_name.length - 4); // remove ".bin"
    if (context_size > 0) description += ` (${Math.floor(context_size / 1024)}k)`;
    return description;
}

async function getModelsDirJson()
{
    const json_path = path.resolve(process.cwd(), ...MODELS_DIR_JSON_PATH);
    const file_exist = validateFileExists(json_path);
    if (!file_exist) return null;

    const models_dir_json =  await readJsonFromDisk(json_path);

    //debug
    omnilog.warn(`[getModelsDirJson] json_path = ${json_path}, models_dir_json = ${JSON.stringify(models_dir_json)}`)
    return models_dir_json;

}

//
// ------ oobabooga -----------------------------------------------------------
//
function parseOobaboogaModelResponse(model_response)
{
    let nestedResult = JSON.parse(model_response);
    omnilog.warn(`nestedResult = ${JSON.stringify(nestedResult)}`);

    // Rename the keys
    if (nestedResult['shared.settings']) {
        nestedResult.shared_settings = nestedResult['shared.settings'];
        delete nestedResult['shared.settings'];
    }
    
    if (nestedResult['shared.args']) {
        nestedResult.shared_args = nestedResult['shared.args'];
        delete nestedResult['shared.args'];
    }

    omnilog.warn(`nestedResult (after) = ${JSON.stringify(nestedResult)}`);
    return nestedResult;
}

async function queryOobaboogaLlm(ctx, prompt, model_name, temperature = 0.3)
{
    // for now, for this to work we need:
    // 1. a model manually copied into oobabbooga's models directory 
    // 2. in oobabooga session tab, options --api and --listen checked (or used as cmdline parameters when launching oobabooga)

    let model_response = await getOobaboggaCurrentModelInfo(ctx);

    // Parsing the nested JSON string inside the 'result' property
    let nestedResult = parseOobaboogaModelResponse(model_response);
    
    let loaded_model = nestedResult?.model_name;
    const context_size = nestedResult?.shared_settings?.max_new_tokens_max || 0;
    llm_context_sizes[model_name] = context_size;

    if (loaded_model != model_name)
    {
        model_response = await loadOobaboogaModel(ctx, model_name);
        nestedResult = parseOobaboogaModelResponse(model_response);
        loaded_model = nestedResult?.model_name;
    }
    
    if (loaded_model != model_name) throw new Error (`Failed to load model ${model_name} into oobabooga`);

    let args = {};
    //args.user = ctx.userId;
    args.prompt = prompt;
    args.temperature = temperature;
    // args.top_p = top_p;
    // TBD: find a way to support functions

    console_log(`[queryOobaboogaLlm] args: ${JSON.stringify(args)}`);

    const response = await runBlock(ctx, BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT, args);
    if (response.error) throw new Error(response.error);

    const results = response?.results || [];
    if (results.length == 0) throw new Error("No results returned from oobabooga");

    const text = results[0].text || null;
    if (!text) throw new Error("Empty text result returned from oobabooga. Did you load a model in oobabooga?");

    const return_value = {
        text: text,
        function_arguments_string: "",
        function_arguments: null,
        total_tokens: 0,
    };

    //DEBUG
    omnilog.warn(`oobabooga return value = ${JSON.stringify(return_value)}`);

    return return_value;

}

async function getOobaboggaCurrentModelInfo(ctx)
{
    const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "info" });

    //{'model_name': shared.model_name,
    //'lora_names': shared.lora_names,
    //'shared.settings': shared.settings,
    //'shared.args': vars(shared.args),}

    return response?.result;
}

async function loadOobaboogaModel(ctx, model_name)
{
    const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "load", model_name: model_name });
    return response.result;
}

async function readLocalOobaboogaChoices(ctx, choices)
{
 
    const model_names = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "list" });

    //DEBUG
    omnilog.warn(`oobabooga model_names = ${JSON.stringify(model_names)}`);

    for (const model_name in model_names)
    {
        omnilog.warn(`name = ${model_name}`);
        let title, description, model_type, context_size, memory_need;

        const combined = combineModelNameAndProvider(model_name, LLM_PROVIDER_OOBABOOGA_LOCAL)

        title = deduceLlmTitle(model_name, LLM_PROVIDER_OOBABOOGA_LOCAL);
        description = deduceLlmDescription(model_name);

        llm_model_types[model_name] = LLM_MODEL_TYPE_OOBABOOGA;
        llm_context_sizes[model_name] = DEFAULT_UNKNOWN_CONTEXT_SIZE;

        const choice = { value: model_name, title: title, description: description };
        choices.push(choice);
    }
    return choices;
}

//
// ------ lm-studio -----------------------------------------------------------
//

async function queryLmStudioLlm(ctx, prompt, instruction, temperature = 0.3)
{
    // for now, for this to work we need:
    // 1. a model manually copied into oobabbooga's models directory 
    // 2. in oobabooga session tab, options --api and --listen checked (or used as cmdline parameters when launching oobabooga)

    let args = {};
    //args.user = ctx.userId;
    args.prompt = prompt;
    args.instruction = instruction;
    args.temperature = temperature;
    // args.top_p = top_p;
    // TBD: find a way to support functions

    console_log(`[queryLmStudioLlm] args: ${JSON.stringify(args)}`);

    const response = await runBlock(ctx, BLOCK_LM_STUDIO_SIMPLE_CHATGPT, args);
    if (response.error) throw new Error(response.error);

    omnilog.warn(`response = ${JSON.stringify(response)}`);

    const choices = response?.choices || [];
    if (choices.length == 0) throw new Error("No results returned from lm_studio");

    const text = choices[0].content;

    if (!text) throw new Error (`Empty result returned from lm_studio. response = ${JSON.stringify(response)}`);
    
   
    const return_value = {
        text: text,
        function_arguments_string: "",
        function_arguments: null,
        total_tokens: 0,
    };

    //DEBUG
    omnilog.warn(`lm-studio return value = ${JSON.stringify(return_value)}`);

    return return_value;

}

export { queryLlm, runChatGPTBlock, get_model_max_size, adjustOpenaiModel as adjust_model, getLlmChoices };
export { DEFAULT_GPT_MODEL, GPT4_SIZE_MAX }

