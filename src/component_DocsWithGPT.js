//@ts-check
// DocsWithGPTComponent.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { omnilog } from 'mercs_shared'
import { setComponentInputs, setComponentOutputs, setComponentControls } from 'omnilib-utils/component.js';
const NS_ONMI = 'document_processing';

import { read_text_files_function } from "./component_ReadTextFiles.js";
import { chunkFiles_function } from './component_ChunkFiles.js';
import { queryChunks } from './component_QueryChunks.js';
import { loopGpt } from './component_LoopGPT.js';
import { getLlmChoices, DEFAULT_LLM_MODEL_ID} from "omnilib-llms/llms.js"
import { chunk, over } from 'lodash-es';


async function async_getDocsWithGptComponent()
{
    let component = OAIBaseComponent
        .create(NS_ONMI, "docs_with_gpt")
        .fromScratch()
        .set('title', 'Docs with GPT')
        .set('category', 'Text Manipulation')
        .setMethod('X-CUSTOM')
        .setMeta({
            source: {
                "summary": "Feed text document(s) to chatGPT",
                links: {
                    "OpenAI Chat GPT function calling": "https://platform.openai.com/docs/guides/gpt/function-calling",
                },
            }
        });

    // Adding input(s)
    const llm_choices  = await getLlmChoices();
    const inputs = [
        { name: 'documents', type: 'array', customSocket: 'documentArray', title: 'Text document(s) to process', defaultValue: [] },
        { name: 'url', type: 'string', title: 'or some Texts to process (text or url(s))', customSocket: 'text' },
        { name: 'usage', type: 'string', defaultValue: 'query_documents', choices: [
            {value:"query_documents", title:"Query Docs", desccription:"Ask a question about your document(s)"}, 
            {value:"run_prompt_on_documents", title:"Run a prompt on docs", description:"Run a prompt on your doc(s) broken into as large chunks as fit in the LLM"}, 
            {value:"run_functions_on_documents", title:"Run Functions on docs", description: "Force the LLM to return a structured output (aka function)"}] },
        { name: 'prompt', type: 'string', title: 'the Prompt, Query or Functions to process', customSocket: 'text' },
        { name: 'temperature', type: 'number', defaultValue: 0 },
        { name: 'model_id', title: 'model', type: 'string', defaultValue: DEFAULT_LLM_MODEL_ID, choices: llm_choices},
        { name: 'vectorstore_name', type: 'string', description: 'All injested information sharing the same vectorstore will be grouped and queried together', title: "Vector-Store Name", defaultValue: "my_library_00" },
        { name: 'chunk_size', type: 'number', defaultValue: 4096, minimum: 1, maximum:32768, step:1 },
        { name: 'chunk_overlap', type: 'number', defaultValue: 512, minimum: 0, maximum:32768, step:1 },
        { name: 'overwrite', description:"re-ingest the document(s)", type: 'boolean', defaultValue: false },

    ];
    component = setComponentInputs(component, inputs);

    // Adding control(s)
    const controls = [
        { name: "documents", placeholder: "AlpineCodeMirrorComponent" },
    ];
    component = setComponentControls(component, controls);

    // Adding outpu(t)
    const outputs = [
        { name: 'answer_text', type: 'string', customSocket: 'text', description: 'The answer to the query or prompt', title: 'Answer' },
    ];
    component = setComponentOutputs(component, outputs);


    // Adding _exec function
    component.setMacro(OmniComponentMacroTypes.EXEC, parsePayload);

    return component.toJSON();
}

async function parsePayload(payload, ctx) {
    omnilog.log(`[DocsWithGPTComponent]: payload = ${JSON.stringify(payload)}`);
    const failure = { result: { "ok": false }, answer_text: ""};
    if (!payload) return failure;


    
    const answer_text = await docsWithGpt(ctx, payload)
    if (!answer_text || answer_text == "")  return failure;

    return { result: { "ok": true }, answer_text: answer_text};
}

