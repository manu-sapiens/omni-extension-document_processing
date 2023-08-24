//@ts-check
//llmLmStudio.js

import { runBlock } from './blocks.js';
import { console_log } from './utils.js';
import {combineModelNameAndProvider, getModelsDirJson, DEFAULT_UNKNOWN_CONTEXT_SIZE} from './llm.js'
import { validateDirectoryExists } from './files.js';


export const LLM_PROVIDER_LM_STUDIO_LOCAL = "lm-studio"
export const LLM_MODEL_TYPE_LM_STUDIO = "lm-studio"
const BLOCK_LM_STUDIO_SIMPLE_CHATGPT = "lm-studio.simpleGenerateTextViaLmStudio";

const ICON_LM_STUDIO = '🖥';
const DEFAULT_MODEL_NAME_LM_STUDIO = 'loaded_model'

//
// ------ lm-studio -----------------------------------------------------------
//

export async function addLlmChoicesLmStudio(choices, llm_model_types, llm_context_sizes)
{

    const models_dir_json = await getModelsDirJson()
    if (!models_dir_json) return;

    const provider_model_dir = models_dir_json[LLM_PROVIDER_LM_STUDIO_LOCAL];
    if (!provider_model_dir) return;

    const dir_exists = await validateDirectoryExists(provider_model_dir)
    if (!dir_exists) return;

    choices.push({ value: combineModelNameAndProvider(DEFAULT_MODEL_NAME_LM_STUDIO, LLM_PROVIDER_LM_STUDIO_LOCAL), title: ICON_LM_STUDIO+ 'model currently loaded in (LM-Studio)', description: "Use the model currently loaded in LM-Studio if that model's server is running." });
    llm_model_types[DEFAULT_MODEL_NAME_LM_STUDIO] = LLM_MODEL_TYPE_LM_STUDIO
    llm_context_sizes[DEFAULT_MODEL_NAME_LM_STUDIO] = DEFAULT_UNKNOWN_CONTEXT_SIZE

    return;
}

export async function queryLmStudioLlm(ctx, prompt, instruction, temperature = 0.3)
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

    return return_value;

}