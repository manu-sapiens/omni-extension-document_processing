//@ts-check
//llms.js
import { getModelNameAndProviderFromId, isProviderAvailable, DEFAULT_UNKNOWN_CONTEXT_SIZE } from './llm.js';
import { Llm_Openai } from './llm_Openai.js'
import { runBlock } from './blocks.js';
import { omnilog } from 'mercs_shared'
//import { Llm_LmStudio } from './llm_LmStudio.js'
//import { Llm_Oobabooga } from './llm_Oobabooga.js'
export const DEFAULT_LLM_MODEL_ID = 'gpt-3.5-turbo|openai'

const llm_model_types = {};
const llm_context_sizes = {};

const providers = []
const llm_Openai = new Llm_Openai();
providers.push(llm_Openai)

let extraProvidersProcessed = false;

/*
async function processExtraProviders()
{
    if (extraProvidersProcessed == false)
    {
        // TBD: this does not scale as we would need to edit this script whenever a new provider is added
        if (await isProviderAvailable('oobabooga')) providers.push(new Llm_Oobabooga()); 
        if (await isProviderAvailable('lm-studio')) providers.push(new Llm_LmStudio()); 
        extraProvidersProcessed = true;
    }
}
*/

export async function getLlmChoices()
{
    //await processExtraProviders();

    let choices = [];
    for (const provider of providers) 
    {
        await provider.getModelChoices(choices, llm_model_types, llm_context_sizes);
    }
   
    return choices;
}

/**
 * @param {any} ctx
 * @param {any} prompt
 * @param {any} instruction
 * @param {any} model_id
 * @param {number} [temperature=0]
 * @param {any} [args=null]
 * @returns {Promise<{ answer: string; json: { function_arguments_string?: any; function_arguments?: any; total_tokens?: number; answer: string } | null; }>}
 */
export async function queryLlmByModelId(ctx, prompt, instruction, model_id, temperature = 0, args=null)
{
    const splits = getModelNameAndProviderFromId(model_id);
    //const model_name = splits.model_name;
    const model_provider = splits.model_provider;

    const blockName = `omni-extension-document_processing:${model_provider}.llm_query`;
    const blockArgs = { prompt, instruction, model_id, temperature, args };
    const response = await runBlock(ctx, blockName, blockArgs);
    debugger;

    omnilog.warn(`queryLlmByModelId: response = ${JSON.stringify(response)}`);
    const answer = response?.answer_text || "";
    const json = response?.answer_json || null;
    if (answer == "") throw new Error("Empty text result returned from oobabooga. Did you load a model in oobabooga?");
    const return_value = {answer: answer, json: json};
    return return_value;

}

export function getModelMaxSize(model_name, use_a_margin = true)
{
    const context_size = getModelContextSize(model_name)
    if (use_a_margin == false) return context_size

    const safe_size = Math.floor(context_size * 0.9);
    return safe_size;
}

function getModelContextSize(model_name)
{
    if (model_name in llm_context_sizes == false) return DEFAULT_UNKNOWN_CONTEXT_SIZE;
    
    const context_size = llm_context_sizes[model_name];
    return context_size;
}