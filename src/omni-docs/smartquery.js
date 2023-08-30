//@ts-check
// smartquery.js

import { query_vectorstore } from './vectorstore.js';
import { queryLlmByModelId, getModelMaxSize } from '../omni-llms/llms.js';
import { console_log, is_valid } from '../omni-utils/utils.js';
import { countTokens } from './tiktoken.js';
import { getModelNameAndProviderFromId } from '../omni-llms/llm.js'

async function smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model_id)
{
    console_log(`[smartquery_from_vectorstore] query = ${query}, embedder = ${embedder != null}, vectorstore = ${vectorstore != null}`);

    const splits = getModelNameAndProviderFromId(model_id);
    const model_name = splits.model_name;
    const model_provider = splits.model_provider;

    if (is_valid(query) == false) throw new Error(`ERROR: query is invalid`);
    let vectorstore_responses = await query_vectorstore(vectorstore, query, 10, embedder);
    // TBD we should have a better way of deciding how many results to return, also  we should check for a minimum score

    let total_tokens = 0;

    let max_size = getModelMaxSize(model_name);


    let combined_text = "";
    for (let i = 0; i < vectorstore_responses.length; i++) 
    {
        const vectorestore_response_array = vectorstore_responses[i];
        const [vectorstore_response, score] = vectorestore_response_array;

        console_log(`vectorstore_responses[${i}] score = ${score}`);

        const raw_text = vectorstore_response?.pageContent;
        const text = `[...] ${raw_text} [...]\n\n`;
        const token_cost = countTokens(text);
        const metadata = vectorstore_response?.metadata; // TBD: contains reference to the chunk that was matched. We could read the token_cost from there
        console_log(`vectorstore_responses[${i}] metadata = ${JSON.stringify(metadata)}`);

        if (total_tokens + token_cost > max_size) break;
        total_tokens += token_cost;
        combined_text += text;
    }

    const instruction = `Here are some quotes. ${combined_text}`;
    const prompt = `Based on the quotes, answer this question: ${query}`;
    
    const response = await queryLlmByModelId(ctx, prompt, instruction, model_id);
    const answer_text = response?.answer_text || null;
    if (is_valid(answer_text) == false) throw new Error(`ERROR: query_answer is invalid`);

    return answer_text;
}

export {smartquery_from_vectorstore}