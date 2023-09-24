//@ts-check
import { createComponent } from 'omni-utils'; //'omnilib-utils/component.js';
import { is_valid, sanitizeJSON, combineStringsWithoutOverlap } from 'omni-utils'; //'omnilib-utils/utils.js';
import { queryLlmByModelId, getLlmChoices, getModelMaxSize } from 'omni-utils'; //'omnilib-llms/llms.js';
import { getModelNameAndProviderFromId } from 'omni-utils'; //'omnilib-llms/llm.js';

import { GLOBAL_INDEX_NAME, getChunksFromIndexAndIndexedDocuments, getIndexesChoices, getIndexName, loadIndexes } from './omnilib-docs/vectorstore.js';

const NAMESPACE = 'document_processing';;
const OPERATION_ID = 'query_index_bruteforce';
const TITLE = 'Query Index (Brute Force)';
const DESCRIPTION = 'Run a LLM on an array of documents, one fragment at a time, and return the results in an array';
const SUMMARY = DESCRIPTION;
const CATEGORY = 'document processing';


async function async_getQueryIndexBruteforceComponent()
{

    const llm_choices = await getLlmChoices();

    const links = {};

    const inputs = [
        { name: 'indexed_documents', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked' },
        { name: 'instruction', type: 'string', description: 'Instruction(s)', defaultValue: 'You are a helpful bot answering the user with their question to the best of your abilities', customSocket: 'text' },
        { name: 'temperature', type: 'number', defaultValue: 0 },
        { name: 'model_id', title: 'model', type: 'string', defaultValue: 'gpt-3.5-turbo-16k|openai', choices: llm_choices },
        { name: 'existing_index', title: 'Existing Index', type: 'string', defaultValue: GLOBAL_INDEX_NAME, choices: getIndexesChoices(), description: "If set, will ingest into the existing index with the given name" },
        { name: 'new_index', title: 'index', type: 'string', description: "All injested information sharing the same Index will be grouped and queried together" },
        { name: 'chunk_size', type: 'number', defaultValue: 0, minimum: 0, maximum: 1000000, step: 1, description: "If set to a positive number, will concatenate fragments to fit within that size (in tokens). If set to 0, will try to use the maximum size of the model (with some margin)" },
        { name: 'llm_args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},
    ];

    const outputs = [
        { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query or prompt', title: 'Answer' },
        { name: 'json', type: 'object', customSocket: 'object', description: 'The answer in json format, with possibly extra arguments returned by the LLM', title: 'Json' },

    ];
    const controls = null;

    const component = createComponent(NAMESPACE, OPERATION_ID, TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, queryIndexBruteforce);
    return component;

}

async function queryIndexBruteforce(payload, ctx)
{
    console.time("queryIndexBruteforce");

    const indexed_documents = payload.indexed_documents;
    const index_name = getIndexName(payload.existing_index, payload.new_index);
    const indexes = await loadIndexes(ctx);

    const instruction = payload.instruction;
    const temperature = payload.temperature;
    const model_id = payload.model_id;
    const chunk_size = payload.chunk_size;
    const llm_args = payload.llm_args;

    const splits = getModelNameAndProviderFromId(model_id);
    const model_name = splits.model_name;
    let max_size = chunk_size;

    if (chunk_size == 0) 
    {
        max_size = getModelMaxSize(model_name);
    }
    else if (chunk_size > 0)
    {
        max_size = Math.min(chunk_size, getModelMaxSize(model_name));
    }


    const chunks = await getChunksFromIndexAndIndexedDocuments(ctx, indexes, index_name, indexed_documents);
    let chunk_index = 0;
    let total_token_cost = 0;
    let combined_text = "";
    let llm_results = [];
    let answer_text = "";
    for (const chunk of chunks)
    {
        const text = chunk?.text;
        if (!is_valid(text)) continue;
        const token_cost = chunk.token_count;

        const can_fit = (total_token_cost + token_cost <= max_size);
        const is_last_index = (chunk_index == chunks.length - 1);


        if (can_fit)
        {
            combined_text = combineStringsWithoutOverlap(combined_text, text);
            total_token_cost += token_cost; // TBD: this is not accurate because we are not counting the tokens in the overlap or the instructions
        }

        if (!can_fit || is_last_index)
        {
            const gpt_results = await queryLlmByModelId(ctx, combined_text, instruction, model_id, temperature, llm_args);
            const sanetized_results = sanitizeJSON(gpt_results);
            const chunk_result = { text: sanetized_results?.answer_text || "", function_arguments_string: sanetized_results?.answer_json?.function_arguments_string, function_arguments: sanetized_results?.answer_json?.function_arguments };
            llm_results.push(chunk_result);

            const answer = chunk_result.text;
            if (answer && answer.length > 0) 
            {
                answer_text += answer + "\n\n";
            }

            //reset the combined text and token cost
            combined_text = text;
            total_token_cost = token_cost;
        }

        chunk_index+=1;                
    }

    const response = { result: { "ok": true }, answer: answer_text, json: { 'answers': llm_results } };
    console.timeEnd("queryIndexBruteforce");

    return response;
}

export { async_getQueryIndexBruteforceComponent, queryIndexBruteforce};