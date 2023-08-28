//@ts-check
// component_LlmQuery.ts
import { createComponent } from './utils/component.js';
import { queryLlm, DEFAULT_LLM_MODEL_ID } from './utils/llms.js';
const NS_ONMI = 'document_processing';

async function async_getLlmQueryComponent()
{

    const inputs = [
        { name: 'instruction', type: 'string', description: 'Instruction(s)', defaultValue: 'You are a helpful bot answering the user with their question to the best of your abilities', customSocket: 'text' },
        { name: 'prompt', type: 'string', customSocket: 'text', description: 'Prompt(s)' },
        { name: 'temperature', type: 'number', defaultValue: 0.7, description: "The randomness regulator, higher for more creativity, lower for more structured, predictable text.", minimum: 0, maximum: 2, step: 0.01},
        { name: 'model_id', type: 'string', customSocket: 'text', defaultValue: DEFAULT_LLM_MODEL_ID},
        { name: 'args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},
    ];
    const outputs = [
        { name: 'answer_text', type: 'string', customSocket: 'text', description: 'The answer to the query', title: "Answer"},
        { name: 'answer_args', type: 'object', customSocket: 'object', description: 'Extra arguments returned by the LLM', title: 'Args' },
        { name: 'model_id', type: 'string', customSocket: 'text', description: "The ID of the LLM model used"}
    ]
    
    const controls = [
        { name: "temperature", placeholder: "AlpineNumWithSliderComponent" },
    ];

    const links = {}

    let component = createComponent(NS_ONMI, 'llm_query','LLM Query', 'Text Manipulation','Query a LLM', 'Query the specified LLM', links, inputs, outputs, controls, parsePayload );

    return component;
}


async function parsePayload(payload, ctx) 
{
    const failure = { result: { "ok": false }, answer_text: "", answer_args: null, model_id: null};

    if (!payload) return failure;
    
    const instruction = payload.instruction;
    const prompt = payload.prompt;
    const temperature = payload.temperature;
    const model_id = payload.model_id;
    const args = payload.args;

    const response = await llmQuery(ctx, instruction, prompt, model_id, temperature, args);
    if (!response) return failure;
    
    const answer_text = response.answer;
    const answer_args = response.args;

    const return_value = { result: { "ok": true }, answer_text: answer_text, answer_args: answer_args, model_id: model_id};
    return return_value;
}

async function llmQuery(ctx, instruction, prompt, model_id = DEFAULT_LLM_MODEL_ID, temperature = 0, args = null) 
{
    console.time("advanced_llm_component_processTime");

    if (!prompt) return null;
   
    const response = await queryLlm(ctx, prompt, instruction, model_id, temperature, args);
    if (!response) return null


    return response;
}

export { async_getLlmQueryComponent, llmQuery };
