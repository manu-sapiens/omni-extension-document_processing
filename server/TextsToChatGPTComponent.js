import { t } from "tar";
import { read_text_file_component, chunk_files_component, query_chunks_component, loop_llm_component } from "./documentsLib.js";
import { run } from "node:test";
import { error } from "console";

var TextsToChatGPTComponent = {
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
                    "documents": {
                        "title": "input some Text Documents",
                        "type": "array",
                        "x-type": "documentArray",
                        "description": "Text document(s) to process",
                        "default": []
                    },                    
                    "url": {
                        "title": "or some Texts to process (text or url(s))",
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
                        "title": "Prompt (question or function)",
                        "type": "string",
                        'x-type': 'text',
                        'description': 'The Query or Prompt or Functions to process',
                    },
                    "temperature": {
                        "title": "Temperature (0 most strict, 1 most creative)",
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
                    "overwrite": {
                        "title": "Overwrite",
                        "type": "boolean",
                        "default": false,
                        "description": `Overwrite the existing files in the CDN.`,
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
                            "answer": {
                                "title": "Answer",
                                "type": "string",
                                "x-type": "text",
                                "description": "The answer to the query or prompt"
                            },                            
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
                        },
                    },
                    "contentType": "application/json"
                },
            },
            "method": "X-CUSTOM"
        },
        patch:
        {
            "title": "Texts to chatGPT",
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
                "documents": {
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
            let passed_documents = payload.documents;

            let documents_are_valid = (passed_documents != null && passed_documents != undefined && Array.isArray(passed_documents) && passed_documents.length > 0)
            
            if (documents_are_valid) 
            {
                console.log(`read #${passed_documents.lentgh} from "documents" input`);
                console.log(`passed_documents = ${JSON.stringify(passed_documents)}`)
            }
            else
            {
                console.log(`documents = ${passed_documents} is invalid`)
                passed_documents = await read_text_file_component(ctx, passed_documents);
                documents_are_valid = (passed_documents != null && passed_documents != undefined && Array.isArray(passed_documents) && passed_documents.length > 0)
                if (documents_are_valid)
                {
                    console.log(`RECOVERED  #${passed_documents.lentgh} from "documents" input`);
                    console.log(`RECOVERED passed_documents = ${JSON.stringify(passed_documents)}`)

                }
            }

            const url = payload.url;
            const usage = payload.usage;
            const prompt = payload.prompt;
            const temperature = payload.temperature;
            const model = payload.model;
            const overwrite = payload.overwrite;
            let default_instruction = "You are a helpful bot answering the user with their question to the best of your ability.";
 
            let read_documents_cdns = await read_text_file_component(ctx, url);
            const read_documents_are_valid = (read_documents_cdns != null && read_documents_cdns != undefined && Array.isArray(read_documents_cdns) && read_documents_cdns.length > 0)
            if (read_documents_are_valid)
            {
                console.log(`type of read_documents_cdns = ${typeof read_documents_cdns}`)
                console.log(`read #${read_documents_cdns.lentgh} from "read_documents_cdns"`);
                console.log(`read_documents_cdns = ${JSON.stringify(read_documents_cdns)}`)
            }
            else
            {
                console.log(`documents = ${read_documents_cdns} is invalid`)
            }


            // TBD read doc types and process documents to turn them into text.
            // TBD for now, we assume they all are text files
            if (documents_are_valid && read_documents_are_valid) read_documents_cdns = passed_documents.concat(read_documents_cdns);
            if (documents_are_valid && !read_documents_are_valid) read_documents_cdns = passed_documents;
            if (!documents_are_valid && !read_documents_are_valid) throw new Error(`no texts passed as text, url or documents`) 

            if (read_documents_are_valid)
            {
                console.log(`2] read #${read_documents_cdns.lentgh} from "read_documents_cdns"`);
                console.log(`2] read_documents_cdns = ${JSON.stringify(read_documents_cdns)}`)
            }
            else
            {
                console.log(`2] documents = ${read_documents_cdns} is invalid`)
            }

            const chunked_documents_cdns = await chunk_files_component(ctx, read_documents_cdns, overwrite);
            let return_value = { result: { "ok": false }, answers: [], documents: [], files: [] };
            let response_cdn = null;
            let answer = "";

            if (usage == "query_documents")
            {
                if (prompt === null || prompt === undefined || prompt.length == 0) throw new Error("No query specified in [prompt] field");
                const response = await query_chunks_component(ctx, chunked_documents_cdns, prompt, model);
                response_cdn = response.cdn;
                answer = response.answer;
                return_value = { result: { "ok": true }, answer: answer, documents: [response_cdn], files: [response_cdn] };

            }
            else if (usage == "run_prompt_on_documents")
            {
                if (prompt === null || prompt === undefined || prompt.length == 0) throw new Error("No prompt specified in [prompt] field");
 
                const instruction = default_instruction + "\n" + prompt;
                const response = await loop_llm_component(ctx, chunked_documents_cdns, instruction, [], model, temperature );
                response_cdn = response.cdn;
                answer = response.answer;
            }
            else if (usage == "run_functions_on_documents")
            {
                const instruction = "You are a helpful bot answering the user with their question to the best of your ability using the provided functions.";

                let llm_functions = null;
                try
                {
                    llm_functions = JSON.parse(prompt);
                    console.log(`[SimpleLLMComponent]: string -> object: llm_functions = ${JSON.stringify(llm_functions)}`);
                }
                catch
                {
                    throw new Error(`Invalid JSON in [Prompt] field: ${prompt}`);
                }
                if (llm_functions === null || llm_functions === undefined || llm_functions.length == 0) throw new Error("No valid functions specified in [prompt] field");
                if (!Array.isArray(llm_functions)) 
                {
                    llm_functions = [llm_functions];
                    console.log(`[SimpleLLMComponent]: object -> array: llm_functions = ${JSON.stringify(llm_functions)}`);
                }

                const response = await loop_llm_component(ctx, chunked_documents_cdns, instruction, llm_functions, model, temperature );
                response_cdn = response.cdn;
                answer = response.answer;
            }
            else
            {
                throw new Error(`Unknown usage: ${usage}`);
            }
            return_value = { result: { "ok": true }, answer: answer, documents: [response_cdn], files: [response_cdn] };
            console.log(`[SimpleLLMComponent]: return_value = ${JSON.stringify(return_value)}`);
            return return_value;
        }
    }
};

export { TextsToChatGPTComponent };