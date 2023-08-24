//@ts-check
//llms.js
import { splitModelNameFromProvider, DEFAULT_UNKNOWN_CONTEXT_SIZE } from './llm.js';
import {LLM_PROVIDER_OPENAI_SERVER, addLlmChoicesOpenai, queryOpenaiLlm} from './llmOpenai.js'
import {LLM_PROVIDER_OOBABOOGA_LOCAL, queryOobaboogaLlm, addLlmChoicesOobabooga} from './llmOobabooga.js'
import {LLM_PROVIDER_LM_STUDIO_LOCAL, queryLmStudioLlm, addLlmChoicesLmStudio} from './llmLmStudio.js'

export const DEFAULT_LLM_MODEL = 'gpt-3.5-turbo-16k|openai'

const llm_model_types = {};
const llm_context_sizes = {};

export async function getLlmChoices()
{
    let choices = [];
    await addLlmChoicesOpenai(choices, llm_model_types, llm_context_sizes);
    await addLlmChoicesOobabooga(choices, llm_model_types, llm_context_sizes);
    await addLlmChoicesLmStudio(choices, llm_model_types,llm_context_sizes);
   
    return choices;
}

export async function queryLlm(ctx, prompt, instruction, combined= DEFAULT_LLM_MODEL, temperature = 0, llm_functions = null, top_p = 1)
{
    let response = null;
    const splits = splitModelNameFromProvider(combined);
    const model_name = splits.model_name;
    const model_provider = splits.model_provider;

    if (model_provider == LLM_PROVIDER_OPENAI_SERVER)
    {
        response = await queryOpenaiLlm(ctx, prompt, instruction, model_name, llm_functions, temperature, top_p);
    }
    else if (model_provider == LLM_PROVIDER_OOBABOOGA_LOCAL)
    {
        const prompt_and_instructions = `${instruction}\n\n${prompt}`;
        response = await queryOobaboogaLlm(ctx, prompt_and_instructions, model_name, temperature);
    }
    else if (model_provider == LLM_PROVIDER_LM_STUDIO_LOCAL)
    {
        response = await queryLmStudioLlm(ctx, prompt, instruction, temperature);
    }
    return response;
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