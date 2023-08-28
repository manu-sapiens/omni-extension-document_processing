//@ts-check
import { createComponent } from './utils/component.js';
import { DEFAULT_LLM_MODEL_ID } from './utils/llms.js';
import { getModelNameAndProviderFromId, isProviderAvailable, DEFAULT_UNKNOWN_CONTEXT_SIZE } from './utils/llm.js';
import { Llm_Oobabooga } from './utils/llm_Oobabooga.js'
const NS_ONMI = 'document_processing';

const llm = new Llm_Oobabooga();

export async function async_getLlmManagerOobaboogaComponent()
{
    const choices = [];
    const llm_model_types = {};
    const llm_context_sizes = {};
    await llm.getModelChoices(choices, llm_model_types, llm_context_sizes);

    const inputs = [
        { name: 'model_id', type: 'string', customSocket: 'text', defaultValue: DEFAULT_LLM_MODEL_ID, choices: choices},
        { name: 'use_gpu', type: 'boolean', defaultValue: false},
        { name: 'seed', type: 'number', defaultValue: "-1", description: "A number used to determine the initial noise distribution for the text generation process. Different seed values will create unique text results. The special value, -1, will generate a random seed instead."},
        { name: 'negative_prompt', type: 'string', customSocket: 'text', description: "A text description that guides the text generation process, but with a negative connotation."},
        { name: `max_new_tokens`, type: 'number', defaultValue: 2000, description: "The maximum number of tokens to generate."},
    ];
    const outputs = [
        { name: 'model_id', title: 'string', customSocket: 'text', description: "The ID of the selected LLM model"}
    ]
    const controls = null;
    const links = {}

    let component = createComponent(NS_ONMI, 'llm_manager_oobabooga','LLM Manager: Oobabooga', 'Text Manipulation','Manage LLMs from a provider: Oobabooga', 'Manage LLMs from a provider: Oobabooga', links, inputs, outputs, controls, parsePayload );

    return component;
}


async function parsePayload(payload, ctx) 
{
    const failure = { result: { "ok": false }, model_id: null};

    if (!payload) return failure;
    
    const model_id = payload.model_id;
    const use_gpu = payload.use_gpu;
    const seed = payload.seed;
    const negative_prompt = payload.negative_prompt;
    const max_new_tokens = payload.max_new_tokens;

    const splits = getModelNameAndProviderFromId(model_id);
    const model_name = splits.model_name;
    const model_provider = splits.model_provider;

    const loading_args = {}
    if (use_gpu) loading_args.use_gpu = use_gpu;
    if (seed) loading_args.seed = seed;
    if (negative_prompt) loading_args.negative_prompt = negative_prompt;
    if (max_new_tokens) loading_args.max_new_tokens = max_new_tokens;

    let model_info = await llm.loadModelIfNeeded(ctx, model_name, loading_args);

    const return_value = { result: { "ok": true }, model_id: model_id};
    return return_value;
}
