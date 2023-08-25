//@ts-check
// component_LlmQuery.ts
import { Component } from './utils/components_lib.js';
import { DEFAULT_LLM_MODEL_ID } from './utils/llms.js';
import { Llm_Openai } from './utils/llm_Openai.js'
const NS_ONMI = 'document_processing';

async function async_getLlmManagerOpenaiComponent()
{
    const llm = new Llm_Openai();
    const choices = [];
    const llm_model_types = {};
    const llm_context_sizes = {};
    await llm.getModelChoicesFromDisk(choices, llm_model_types, llm_context_sizes);

    const inputs = [
        { name: 'model_id', type: 'string', customSocket: 'text', defaultValue: DEFAULT_LLM_MODEL_ID, choices: choices},
    ];
    const outputs = [
        { name: 'model_id', title: 'string', customSocket: 'text', description: "The ID of the selected LLM model"}
    ]
    const controls = null;

    let component = new Component(NS_ONMI, 'llm_manager_openai','LLM Manager: OpenAI', 'Text Manipulation','Manage LLMs from a provider: openai', 'Manage LLMs from a provider: openai', inputs, outputs, controls, parsePayload );

    return component.component;
}


async function parsePayload(payload, ctx) 
{
    const failure = { result: { "ok": false }, model_id: null};

    if (!payload) return failure;
    
    const model_id = payload.model_id;
    const return_value = { result: { "ok": true }, model_id: model_id};
    return return_value;
}

export { async_getLlmManagerOpenaiComponent };
