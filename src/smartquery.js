//@ts-check
// smartquery.js

import { queryVectorstore } from './omnilib-docs/vectorstore.js';
import { queryLlmByModelId, getModelMaxSize } from 'omnilib-llms/llms.js';
import { console_log,console_warn,is_valid } from 'omnilib-utils/utils.js';
import { getModelNameAndProviderFromId } from 'omnilib-llms/llm.js'

async function smartqueryFromVectorstore(ctx, vectorstore, query, embedder, model_id)
{
    const splits = getModelNameAndProviderFromId(model_id);
    const model_name = splits.model_name;

    if (is_valid(query) == false) throw new Error(`ERROR: query is invalid`);
    let vectorstore_responses = await queryVectorstore(vectorstore, query, 10, embedder);
    // TBD we should have a better way of deciding how many results to return, also  we should check for a minimum score

    let total_tokens = 0;

    let max_size = getModelMaxSize(model_name);

    let combined_text = "";
    let text_json = [];
    for (let i = 0; i < vectorstore_responses.length; i++) 
    {
        const vectorestore_response_array = vectorstore_responses[i];
        const [vectorstore_response, score] = vectorestore_response_array;

        console_log(`vectorstore_responses[${i}] score = ${score}`);

        const raw_text = vectorstore_response?.pageContent;
        const chunk = vectorstore_response?.metadata;
        const chunk_id = chunk?.id;
        const chunk_source = chunk?.source;
        const chunk_index = chunk?.index;

        text_json.push({fragment_text: raw_text, fragment_id: chunk_id});

        const token_cost = chunk?.token_count + 50;
        if (total_tokens + token_cost > max_size) break;
        total_tokens += token_cost;
    }

    combined_text = JSON.stringify(text_json);
    console_warn(`combined_text = \n${combined_text}`);

    const instruction = `Based on the provided document fragments, answer the user' question and provide citations to each fragment_id you use in your answer. For example, say 'Alice is married to Bob [fragment_id] and they have one son [fragment_id]`;
    const prompt = `Document Json:\n${combined_text}\nUser's question: ${query}`;
    
    const response = await queryLlmByModelId(ctx, prompt, instruction, model_id);
    const answer_text = response?.answer_text || null;
    if (is_valid(answer_text) == false) throw new Error(`ERROR: query_answer is invalid`);

    console_warn(`instruction = \n${instruction}`);
    console_warn(`prompt = \n${prompt}`);
    return answer_text;
}

export {smartqueryFromVectorstore}