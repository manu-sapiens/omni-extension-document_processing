//@ts-check
//llms.js
import { getModelNameAndProviderFromId, isProviderAvailable, DEFAULT_UNKNOWN_CONTEXT_SIZE } from './llm.js';
import { Llm_Openai } from './llm_Openai.js'
import { Llm_LmStudio } from './llm_LmStudio.js'
import { Llm_Oobabooga } from './llm_Oobabooga.js'
export const DEFAULT_LLM_MODEL_ID = 'gpt-3.5-turbo|openai'

const llm_model_types = {};
const llm_context_sizes = {};

const providers = []
const llm_Openai = new Llm_Openai();
providers.push(llm_Openai)

if (await isProviderAvailable('oobabooga')) providers.push(new Llm_Oobabooga()); 
if (await isProviderAvailable('lm-studio')) providers.push(new Llm_LmStudio()); 
// TBD: this does not scale as we would need to edit this script whenever a new provider is added

export async function getLlmChoices()
{
    let choices = [];

    for (const provider of providers) 
    {
        await provider.getModelChoicesFromDisk(choices, llm_model_types, llm_context_sizes);
    }
   
    return choices;
}

export async function queryLlm(ctx, prompt, instruction, model_id= DEFAULT_LLM_MODEL_ID, temperature = 0, args=null)
{
    const splits = getModelNameAndProviderFromId(model_id);
    const model_name = splits.model_name;
    const model_provider = splits.model_provider;

    for (const provider of providers) 
    {
        if (model_provider == provider.getProvider())
        {
            const response = await provider.query(ctx, prompt, instruction, model_name, temperature, args);
            return response;
        }
    }

    throw new Error(`Unknown model provider: ${model_provider} with model: ${model_name}`);
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