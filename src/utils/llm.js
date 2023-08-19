// llm.js
import { is_valid, console_log, clean_string, pauseForSeconds } from './utils.js';
import { runBlock } from './blocks.js';
import { count_tokens_in_text } from './tiktoken.js';
import { createCompletion } from '../gpt4all/gpt4all.js';
// --------------------

import path from "path";
import { omnilog } from 'mercs_shared';
import { walkDirForExtension, validateFileExists, read_json_file } from './files.js';


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


const LLM_MODELS_DIRECTORY = "models";



function adjust_model(text_size, current_model)
{
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

function get_model_max_size(model_name)
{
    if (model_name == GPT3_MODEL_SMALL) return GPT3_SIZE_CUTOFF;
    if (model_name == GPT3_MODEL_LARGE) return GPT3_SIZE_MAX;
    if (model_name == GPT4_MODEL_SMALL) return GPT4_SIZE_CUTOFF;
    if (model_name == GPT4_MODEL_LARGE) return GPT4_SIZE_MAX;

    if (is_llm_of_type(model_name, 'llama')) return GPT3_SIZE_CUTOFF;

    throw new Error(`get_model_max_size: Unknown model: ${model_name}`);

}

async function fix_with_llm(ctx, json_string_to_fix)
{
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

function is_llm_of_type(model_name, model_type)
{
    const modelLower = model_name.toLowerCase();

    return modelLower.includes(model_type);
}

async function query_llm(ctx, prompt, instruction, model_name = GPT3_MODEL_SMALL, llm_functions = null, temperature = 0, top_p = 1)
{
    let response = null;

    if (is_llm_of_type(model_name, 'llama')) 
    {
        response = await query_llama_llm(prompt, instruction, model_name, llm_functions, temperature, top_p);
    }
    else if (is_llm_of_type(model_name, 'gpt'))
    {
        response = await query_advanced_chatgpt(ctx, prompt, instruction, model_name, llm_functions, temperature, top_p);
    }
    else
    {
        throw new Error(`Model ${model_name} is not supported`);
    }

    return response;
}

async function query_advanced_chatgpt(ctx, prompt, instruction, model = GPT3_MODEL_SMALL, llm_functions = null, temperature = 0, top_p = 1)
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

function get_local_model_directory()
{
    const model_dir = path.join(process.cwd(), ".", LLM_MODELS_DIRECTORY);
    return model_dir;
}

const models = {};
async function query_llama_llm(prompt, instruction, model_name, llm_functions = null, temperature = 0, top_p = 1, numPredict = 512, numCtxTokens = 128)
{

    omnilog.warn(`Using model_name = ${model_name}`);
    //hack
    model_name = 'llama-2-7b-chat.ggmlv3.q4_K_S'; //TBD use passed model_name
    //hack
    let model = null;


    if (model_name in models) model = models[model_name];
    else
    {
        process.env.GPT4ALL_NODE_LIBRARY_PATH = path.join('extensions', 'omni-extension-document_processing', 'src', 'gpt4all');

        omnilog.warn(`LOADING NEW  MODEL: ${model_name}`);
        model = await loadModel(model_name, { verbose: true });
        models[model_name] = model;
    }

    const response = await createCompletion(model, [
        { role: 'system', content: instruction },
        { role: 'user', content: prompt }
    ]);
    omnilog.warn(`response = ${JSON.stringify(response)}`);
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
        omnilog.warn(`result = ${JSON.stringify(result)}`);
    }
    return result;

}


async function get_local_llm_choices(choices) 
{

    omnilog.warn(`BEFORE: choices = ${JSON.stringify(choices)}`);

    let filePaths = [];
    const model_dir = get_local_model_directory();
    omnilog.warn(`model_dir = ${model_dir}`);
    // adding llama-based local llms
    filePaths = await walkDirForExtension(filePaths, model_dir, 'llama', '.bin');

    for (const filepath of filePaths)
    {
        const file = path.basename(filepath);
        const jsonPath = filepath.replace('.bin', '.json');
        let title, description;

        if (await validateFileExists(jsonPath)) 
        {
            const jsonContent = await read_json_file(jsonPath);
            title = jsonContent.title ?? deduce_llm_title(file);;
            description = jsonContent.description ?? deduce_llm_description(file);
        }
        else 
        {
            title = deduce_llm_title(file);
            description = deduce_llm_description(file);
        }

        choices.push({ value: file, title: title, description: description });
    }

    omnilog.warn(`AFTER choices = ${JSON.stringify(choices)}`);

    return choices;
}

function deduce_llm_title(file)
{
    const title = file.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return title;
}

function deduce_llm_description(file)
{
    const description = file.substring(0, file.length - 4); // remove ".bin"
    return description;
}

async function get_llm_choices()
{
    let llm_choices = [
        { value: GPT3_MODEL_SMALL, title: "chatGPT 3 (4k)", description: "gpt 3.5 with ~ 3,000 words context" },
        { value: GPT3_MODEL_LARGE, title: "chatGPT 3 (16k)", description: "gpt 3.5 with ~ 12,000 words context" },
        { value: GPT4_MODEL_SMALL, title: "chatGPT 4 (8k)", description: "gpt 4 with ~ 6,000 words context" },
        { value: GPT4_MODEL_LARGE, title: "chatGPT 4 (32k)", description: "chat GPT 4 with ~ 24,000 words context" },
    ];


    llm_choices = await get_local_llm_choices(llm_choices);

    omnilog.warn(`FINAL llm_choices = ${JSON.stringify(llm_choices)}`);

    return llm_choices;
}

const { existsSync } = require("fs");
const { LLModel } = require("node-gyp-build")(path.resolve(__dirname, ".."));
const {
    retrieveModel,
    downloadModel,
    appendBinSuffixIfMissing,
} = require("../gpt4all/util.js");

const {
    DEFAULT_DIRECTORY,
    DEFAULT_LIBRARIES_DIRECTORY,
    DEFAULT_PROMPT_CONTEXT,
    DEFAULT_MODEL_CONFIG,
    DEFAULT_MODEL_LIST_URL,
} = require("../gpt4all/config.js");
const { InferenceModel, EmbeddingModel } = require("../gpt4all/models.js");

/**
 * Loads a machine learning model with the specified name. The defacto way to create a model.
 * By default this will download a model from the official GPT4ALL website, if a model is not present at given path.
 *
 * @param {string} modelName - The name of the model to load.
 * @param {LoadModelOptions|undefined} [options] - (Optional) Additional options for loading the model.
 * @returns {Promise<InferenceModel | EmbeddingModel>} A promise that resolves to an instance of the loaded LLModel.
 */
async function loadModel(modelName, options = {})
{
    const loadOptions = {
        modelPath: DEFAULT_DIRECTORY,
        librariesPath: DEFAULT_LIBRARIES_DIRECTORY,
        type: "inference",
        allowDownload: true,
        verbose: true,
        ...options,
    };

    console.warn(`librariesPath = ${DEFAULT_LIBRARIES_DIRECTORY}`)
    const modelConfig = await retrieveModel(modelName, {
        modelPath: loadOptions.modelPath,
        modelConfigFile: loadOptions.modelConfigFile,
        allowDownload: loadOptions.allowDownload,
        verbose: loadOptions.verbose,
    });

    const libSearchPaths = loadOptions.librariesPath.split(";");
    console.warn(`libSearchPaths = ${libSearchPaths}, ${JSON.stringify(libSearchPaths)}`)

    let libPath = null;

    for (const searchPath of libSearchPaths)
    {
        if (existsSync(searchPath))
        {
            libPath = searchPath;
            console.warn(`found libPath = ${libPath}`)
            break;
        }
        else
        {
            console.warn(`Rejecting: ${searchPath} as it does not exist`);
        }
    }

    console.warn(`libSearchPaths = ${libSearchPaths}, ${JSON.stringify(libSearchPaths)}`)

    /*
    // HACK
    const binDir = path.resolve(process.cwd(), 'extensions', 'omni-extension-document_processing', 'src', 'gpt4all');
    libPath = binDir;
    console.warn(`HACKING to ${binDir}`)
    */
    
    if (!libPath)
    {
        throw Error("Could not find a valid path from " + libSearchPaths);
    }
    const llmOptions = {
        model_name: appendBinSuffixIfMissing(modelName),
        model_path: loadOptions.modelPath,
        library_path: libPath,
    };

    if (loadOptions.verbose)
    {
        console.debug("Creating LLModel with options:", llmOptions);
    }
    const llmodel = new LLModel(llmOptions);

    if (loadOptions.type === "embedding")
    {
        return new EmbeddingModel(llmodel, modelConfig);
    } else if (loadOptions.type === "inference")
    {
        return new InferenceModel(llmodel, modelConfig);
    } else
    {
        throw Error("Invalid model type: " + loadOptions.type);
    }
}


export { query_llm, runChatGPTBlock, get_model_max_size, adjust_model, get_llm_choices };
export { DEFAULT_GPT_MODEL, GPT4_SIZE_MAX }
//export { DEFAULT_TEMPERATURE , DEFAULT_TOP_P }
