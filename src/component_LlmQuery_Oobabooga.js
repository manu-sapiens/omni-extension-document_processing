//@ts-check
import { createComponent } from './utils/component.js';
import { DEFAULT_LLM_MODEL_ID,  } from './utils/llms.js';
import { getModelNameAndProviderFromId, isProviderAvailable, DEFAULT_UNKNOWN_CONTEXT_SIZE } from './utils/llm.js';
import { Llm_Oobabooga } from './utils/llm_Oobabooga.js'
const MODEL_PROVIDER = 'oobabooga';
const llm = new Llm_Oobabooga();

const inputs = [
    { name: 'instruction', type: 'string', description: 'Instruction(s)', defaultValue: 'You are a helpful bot answering the user with their question to the best of your abilities', customSocket: 'text' },
    { name: 'prompt', type: 'string', customSocket: 'text', description: 'Prompt(s)' },
    { name: 'temperature', type: 'number', defaultValue: 0.7, description: "The randomness regulator, higher for more creativity, lower for more structured, predictable text.", minimum: 0.0, maximum: 2.0, step: 0.01},
    { name: 'model_id', type: 'string', customSocket: 'text'},
    { name: 'args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},
];
const outputs = [
    { name: 'answer_text', type: 'string', customSocket: 'text', description: 'The answer to the query', title: "Answer"},
    { name: 'answer_json', type: 'object', customSocket: 'object', description: 'The answer in json format, with possibly extra arguments returned by the LLM', title: 'Json' },
]

const controls = null;//[{ name: "temperature", placeholder: "AlpineNumWithSliderComponent" },];

const links = {}
let LlmQueryComponent_Oobabooga = createComponent(MODEL_PROVIDER, 'llm_query','LLM Query: Oobabooga', 'Text Manipulation','Query a LLM with Oobabooga', 'Query the specified LLM via Oobabooga', links, inputs, outputs, controls, parsePayload );



async function parsePayload(payload, ctx) 
{
    const failure = { result: { "ok": false }, answer_text: "", answer_json: null, model_id: null};

    if (!payload) return failure;
    
    const instruction = payload.instruction;
    const prompt = payload.prompt;
    const temperature = payload.temperature;
    const model_id = payload.model_id;
    const json = payload.args;

    const splits = getModelNameAndProviderFromId(model_id);
    const model_name = splits.model_name;
    const model_provider = splits.model_provider;
    if (model_provider != MODEL_PROVIDER) throw new Error(`ERROR: model_provider != ${MODEL_PROVIDER}`);

    const response = await llmQuery_oobabooga(ctx, instruction, prompt, model_name, temperature, json);
    if (!response) return failure;
    
    const answer_text = response.answer;
    const answer_json = response.json;

    const return_value = { result: { "ok": true }, answer_text: answer_text, answer_json: answer_json};
    return return_value;
}

async function llmQuery_oobabooga(ctx, instruction, prompt, model_name, temperature = 0, json = null) 
{
    console.time("advanced_llm_component_processTime");

    if (!prompt) return null;

    const response = await llm.query(ctx, prompt, instruction, model_name, temperature, json);
    if (!response) return null

    return response;
}

export { LlmQueryComponent_Oobabooga, llmQuery_oobabooga };
