
// LoopGPTComponent.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { setComponentInputs, setComponentOutputs, setComponentControls } from './utils/components_lib.js';
const NS_ONMI = 'document_processing';

import { save_json_to_cdn, get_chunks_from_cdn } from './utils/cdn.js';
import { is_valid, sanitizeJSON, console_log, combineStringsWithoutOverlap } from './utils/utils.js';
import { query_advanced_chatgpt, get_model_max_size, adjust_model, DEFAULT_GPT_MODEL } from './utils/llm.js';
import { count_tokens_in_text } from './utils/tiktoken.js';


let loop_gpt_component = OAIBaseComponent
    .create(NS_ONMI, "loop_gpt")
    .fromScratch()
    .set('title', 'Loop GPT')
    .set('category', 'Text Manipulation')
    .set('description', 'Run GPT on an array of documents')
    .setMethod('X-CUSTOM')
    .setMeta({
        source: {
            summary: "chunk text files and save the chunks to the CDN using FAISS, OpenAI embeddings and Langchain",
            links: {
                "Langchainjs Website": "https://docs.langchain.com/docs/",
                "Documentation": "https://js.langchain.com/docs/",
                "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
                "Faiss": "https://faiss.ai/"
            },
        }
    });
    
// Adding input(s)
const inputs = [
  { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked'  },
  { name: 'instruction', type: 'string', description: 'Instruction(s)', defaultValue: 'You are a helpful bot answering the user with their question to the best of your abilities', customSocket: 'text' },
  { name: 'llm_functions', type: 'array', customSocket: 'objectArray', description: 'Optional functions to constrain the LLM output' },
  { name: 'temperature', type: 'number', defaultValue: 0 },
  { name: 'top_p', type: 'number', defaultValue: 1 },
  { name: 'model', type: 'string', defaultValue: 'gpt-3.5-turbo-16k', choices: [
    {value:'gpt-3.5-turbo', title:"chatGPT 3 (4k)", description:"gpt 3.5 with ~ 3,000 words context"}, 
    {value:'gpt-3.5-turbo-16k', title:"chatGPT 3 (16k)", description:"gpt 3.5 with ~ 12,000 words context"}, 
    {value:'gpt-4', title:"chatGPT 4 (8k)", description:"gpt 4 with ~ 6,000 words context"},
    {value:'gpt-4-32k', title:"chatGPT 4 (32k)", description: "chat GPT 4 with ~ 24,000 words context"}] },
];
loop_gpt_component = setComponentInputs(loop_gpt_component, inputs);

// Adding control(s)
const controls = [
    { name: "llm_functions", title: "LLM Functions", placeholder: "AlpineCodeMirrorComponent", description: "Functions to constrain the output of the LLM" },
];
loop_gpt_component = setComponentControls(loop_gpt_component, controls);

// Adding outpu(t)
const outputs = [
    { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query or prompt', title: 'Answer' },
    { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'The documents containing the results' },
    { name: 'files', type: 'array', customSocket: 'cdnObjectArray', description: 'The files containing the results' },
];
loop_gpt_component = setComponentOutputs(loop_gpt_component, outputs);


// Adding _exec function
loop_gpt_component.setMacro(OmniComponentMacroTypes.EXEC, loop_gpt_parse);


async function loop_gpt_parse(payload, ctx) {

  const llm_functions = payload.llm_functions;
  const documents = payload.documents;
  const instruction = payload.instruction;
  const temperature = payload.temperature;
  const top_p = payload.top_p;
  const model = payload.model;

  const response = await loop_gpt_function(ctx, documents, instruction, llm_functions, model, temperature, top_p);
  const response_cdn = response.cdn;
  const answer = response.answer;
  
  return { result: { "ok": true }, answer: answer, documents: [response_cdn], files: [response_cdn] };

}

async function loop_gpt_function(ctx, chapters_cdns, instruction, llm_functions = null, llm_model = DEFAULT_GPT_MODEL, temperature = 0, top_p = 1, chunk_size = 2000)
{
    console_log(`[loop_llm_component] type of llm_functions = ${typeof llm_functions}, llm_functions = ${JSON.stringify(llm_functions)}<------------------`);

    let maximize_chunks = false;
    let max_size = chunk_size;

    if (chunk_size == -1) 
    {
        maximize_chunks = true;
        max_size = get_model_max_size(llm_model);
    }
    else if (chunk_size > 0)
    {
        maximize_chunks = true;
        max_size = Math.min(chunk_size, get_model_max_size(llm_model));
    }
    console.time("loop_llm_component_processTime");

    const chunks_results = [];
    console_log(`Processing ${chapters_cdns.length} chapter(s)`);
    for (let chapter_index = 0; chapter_index < chapters_cdns.length; chapter_index++)
    {
        const chunks_cdn = chapters_cdns[chapter_index];
        const chunks = await get_chunks_from_cdn(ctx, chunks_cdn);
        if (is_valid(chunks) == false) throw new Error(`[component_loop_llm_on_chunks] Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

        let total_token_cost = 0;
        let combined_text = "";

        console_log(`Processing chapter #${chapter_index} with ${chunks.length} chunk(s)`);
        for (let chunk_index = 0; chunk_index < chunks.length; chunk_index++)
        {
            //concatenate chunks into something that fits in the max size of the model. Although don't concatenate across chapters.
            const chunk = chunks[chunk_index];

            if (is_valid(chunk) && is_valid(chunk.text))
            {

                const text = chunk.text;
                const token_cost = count_tokens_in_text(text);
                if (maximize_chunks)
                {
                    console_log(`total_token_cost = ${total_token_cost} + token_cost = ${token_cost} <? max_size = ${max_size}`);

                    const can_fit = (total_token_cost + token_cost <= max_size);
                    const is_last_index = (chunk_index == chunks.length - 1);

                    if (can_fit)
                    {
                        combined_text = combineStringsWithoutOverlap(combined_text, text);
                        total_token_cost += token_cost; // TBD: this is not accurate because we are not counting the tokens in the overlap or the instructions

                    }
                    if (!can_fit || is_last_index)
                    {
                        const model = adjust_model(total_token_cost, llm_model);
                        const gpt_results = await query_advanced_chatgpt(ctx, combined_text, instruction, model, llm_functions, temperature, top_p);
                        const sanetized_results = sanitizeJSON(gpt_results);

                        console_log('sanetized_results = ' + JSON.stringify(sanetized_results, null, 2) + '\n\n');
                        chunks_results.push(sanetized_results);

                        //reset the combined text and token cost
                        combined_text = text;
                        total_token_cost = token_cost;
                    }
                }
                else
                {
                    const model = adjust_model(token_cost, llm_model);
                    const gpt_results = await query_advanced_chatgpt(ctx, text, instruction, model, llm_functions, temperature, top_p);
                    const sanetized_results = sanitizeJSON(gpt_results);
                    console_log('sanetized_results = ' + JSON.stringify(sanetized_results, null, 2) + '\n\n');

                    chunks_results.push(sanetized_results);
                }
            }
            else
            {
                console_log(`[WARNING][loop_llm_component]: chunk is invalid or chunk.text is invalid. chunk = ${JSON.stringify(chunk)}`);
            }
        }


    }

    let combined_answer = "";
    let combined_function_arguments = [];
    console_log(`chunks_results.length = ${chunks_results.length}`);
    for (let i = 0; i < chunks_results.length; i++)
    {
        const chunk_result = chunks_results[i];
        console_log(`chunk_result = ${JSON.stringify(chunk_result)}`);

        const result_text = chunk_result.text || "";
        const function_string = chunk_result.function_arguments_string || "";
        const function_arguments = chunk_result.function_arguments || [];

        combined_answer += result_text + function_string + "\n\n";
        console_log(`[$[i}] combined_answer = ${combined_answer}`);
        combined_function_arguments = combined_function_arguments.concat(function_arguments);
    }

    const results_cdn = await save_json_to_cdn(ctx, chunks_results);
    const response = { cdn: results_cdn, answer: combined_answer, function_arguments: combined_function_arguments };
    console.timeEnd("loop_llm_component_processTime");
    return response;
}
const LoopGPTComponent = loop_gpt_component.toJSON();
export { LoopGPTComponent, loop_gpt_function};