// AdvancedLLMComponent.js

import { save_json_to_cdn,  } from './cdn.js';
import { is_valid, console_log, parse_text_to_array } from './utils.js';
import { count_tokens_in_text } from './tiktoken.js';
import { query_advanced_chatgpt, adjust_model } from './llm.js';
import { DEFAULT_GPT_MODEL, GPT4_SIZE_MAX } from './llm.js';


var AdvancedLLMComponent = {
    schema:
    {
        "tags": ['default'],
        "componentKey": "chatGpt_IxP",
        "category": "Document Processing",
        "operation": {
            "schema": {
                "title": "Run chat GPT [instructions]x[prompts] times",
                "type": "object",
                "required": [],
                "properties": {
                    "instruction": {
                        "title": "Instruction(s)",
                        "type": "string",
                        "x-type": "text",
                        "default": "You are a helpful bot answering the user with their question to the best of your ability.",
                        'description': 'instruction or JSON list of instructions',
                    },
                    "prompt": {
                        "title": "Prompt(s)",
                        "type": "string",
                        "x-type": "text",
                        'description': 'prompt or JSON list of prompts',
                    },
                    "llm_functions": {
                        "title": "Functions",
                        "type": "array",
                        'x-type': 'objectArray',
                        'description': 'functions to constrain the LLM output',
                        'default': [],
                    },
                    "top_p": {
                        "title": "Top_p",
                        "type": "number",
                        "default": 1,
                        "minimum": 0,
                        "maximum": 1
                    },
                    "temperature": {
                        "title": "Temperature",
                        "type": "number",
                        "default": 1,
                        "minimum": 0,
                        "maximum": 1
                    },
                    "model": {
                        "title": "LLM Model",
                        "type": "string",
                        "enum": ["gpt-3.5-turbo", "gpt-3.5-turbo-16k", "gpt-4", "gpt-4-32k"],
                        "default": "gpt-3.5-turbo-16k"
                    },
                },
            },
            "responseTypes": {
                "200": {
                    "schema": {
                        "title": "JSON",
                        "required": [],
                        "type": "object",
                        "properties": {
                            "text": {
                                "title": "Result Text",
                                "type": "string",
                                "x-type": "text",
                                "description": "The combined answer texts to all i x p combinations"
                            },
                            "documents": {
                                "title": "Result Documents",
                                "type": "array",
                                "x-type": "documentArray",
                                "description": "The files containing the results"
                            },
                            "answers": {
                                "title": "Answers JSON",
                                "type": "object",
                                "x-type": "object",
                                "description": "An object containing one answer for each i x p combinations"
                            },
                        },
                    },
                    "contentType": "application/json"
                },
            },
            "method": "X-CUSTOM"
        },
        patch:
        {
            "title": "chatGPT IxP",
            "category": "Text Manipulation",
            "summary": "Run chatGPT over each combination of instructions and prompts",
            "meta": {
                "source": {
                    "summary": "Run chatGPT over each combination of instructions and prompts",
                    links: {
                        "OpenAI Chat GPT function calling": "https://platform.openai.com/docs/guides/gpt/function-calling",
                    },
                },
            },
            "inputs": {
                "llm_functions": {
                    "control": {
                        "type": "AlpineCodeMirrorComponent"
                    }
                },
            },
        },
    },
    functions: {
        _exec: async (payload, ctx) =>
        {
            console_log(`[AdvancedLLMComponent]: payload = ${JSON.stringify(payload)}`);

            const instruction = payload.instruction;
            const prompt = payload.prompt;
            const llm_functions = payload.llm_functions;
            const temperature = payload.temperature;
            const top_p = payload.top_p;
            const model = payload.model;

            const answers = await advanced_llm_component(ctx, instruction, prompt, llm_functions, model, temperature, top_p);
            console_log(`[AdvancedLLMComponent]: answers = ${JSON.stringify(answers)}`);

            const return_value = { result: { "ok": true }, answers: answers, text: answers.text, documents: [answers.document] };
            return return_value;
        }
    }
};

async function advanced_llm_component(ctx, instruction, prompt, llm_functions = null, llm_model = DEFAULT_GPT_MODEL, temperature = 0, top_p = 1)  
{
    console.time("advanced_llm_component_processTime");

    console_log(`--------------------------------`);
    const instructions = parse_text_to_array(instruction);
    const prompts = parse_text_to_array(prompt);


    console_log('[advanced_llm_component] llm_functions = ' + JSON.stringify(llm_functions));

    let actual_token_cost = 0;
    const answers = {};
    let answer_string = "";
    for (let i = 0; i < instructions.length; i++)
    {
        const instruction = instructions[i];
        for (let p = 0; p < prompts.length; p++)
        {
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

            if (is_valid(answer_text))
            {
                answers[id] = answer_text;
                answer_string += answer_text + "\n";
            }
            else
            {
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

export { AdvancedLLMComponent, advanced_llm_component };