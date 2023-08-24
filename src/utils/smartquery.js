//@ts-check
// smartquery.js

import { query_vectorstore } from './vectorstore.js';
import { queryLlm, getModelMaxSize } from './llms.js';
import { console_log, is_valid } from './utils.js';
import { count_tokens_in_text } from './tiktoken.js';

async function smartquery_from_vectorstore(ctx, vectorstore, query, embedder, model)
{
    console_log(`[smartquery_from_vectorstore] query = ${query}, embedder = ${embedder != null}, vectorstore = ${vectorstore != null}`);

    if (is_valid(query) == false) throw new Error(`ERROR: query is invalid`);
    let vectorstore_responses = await query_vectorstore(vectorstore, query, 10, embedder);
    // TBD we should have a better way of deciding how many results to return, also  we should check for a minimum score

    let total_tokens = 0;

    let max_size = getModelMaxSize(model);


    let combined_text = "";
    for (let i = 0; i < vectorstore_responses.length; i++) 
    {
        const vectorestore_response_array = vectorstore_responses[i];
        const [vectorstore_response, score] = vectorestore_response_array;

        console_log(`vectorstore_responses[${i}] score = ${score}`);

        const raw_text = vectorstore_response?.pageContent;
        const text = `[...] ${raw_text} [...]\n\n`;
        const token_cost = count_tokens_in_text(text);
        const metadata = vectorstore_response?.metadata; // TBD: contains reference to the chunk that was matched. We could read the token_cost from there
        console_log(`vectorstore_responses[${i}] metadata = ${JSON.stringify(metadata)}`);

        if (total_tokens + token_cost > max_size) break;
        total_tokens += token_cost;
        combined_text += text;
    }

    const instruction = `Here are some quotes. ${combined_text}`;
    const prompt = `Based on the quotes, answer this question: ${query}`;
    
    const query_answer_json = await queryLlm(ctx, prompt, instruction, model);
    const query_answer = query_answer_json?.text || null;
    if (is_valid(query_answer) == false) throw new Error(`ERROR: query_answer is invalid`);

    return query_answer;
}

export {smartquery_from_vectorstore}