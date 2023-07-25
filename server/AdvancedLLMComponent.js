import { advanced_llm_component } from "./documentsLib.js";

var AdvancedLLMComponent = {
    schema:
    {
        "tags": ['default'],
        "componentKey": "advancedLLM",
        "category": "Document Processing",
        "operation": {
            "schema": {
                "title": "Loop [instructions]x[prompts] times through a LLM",
                "type": "object",
                "required": [],
                "properties": {
                    "instruction": {
                        "title": "Instruction",
                        "type": "string",
                        "x-type": "text",
                        'description': 'instruction or JSON list of instructions',
                    },
                    "prompt": {
                        "title": "Prompt",
                        "type": "string",
                        "x-type": "text",
                        'description': 'prompt or JSON list of prompts',
                    },
                    "llm_function": {
                        "title": "Function",
                        "type": "object",
                        "x-type": "object",
                        'description': 'function(s) to constrain the LLM output',
                        'default': null
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
            "title": "Advanced LLM",
            "category": "Text Manipulation",
            "summary": "Run a LLM over each combination of instructions and prompts",
            "meta": {
                "source": {
                    "summary": "advanced a LLM (chatGPT) over chunked files",
                    links: {
                        "Langchainjs Website": "https://docs.langchain.com/docs/",
                        "Documentation": "https://js.langchain.com/docs/",
                        "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
                        "Faiss": "https://faiss.ai/"
                    },
                },
            },
        },
    },
    functions: {
        _exec: async (payload, ctx) =>
        {
            console.log(`[AdvancedLLMComponent]: payload = ${JSON.stringify(payload)}`);

            const answers = await advanced_llm_component(ctx, payload);
            console.log(`[AdvancedLLMComponent]: answers = ${JSON.stringify(answers)}`);

            const return_value = { result: { "ok": true }, answers: answers, text: answers.text, documents: [answers.document] };
            return return_value;
        }
    }
};

export { AdvancedLLMComponent };