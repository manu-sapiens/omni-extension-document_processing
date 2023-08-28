//@ts-check
// component_GptIxP.ts
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { omnilog } from 'mercs_shared'
import { setComponentInputs, setComponentOutputs, setComponentControls } from './utils/component.js';
import { is_valid, parse_text_to_array } from './utils/utils.js';
import { queryLlm, getLlmChoices, DEFAULT_LLM_MODEL_ID } from './utils/llms.js';
const NS_ONMI = 'document_processing';

async function async_getGptIxPComponent()
{
    let component = OAIBaseComponent
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
    const llm_choices  = await getLlmChoices();
    const inputs = [
        { name: 'instruction', title: 'instruction', type: 'string', description: 'Instruction(s)', defaultValue: 'You are a helpful bot answering the user with their question to the best of your abilities', customSocket: 'text' },
        { name: 'prompt', title: 'prompt', type: 'string', customSocket: 'text', description: 'Prompt(s)' },
        { name: 'llm_functions', title: 'functions', type: 'array', customSocket: 'objectArray', description: 'Optional functions to constrain the LLM output' },
        { name: 'temperature', title: 'temperature', type: 'number', defaultValue: 0 },
        { name: 'top_p', title: 'top_p', type: 'number', defaultValue: 1 },
        { name: 'model_id', title: 'model', type: 'string', defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices},
    ];
    component = setComponentInputs(component, inputs);

    // Adding control(s)
    const controls = [
        { name: "llm_functions", title: "LLM Functions", placeholder: "AlpineCodeMirrorComponent", description: "Functions to constrain the output of the LLM" },
    ];
    component = setComponentControls(component, controls);

    // Adding outpu(t)
    const outputs = [
        { name: 'answers_text', type: 'string', customSocket: 'text', description: 'combined answers', title: 'Combined answers' },
        { name: 'answers_json', type: 'object', customSocket: 'object', description: 'Answers as a JSON', title:'JSON answers'}];
    component = setComponentOutputs(component, outputs);


    // Adding _exec function
    component.setMacro(OmniComponentMacroTypes.EXEC, parsePayload);

    return component.toJSON();
}


async function parsePayload(payload, ctx) {

    if (!payload) return { result: { "ok": false }, answers_text: "", answers_json: null};
    
    const instruction = payload.instruction;
    const prompt = payload.prompt;
    const llm_functions = payload.llm_functions;
    const temperature = payload.temperature;
    const top_p = payload.top_p;
    const model_id = payload.model_id;

    const answers_json = await gptIxP(ctx, instruction, prompt, llm_functions, model_id, temperature, top_p);
    if (!answers_json) return { result: { "ok": false }, answers_text: "", answers_json: null };
    
    const return_value = { result: { "ok": true }, answers_text: answers_json["combined_answers"], answers_json: answers_json};
    return return_value;
}

async function gptIxP(ctx, instruction, prompt, llm_functions = null, model_id = DEFAULT_LLM_MODEL_ID, temperature = 0, top_p = 1) {
    console.time("advanced_llm_component_processTime");

    const instructions = parse_text_to_array(instruction);
    const prompts = parse_text_to_array(prompt);

    if (!instructions || !prompts) return null;

    const answers_json = {};
    let answer_string = "";
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        for (let p = 0; p < prompts.length; p++) {
            let id = "answer";
            if (instructions.length > 1) id += `_i${i + 1}`;
            if (prompts.length > 1) id += `_p${p + 1}`;

            const prompt = prompts[p];

            omnilog.log(`instruction = ${instruction}, prompt = ${prompt}, id = ${id}`);

            const query_args = {function: llm_functions, top_p : top_p}
            const answer_object = await queryLlm(ctx, prompt, instruction, model_id, temperature, query_args);
            if (!answer_object) continue;
            if (is_valid(answer_object) == false) continue;

            const answer_text = answer_object.answer;
            const answer_fa = answer_object.args?.function_arguments;
            const answer_fa_string = answer_object.args?.function_arguments_string;

            if (is_valid(answer_text)) {
                answers_json[id] = answer_text;
                answer_string += answer_text + "\n";
            }
            else {
                answers_json[id] = answer_fa;
                answer_string += answer_fa_string + "\n";
            }
        }
    }
    answers_json["combined_answers"] = answer_string;

    console.timeEnd("advanced_llm_component_processTime");
    return answers_json;
}

export { async_getGptIxPComponent, gptIxP };
