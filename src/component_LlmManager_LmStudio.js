//@ts-check
import { createComponent } from './omni-utils/component.js';
const NS_ONMI = 'document_processing';

const inputs = [
    { name: 'read_me', type: 'string', customSocket: 'text', defaultValue: "1) Run LM Studio\n2) <-> : [Start Server]"},
    { name: `max_token`, type: 'number', defaultValue: -1, minimum: -1, maximum: 32768, step:1, description: "The maximum number of tokens to generate. -1: not specified"},
    { name: 'args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},

];
const outputs = [
    { name: 'model_id', type: 'string', customSocket: 'text', description: "The ID of the selected LLM model"},
    { name: 'args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},
]
const controls = null;
const links = {}

const LlmManagerLmStudioComponent = createComponent(NS_ONMI, 'llm_manager_lm-studio','LLM Manager: LM Studio', 'Text Manipulation','Manage LLMs from a provider: LM Studio', 'Manage LLMs from a provider: LM Studio', links, inputs, outputs, controls, parsePayload );

async function parsePayload(payload, ctx) 
{
    const args = payload.args || {};
    const max_token = payload.max_token || -1;
    
    args.stream = false; // Streaming not supported yet
    args.max_token = max_token;

    return  { result: { "ok": true }, model_id: 'currently_loaded_model_in_lm-studio|lm-studio', args: args};
}

export { LlmManagerLmStudioComponent }