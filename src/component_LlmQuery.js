//@ts-check
// component_LlmQuery.ts
import { createComponent } from './utils/component.js';
import { queryLlmByModelId, DEFAULT_LLM_MODEL_ID } from './utils/llms.js';
const NS_ONMI = 'document_processing';

async function async_getLlmQueryComponent()
{

    const inputs = [
        { name: 'instruction', type: 'string', description: 'Instruction(s)', defaultValue: 'You are a helpful bot answering the user with their question to the best of your abilities', customSocket: 'text' },
        { name: 'prompt', type: 'string', customSocket: 'text', description: 'Prompt(s)' },
        { name: 'temperature', type: 'number', defaultValue: 0.07, description: "The randomness regulator, higher for more creativity, lower for more structured, predictable text.", minimum: 0, maximum: 2, step: 0.01},
        { name: 'model_id', type: 'string', customSocket: 'text', defaultValue: DEFAULT_LLM_MODEL_ID},
        { name: 'args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},
    ];
    const outputs = [
        { name: 'answer_text', type: 'string', customSocket: 'text', description: 'The answer to the query', title: "Answer"},
        { name: 'answer_json', type: 'object', customSocket: 'object', description: 'The answer in json format, with possibly extra arguments returned by the LLM', title: 'Json' },
        { name: 'model_id', type: 'string', customSocket: 'text', description: "The ID of the LLM model used"}
    ]
    
    const controls = null;
    //[
        // { name: "temperature", placeholder: "AlpineNumWithSliderComponent" },];
        // { name: "args", title: "Extra args", placeholder: "AlpineCodeMirrorComponent", description: "Extra Args passed to the LLM model" },
    //];

    const links = {}

    let component = createComponent(NS_ONMI, 'llm_query','LLM Query', 'Text Manipulation','Query a LLM', 'Query the specified LLM', links, inputs, outputs, controls, parsePayload );

    return component;
}


async function parsePayload(payload, ctx) 
{
    const failure = { result: { "ok": false }, answer_text: "", answer_json: null, model_id: ""};

    if (!payload) return failure;
    
    const instruction = payload.instruction;
    const prompt = payload.prompt;
    const temperature = payload.temperature;
    const model_id = payload.model_id;
    const args = payload.args;

    const response = await universalLlmQuery(ctx, instruction, prompt, model_id, temperature, args);
    if (!response) return failure;
    
    const answer_text = response.answer;
    const answer_json = response.json;

    debugger;

    const return_value = { result: { "ok": true }, answer_text: answer_text, answer_json: answer_json, model_id: model_id};
    return return_value;
}

async function universalLlmQuery(ctx, instruction, prompt, model_id = DEFAULT_LLM_MODEL_ID, temperature = 0, args = null) 
{
    console.time("advanced_llm_component_processTime");

    if (!prompt) return null;
   
    const response = await queryLlmByModelId(ctx, prompt, instruction, model_id, temperature, args);
    if (!response) return null


    return response;
}

export { async_getLlmQueryComponent, universalLlmQuery };
