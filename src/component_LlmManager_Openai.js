//@ts-check
import { createComponent } from './utils/component.js';
import { DEFAULT_LLM_MODEL_ID } from './utils/llms.js';
import { Llm_Openai } from './utils/llm_Openai.js'
const NS_ONMI = 'document_processing';

export async function async_getLlmManagerOpenaiComponent()
{
    const llm = new Llm_Openai();
    const choices = [];
    const llm_model_types = {};
    const llm_context_sizes = {};
    await llm.getModelChoices(choices, llm_model_types, llm_context_sizes);

    const inputs = [
        { name: 'model_id', type: 'string', customSocket: 'text', defaultValue: DEFAULT_LLM_MODEL_ID, choices: choices},
        { name: 'functions', title: 'functions', type: 'array', customSocket: 'objectArray', description: 'Optional functions to constrain the LLM output' },
        { name: 'args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},
    ];
    const outputs = [
        { name: 'model_id', title: 'string', customSocket: 'text', description: "The ID of the selected LLM model"}
    ]
    const controls = [
        { name: "functions", title: "LLM Functions", placeholder: "AlpineCodeMirrorComponent", description: "Functions to constrain the output of the LLM" },
    ];
    const links = {}

    let component = createComponent(NS_ONMI, 'llm_manager_openai','LLM Manager: OpenAI', 'Text Manipulation','Manage LLMs from a provider: openai', 'Manage LLMs from a provider: openai', links, inputs, outputs, controls, parsePayload );

    return component;
}


async function parsePayload(payload, ctx) 
{
    const failure = { result: { "ok": false }, model_id: null};

    if (!payload) return failure;
    
    const model_id = payload.model_id;
    const return_value = { result: { "ok": true }, model_id: model_id};
    return return_value;
}