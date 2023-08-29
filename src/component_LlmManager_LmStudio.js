//@ts-check
import { createComponent } from './utils/component.js';
const NS_ONMI = 'document_processing';

const inputs = [
    { name: 'read_me', type: 'string', customSocket: 'text', defaultValue: "Please ensure that in LM Studio, in the <-> menu, you have pressed the [Start Server] button"},
    { name: 'max_token', type: 'number', defaultValue: -1, description: "The number of tokens to return. -1 == no limit"},
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
    const args = payload.args;
    const block_args = {...args}
    if (payload.max_token) block_args['max_token'] = payload.max_token;
    block_args['stream'] = false;

    return  { result: { "ok": true }, model_id: 'currently_loaded_model_in_lm-studio|lm-studio', args: block_args};
}

export { LlmManagerLmStudioComponent }