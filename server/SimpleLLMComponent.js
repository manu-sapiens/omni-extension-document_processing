import { t } from "tar";
import { read_text_file_component, chunk_files_component, query_chunks_component, loop_llm_component } from "./documentsLib.js";
import { run } from "node:test";

var SimpleLLMComponent = {
    schema:
    {
        "tags": ['default'],
        "componentKey": "simple_LLM",
        "category": "Document Processing",
        "operation": {
            "schema": {
                "title": "ChatGPT that accept text or text_url",
                "type": "object",
                "required": [],
                "properties": {
                    "url": {
                        "title": "url(s) of text files",
                        "type": "string",
                        "x-type": "text",
                        'description': 'url or JSON list of urls',
                    },
                    "usage": {
                        "title": "Usage",
                        "type": "string",
                        "x-type": "text",
                        "default": "chat",
                        "description": "query_documents",
                        "enum": ["query_documents", "run_prompt_on_documents", "run_functions_on_documents"],
                    },
                    "prompt": {
                        "title": "prompt",
                        "type": "string",
                        'x-type': 'text',
                        'description': 'The Query or Prompt or Functions instructions',
                    },
                    "llm_functions": {
                        "title": "Functions",
                        "type": "array",
                        'x-type': 'objectArray',
                        'description': 'functions to constrain the LLM output',
                        'default': [],
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
                            "files": {
                                "title": "Result Files",
                                "type": "array",
                                "x-type": "cdnObjectArray",
                                "description": "The files containing the results"
                            },
                            "documents": {
                                "title": "Result Documents",
                                "type": "array",
                                "x-type": "documentArray",
                                "description": "The documents containing the results"
                            },
                            "answers": {
                                "title": "Answers",
                                "type": "object",
                                "x-type": "object",
                                "description": "The answers to the query or prompt"
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
            "title": "Text doc(s) to chatGPT",
            "category": "Text Manipulation",
            "summary": "Feed text document(s) to chatGPT",
            "meta": {
                "source": {
                    "summary": "Feed text document(s) to chatGPT",
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
            console.log(`[SimpleLLMComponent]: payload = ${JSON.stringify(payload)}`);
            const url = payload.url;
            const usage = payload.usage;
            const prompt = payload.prompt;
            const temperature = payload.temperature;
            const allow_gpt3 = payload.allow_gpt3;
            const allow_gpt4 = payload.allow_gpt4;
            const llm_functions = payload.llm_functions;
            let default_instruction = "You are a helpful bot answering the user with their question to the best of your ability.";


            const read_documents_cdns = await read_text_file_component(ctx, url);
            const chunked_documents_cdns = await chunk_files_component(ctx, read_documents_cdns);

            let return_value = { result: { "ok": false }, answers: [], documents: [], files: [] };
            if (usage == "query_documents")
            {
                if (prompt === null || prompt === undefined || prompt.length == 0) throw new Error("No query specified in [prompt] field");
                const response = await query_chunks_component(ctx, chunked_documents_cdns, prompt, 2, allow_gpt3, allow_gpt4);
                const results_cdn = response.cdn;
                const answers = response.answers;
                return_value = { result: { "ok": true }, answers: {answers:answers}, documents: [results_cdn], files: [results_cdn] };

            }
            else if (usage == "run_prompt_on_documents")
            {
                if (prompt === null || prompt === undefined || prompt.length == 0) throw new Error("No prompt specified in [prompt] field");
 
                const instruction = default_instruction + "\n" + prompt;
                const response = await loop_llm_component(ctx, chunked_documents_cdns, instruction, [], temperature, allow_gpt3, allow_gpt4 );
                const results_cdn = response.cdn;
                const answers = response.answers;
                return_value = { result: { "ok": true }, answers: {answers:answers}, documents: [results_cdn], files: [results_cdn] };
            }
            else if (usage == "run_functions_on_documents")
            {
                if (llm_functions === null || llm_functions === undefined || llm_functions.length == 0) throw new Error("No functions specified in [llm_functions] field");

                let instruction = prompt;
                if (prompt === null || prompt === undefined || prompt.length == 0) 
                {
                    instruction = "You are a helpful bot answering the user with their question to the best of your ability using the provided functions.";
                }

                const response = await loop_llm_component(ctx, chunked_documents_cdns, instruction, llm_functions, temperature, allow_gpt3, allow_gpt4 );
                const results_cdn = response.cdn;
                const answers = response.answers;
                console.log(`[SimpleLLMComponent]: answers = ${JSON.stringify(answers)}`);
                
                return_value = { result: { "ok": true }, answers: {answers: answers}, documents: [results_cdn], files: [results_cdn] };
            }
            else
            {
                throw new Error(`Unknown usage: ${usage}`);
            }
            console.log(`[SimpleLLMComponent]: return_value = ${JSON.stringify(return_value)}`);
            return return_value;
        }
    }
};

export { SimpleLLMComponent };