import { advanced_llm_component } from "./documentsLib.js";

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
                    "allow_gpt3": {
                        "title": "Allow GPT3 usage",
                        "type": "boolean",
                        "default": true,
                    },
                    "allow_gpt4": {
                        "title": "Allow GPT4 usage",
                        "type": "boolean",
                        "default": false,
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
                    "control" :{
                        "type":"AlpineCodeMirrorComponent"
                    }
                },
            },
        },
    },
    functions: {
        _exec: async (payload, ctx) =>
        {
            console.log(`[AdvancedLLMComponent]: payload = ${JSON.stringify(payload)}`);

            const instruction = payload.instruction;
            const prompt = payload.prompt;
            const llm_functions = payload.llm_functions;
            const temperature = payload.temperature;
            const top_p = payload.top_p;
            const allow_gpt3 = payload.allow_gpt3;
            const allow_gpt4 = payload.allow_gpt4;
            
            const answers = await advanced_llm_component(ctx, instruction, prompt, llm_functions, allow_gpt3, allow_gpt4, temperature, top_p)  
            console.log(`[AdvancedLLMComponent]: answers = ${JSON.stringify(answers)}`);

            const return_value = { result: { "ok": true }, answers: answers, text: answers.text, documents: [answers.document] };
            return return_value;
        }
    }
};

export { AdvancedLLMComponent };