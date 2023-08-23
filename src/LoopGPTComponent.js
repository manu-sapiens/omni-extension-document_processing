
// LoopGPTComponent.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { omnilog } from 'mercs_shared'
import { setComponentInputs, setComponentOutputs, setComponentControls } from './utils/components_lib.js';
const NS_ONMI = 'document_processing';

import { save_json_to_cdn, get_chunks_from_cdn } from './utils/cdn.js';
import { is_valid, sanitizeJSON, combineStringsWithoutOverlap } from './utils/utils.js';
import { queryLlm, get_model_max_size, adjust_model, getLlmChoices, DEFAULT_GPT_MODEL } from './utils/llm.js';
import { count_tokens_in_text } from './utils/tiktoken.js';

async function async_get_loop_gpt_component()
{
    let component = OAIBaseComponent
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
    const llm_choices  = await getLlmChoices();
    const inputs = [
        { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked'  },
        { name: 'instruction', type: 'string', description: 'Instruction(s)', defaultValue: 'You are a helpful bot answering the user with their question to the best of your abilities', customSocket: 'text' },
        { name: 'llm_functions', type: 'array', customSocket: 'objectArray', description: 'Optional functions to constrain the LLM output' },
        { name: 'temperature', type: 'number', defaultValue: 0 },
        { name: 'top_p', type: 'number', defaultValue: 1 },
        { name: 'model', title: 'model', type: 'string', defaultValue: 'gpt-3.5-turbo-16k|openai', choices: llm_choices},
    ];
    component = setComponentInputs(component, inputs);

    // Adding control(s)
    const controls = [
        { name: "llm_functions", title: "LLM Functions", placeholder: "AlpineCodeMirrorComponent", description: "Functions to constrain the output of the LLM" },
    ];
    component = setComponentControls(component, controls);

    // Adding outpu(t)
    const outputs = [
        { name: 'answer', type: 'string', customSocket: 'text', description: 'The answer to the query or prompt', title: 'Answer' },
        { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'The documents containing the results' },
        { name: 'files', type: 'array', customSocket: 'cdnObjectArray', description: 'The files containing the results' },
    ];
    component = setComponentOutputs(component, outputs);


    // Adding _exec function
    component.setMacro(OmniComponentMacroTypes.EXEC, loop_gpt_parse);

    return component.toJSON();
}

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
    omnilog.log(`[loop_llm_component] type of llm_functions = ${typeof llm_functions}, llm_functions = ${JSON.stringify(llm_functions)}<------------------`);

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
    omnilog.log(`Processing ${chapters_cdns.length} chapter(s)`);
    for (let chapter_index = 0; chapter_index < chapters_cdns.length; chapter_index++)
    {
        const chunks_cdn = chapters_cdns[chapter_index];
        const chunks = await get_chunks_from_cdn(ctx, chunks_cdn);
        if (is_valid(chunks) == false) throw new Error(`[component_loop_llm_on_chunks] Error getting chunks from database with id ${JSON.stringify(chunks_cdn)}`);

        let total_token_cost = 0;
        let combined_text = "";

        omnilog.log(`Processing chapter #${chapter_index} with ${chunks.length} chunk(s)`);
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
                    omnilog.log(`total_token_cost = ${total_token_cost} + token_cost = ${token_cost} <? max_size = ${max_size}`);

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
                        const gpt_results = await queryLlm(ctx, combined_text, instruction, model, llm_functions, temperature, top_p);
                        const sanetized_results = sanitizeJSON(gpt_results);

                        omnilog.log('sanetized_results = ' + JSON.stringify(sanetized_results, null, 2) + '\n\n');
                        chunks_results.push(sanetized_results);

                        //reset the combined text and token cost
                        combined_text = text;
                        total_token_cost = token_cost;
                    }
                }
                else
                {
                    const model = adjust_model(token_cost, llm_model);
                    const gpt_results = await query_llm(ctx, text, instruction, model, llm_functions, temperature, top_p);
                    const sanetized_results = sanitizeJSON(gpt_results);
                    omnilog.log('sanetized_results = ' + JSON.stringify(sanetized_results, null, 2) + '\n\n');

                    chunks_results.push(sanetized_results);
                }
            }
            else
            {
                omnilog.log(`[WARNING][loop_llm_component]: chunk is invalid or chunk.text is invalid. chunk = ${JSON.stringify(chunk)}`);
            }
        }


    }

    let combined_answer = "";
    let combined_function_arguments = [];
    omnilog.log(`chunks_results.length = ${chunks_results.length}`);
    for (let i = 0; i < chunks_results.length; i++)
    {
        const chunk_result = chunks_results[i];
        omnilog.log(`chunk_result = ${JSON.stringify(chunk_result)}`);

        const result_text = chunk_result.text || "";
        const function_string = chunk_result.function_arguments_string || "";
        const function_arguments = chunk_result.function_arguments || [];

        combined_answer += result_text + function_string + "\n\n";
        omnilog.log(`[$[i}] combined_answer = ${combined_answer}`);
        combined_function_arguments = combined_function_arguments.concat(function_arguments);
    }

    const results_cdn = await save_json_to_cdn(ctx, chunks_results);
    const response = { cdn: results_cdn, answer: combined_answer, function_arguments: combined_function_arguments };
    console.timeEnd("loop_llm_component_processTime");
    return response;
}

export { async_get_loop_gpt_component, loop_gpt_function};