async function docsWithGpt(ctx, payload) 
{
    let passed_documents_cdns = payload.documents;
    const url = payload.url;
    const usage = payload.usage;
    const prompt = payload.prompt;
    const temperature = payload.temperature || 0.3;
    const model_id = payload.model_id;

    // these variables are used by chunkFiles_function directly through the `payload` variable
    const overwrite = payload.overwrite || false;
    const chunk_size = payload.chunk_size;
    const chunk_overlap = payload.chunk_overlap;
    const vectorstore_name = payload.vectorstore_name;

    let passed_documents_are_valid = (passed_documents_cdns != null && passed_documents_cdns != undefined && Array.isArray(passed_documents_cdns) && passed_documents_cdns.length > 0);
    if (passed_documents_are_valid) {
        omnilog.log(`read #${passed_documents_cdns.lentgh} from "documents" input, passed_documents_cdns = ${JSON.stringify(passed_documents_cdns)}`);
    }
    else {
        omnilog.log(`documents = ${passed_documents_cdns} is invalid`);
        passed_documents_cdns = await read_text_files_function(ctx, passed_documents_cdns);
        passed_documents_are_valid = (passed_documents_cdns != null && passed_documents_cdns != undefined && Array.isArray(passed_documents_cdns) && passed_documents_cdns.length > 0);
        if (passed_documents_are_valid) {
            omnilog.log(`RECOVERED  #${passed_documents_cdns.lentgh} from "documents" input, RECOVERED passed_documents = ${JSON.stringify(passed_documents_cdns)}`);

        }
    }

    let read_documents_cdns = await read_text_files_function(ctx, url);
    const read_documents_are_valid = (read_documents_cdns != null && read_documents_cdns != undefined && Array.isArray(read_documents_cdns) && read_documents_cdns.length > 0);
    if (read_documents_are_valid) {
        omnilog.log(`type of read_documents_cdns = ${typeof read_documents_cdns}, read #${read_documents_cdns.length} from "read_documents_cdns", read_documents_cdns = ${JSON.stringify(read_documents_cdns)}`);
    }
    else {
        omnilog.log(`documents = ${read_documents_cdns} is invalid`);
    }


    // TBD read doc types and process documents to turn them into text.
    // TBD for now, we assume they all are text files
    if (passed_documents_are_valid && read_documents_are_valid) read_documents_cdns = passed_documents_cdns.concat(read_documents_cdns);
    if (passed_documents_are_valid && !read_documents_are_valid) read_documents_cdns = passed_documents_cdns;
    if (!passed_documents_are_valid && !read_documents_are_valid) throw new Error(`no texts passed as text, url or documents`);

    if (read_documents_are_valid) {
        omnilog.log(`2] read #${read_documents_cdns.length} from "read_documents_cdns"`);
        omnilog.log(`2] read_documents_cdns = ${JSON.stringify(read_documents_cdns)}`);
    }
    else {
        omnilog.log(`2] documents = ${read_documents_cdns} is invalid`);
    }

    payload.documents = read_documents_cdns;
    const chunked_documents_cdns = await chunkFiles_function(ctx, payload);
    payload.documents = chunked_documents_cdns;

    let answer_text = "";
    let default_instruction = "You are a helpful bot answering the user with their question to the best of your ability.";

    if (usage == "query_documents") {
        if (prompt === null || prompt === undefined || prompt.length == 0) throw new Error("No query specified in [prompt] field");
        payload.query = prompt;
        answer_text = await queryChunks(ctx, payload);
    }
    else if (usage == "run_prompt_on_documents") {
        if (prompt === null || prompt === undefined || prompt.length == 0) throw new Error("No prompt specified in [prompt] field");

        const instruction = default_instruction + "\n" + prompt;
        const response = await loopGpt(ctx, chunked_documents_cdns, instruction, null, model_id, temperature);
        answer_text = response.answer_text;
    }
    else if (usage == "run_functions_on_documents") {
        const instruction = "You are a helpful bot answering the user with their question to the best of your ability using the provided functions.";

        let llm_functions = [];
        try {
            llm_functions = JSON.parse(prompt);
            omnilog.log(`[DocsWithGPTComponent]: string -> object: llm_functions = ${JSON.stringify(llm_functions)}`);
        }
        catch
        {
            throw new Error(`Invalid JSON in [Prompt] field: ${prompt}`);
        }
        if (llm_functions === null || llm_functions === undefined || llm_functions.length == 0) throw new Error("No valid functions specified in [prompt] field");
        if (!Array.isArray(llm_functions)) {
            llm_functions = [llm_functions];
            omnilog.log(`[DocsWithGPTComponent]: object -> array: llm_functions = ${JSON.stringify(llm_functions)}`);
        }

        const response = await loopGpt(ctx, chunked_documents_cdns, instruction, llm_functions, model_id, temperature);

        answer_text = response.answer_text;
    }
    else {
        throw new Error(`Unknown usage: ${usage}`);
    }

    return answer_text;
}

export { async_getDocsWithGptComponent, docsWithGpt };