// AdvancedLLMComponent.ts
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { setComponentInputs, setComponentOutputs, setComponentControls } from './components_lib.js';
const NS_ONMI = 'document_processing';

import { save_json_to_cdn, } from './cdn.js';
import { is_valid, console_log, parse_text_to_array } from './utils.js';
import { count_tokens_in_text } from './tiktoken.js';
import { query_advanced_chatgpt, adjust_model } from './llm.js';
import { DEFAULT_GPT_MODEL, GPT4_SIZE_MAX } from './llm.js';

let gpt_IxP_component = OAIBaseComponent
    .create(NS_ONMI, "gpt_ixp")
    .fromScratch()
    .set('title', 'GPT IxP')
    .set('category', 'Text Manipulation')
    .set('description', 'Run GPT on every combination of instruction(s) and prompt(s)')
    .setMethod('X-CUSTOM')
    .setMeta({
        source: {
            summary: "Run GPT on every combination of instruction(s) and prompt(s)",
            links: {
            },
        }
    });
    
// Adding input(s)
const inputs = [
    { name: 'instruction', type: 'string', description: 'Instruction(s)', defaultValue: 'You are a helpful bot answering the user with their question to the best of your abilities', customSocket: 'text' },
    { name: 'prompt', type: 'string', customSocket: 'text', description: 'Prompt(s)' },
    { name: 'llm_functions', type: 'array', customSocket: 'objectArray', description: 'Optional functions to constrain the LLM output' },
    { name: 'temperature', type: 'number', defaultValue: 0 },
    { name: 'top_p', type: 'number', defaultValue: 1 },
    { name: 'model', type: 'string', enum: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k'], defaultValue: 'gpt-3.5-turbo-16k' },
];
gpt_IxP_component = setComponentInputs(gpt_IxP_component, inputs);

// Adding control(s)
const controls = [
    { name: "llm_functions", title: "LLM Functions", placeholder: "AlpineCodeMirrorComponent", description: "Functions to constrain the output of the LLM" },
];
gpt_IxP_component = setComponentControls(gpt_IxP_component, controls);

// Adding outpu(t)
const outputs = [
    { name: 'text', type: 'string', customSocket: 'text', description: 'Result Text', title: 'Result Text' },
    { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'documents containing the answers' },
    { name: 'answers', type: 'object', customSocket: 'object', description: 'Answers JSON' },];
gpt_IxP_component = setComponentOutputs(gpt_IxP_component, outputs);


// Adding _exec function
gpt_IxP_component.setMacro(OmniComponentMacroTypes.EXEC, gpt_IxP_parse);

async function gpt_IxP_parse(payload, ctx) {
    console_log(`[AdvancedLLMComponent]: payload = ${JSON.stringify(payload)}`);

    const instruction = payload.instruction;
    const prompt = payload.prompt;
    const llm_functions = payload.llm_functions;
    const temperature = payload.temperature;
    const top_p = payload.top_p;
    const model = payload.model;

    const answers = await gpt_IxP_function(ctx, instruction, prompt, llm_functions, model, temperature, top_p);
    console_log(`[AdvancedLLMComponent]: answers = ${JSON.stringify(answers)}`);

    const return_value = { result: { "ok": true }, answers: answers, text: answers["text"], documents: [answers["document"]] };
    return return_value;
}

async function gpt_IxP_function(ctx, instruction, prompt, llm_functions = null, llm_model = DEFAULT_GPT_MODEL, temperature = 0, top_p = 1) {
    console.time("advanced_llm_component_processTime");

    console_log(`--------------------------------`);
    const instructions = parse_text_to_array(instruction);
    const prompts = parse_text_to_array(prompt);


    console_log('[advanced_llm_component] llm_functions = ' + JSON.stringify(llm_functions));

    let actual_token_cost = 0;
    const answers = {};
    let answer_string = "";
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let p = 0; p < prompts.length; p++) {
            let id = "answer";
            if (instructions.length > 1) id += `_i${i + 1}`;
            if (prompts.length > 1) id += `_p${p + 1}`;

            const prompt = prompts[p];

            console_log(`instruction = ${instruction}, prompt = ${prompt}, id = ${id}`);

            const token_cost = count_tokens_in_text(prompt);
            let model = adjust_model(token_cost, llm_model);

            if (token_cost > GPT4_SIZE_MAX) { console_log('WARNING: token cost > GPT4_SIZE_MAX'); }
            const answer_object = await query_advanced_chatgpt(ctx, prompt, instruction, model, llm_functions, temperature, top_p);
            if (is_valid(answer_object) == false) continue;

            const answer_text = answer_object.text;
            const answer_fa = answer_object.function_arguments;
            const answer_fa_string = answer_object.function_arguments_string;

            if (is_valid(answer_text)) {
                answers[id] = answer_text;
                answer_string += answer_text + "\n";
            }
            else {
                answers[id] = answer_fa;
                answer_string += answer_fa_string + "\n";
            }
            actual_token_cost += answer_object.total_tokens;
        }
    }
    answers["text"] = answer_string;


    const cdn_response = await save_json_to_cdn(ctx, answers);
    answers["document"] = cdn_response;
    answers["url"] = cdn_response.url;


    console.timeEnd("advanced_llm_component_processTime");
    return answers;
}

const GptIXPComponent = gpt_IxP_component.toJSON();
export { GptIXPComponent, gpt_IxP_function };
