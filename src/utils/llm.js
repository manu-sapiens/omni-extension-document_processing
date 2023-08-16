// llm.js

import { is_valid, console_log, clean_string, pauseForSeconds } from './utils.js';
import { runBlock } from './blocks.js';
import { count_tokens_in_text } from './tiktoken.js';


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

//const DEFAULT_TEMPERATURE = 0.0;
//const DEFAULT_TOP_P = 1.0;


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

function get_model_max_size(model)
{
    if (model == GPT3_MODEL_SMALL) return GPT3_SIZE_CUTOFF;
    if (model == GPT3_MODEL_LARGE) return GPT3_SIZE_MAX;
    if (model == GPT4_MODEL_SMALL) return GPT4_SIZE_CUTOFF;
    if (model == GPT4_MODEL_LARGE) return GPT4_SIZE_MAX;

    throw new Error(`get_model_max_size: Unknown model: ${model}`);

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


export {query_advanced_chatgpt, runChatGPTBlock, get_model_max_size, adjust_model}
export { DEFAULT_GPT_MODEL, GPT4_SIZE_MAX }
//export { DEFAULT_TEMPERATURE , DEFAULT_TOP_P }
