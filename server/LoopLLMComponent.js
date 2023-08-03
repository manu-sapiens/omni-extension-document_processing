
// LoopLLMComponent.js

import { save_json_to_cdn, get_chunks_from_cdn } from './cdn.js';
import { is_valid, sanitizeJSON, console_log, combineStringsWithoutOverlap } from './utils.js';
import { query_advanced_chatgpt, get_model_max_size, adjust_model, DEFAULT_GPT_MODEL } from './llm.js';
import { count_tokens_in_text } from './tiktoken.js';

var LoopLLMComponent = {
  schema:
  {
    "tags": ['default'],
    "componentKey": "loopLLM",
    "category": "Document Processing",
    "operation": {
      "schema": {
        "title": "Loop documents through a LLM",
        "type": "object",
        "required": [],
        "properties": {
          "documents": {
            "title": "Chunk Documents",
            "type": "array",
            "x-type": "documentArray",
            "description": `Chunk files`,
          },
          "instruction": {
            "title": "Instruction",
            "type": "string",
            'x-type': 'text',
            'description': 'instruction executed on each chunk',
            "default": `write a summary of the provided text, making sure to indicate the characters involved and the locations where the action is taking place`,
          },
          "llm_functions": {
            "title": "Functions",
            "type": "array",
            'x-type': 'objectArray',
            'description': 'functions to constrain the LLM output',
            "default": []
          },
          "temperature": {
            "title": "Temperature",
            "type": "number",
            "default": 0,
            "minimum": 0,
            "maximum": 2
          },
          "top_p": {
            "title": "top_p",
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
                "description": "The files containing the results"
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
      "title": "Loop LLM",
      "category": "Text Manipulation",
      "summary": "Loop a LLM over chunked documents",
      "meta": {
        "source": {
          "summary": "Loop a LLM (chatGPT) over chunked files",
          links: {
            "Langchainjs Website": "https://docs.langchain.com/docs/",
            "Documentation": "https://js.langchain.com/docs/",
            "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
            "Faiss": "https://faiss.ai/"
          }
        }
      },
      "inputs": {
        "llm_functions": {
          "control": {
            "type": "AlpineCodeMirrorComponent"
          }
        },
      },
    }
  },
  functions: {
    _exec: async (payload, ctx) =>
    {

      const llm_functions = payload.llm_functions;
      const documents = payload.documents;
      const instruction = payload.instruction;
      const temperature = payload.temperature;
      const top_p = payload.top_p;
      const model = payload.model;

      const response = await loop_llm_component(ctx, documents, instruction, llm_functions, model, temperature, top_p);
      const response_cdn = response.cdn;
      let answer = "";
      if (llm_functions !== null && llm_functions !== undefined && llm_functions.length > 0)
      {
        answer = response.function_string;
      }
      else
      {
        answer = response.answer;
      }
      return { result: { "ok": true }, answer: answer, documents: [response_cdn], files: [response_cdn] };

    }
  }
};

async function loop_llm_component(ctx, chapters_cdns, instruction, llm_functions = null, llm_model = DEFAULT_GPT_MODEL, temperature = 0, top_p = 1, chunk_size = 2000)
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
    let combined_function_argumnets = [];
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
        combined_function_argumnets = combined_function_argumnets.concat(function_arguments);
    }

    const results_cdn = await save_json_to_cdn(ctx, chunks_results);
    const response = { cdn: results_cdn, answer: combined_answer, function_arguments: combined_function_argumnets };
    console.timeEnd("loop_llm_component_processTime");
    return response;
}

export { LoopLLMComponent, loop_llm_component };