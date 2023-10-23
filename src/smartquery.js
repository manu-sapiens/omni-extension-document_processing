/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */

//@ts-check
import { queryLlmByModelId, getModelMaxSize, console_log,console_warn,is_valid, getModelNameAndProviderFromId } from '../../../src/utils/omni-utils.js';

import { queryVectorstore } from './omnilib-docs/vectorstore.js';

async function smartqueryFromVectorstore(ctx, vectorstore, query, embedder, model_id, max_size, provide_citation)
{
    let info = "";
    const splits = getModelNameAndProviderFromId(model_id);
    const model_name = splits.model_name;

    info +=  `smartquery: model_name = ${model_name}\n|  `;

    if (is_valid(query) == false) throw new Error(`ERROR: query is invalid`);
    let vectorstore_responses = await queryVectorstore(vectorstore, query, 10, embedder);
    // TBD we should have a better way of deciding how many results to return, also  we should check for a minimum score

    let total_tokens = 0;

    info +=  `using: max_size = ${max_size}\n|  `;

    let combined_text = "";
    let text_json = [];
    const already_used_ids = {};

    for (let i = 0; i < vectorstore_responses.length; i++) 
    {
        const vectorestore_response_array = vectorstore_responses[i];
        const [vectorstore_response, score] = vectorestore_response_array;

        console_log(`vectorstore_responses[${i}] score = ${score}`);

        const chunk = vectorstore_response?.metadata;
        const chunk_id = chunk?.id;
        
        if (already_used_ids[chunk_id] == true) 
        {
            info +=  `already used: chunk_id = ${chunk_id}. Skipping it\n|  `;
            continue;
        }

        already_used_ids[chunk_id] = true;

        const raw_text = vectorstore_response?.pageContent;
        const chunk_source = chunk?.source;
        const chunk_index = chunk?.index;

        text_json.push({fragment_text: raw_text, fragment_id: chunk_id});

        const token_cost = chunk?.token_count + 50;
        if (total_tokens + token_cost > max_size) break;
        total_tokens += token_cost;
        info +=  `processing: chunk_id = ${chunk_id}. token_cost = ${token_cost}. total_tokens = ${total_tokens}. \n|  `;

    }

    console_warn(`combined_text = \n${combined_text}`);

    info +=  `combined_text: ${combined_text}\n|  `;
    
    let instruction = "";
    let prompt = "";
    if (provide_citation)
    {
        combined_text = JSON.stringify(text_json);
        instruction = `Based on the provided document fragments, answer the user' question and provide citations to each fragment_id you use in your answer. For example, say 'Alice is married to Bob [fragment_id] and they have one son [fragment_id]`;
        prompt = `Document Json:\n${combined_text}\nUser's question: ${query}`;
    }
    else
    {
        for (const json_entry of text_json)
        {
            combined_text += json_entry.fragment_text +"\n\n";
        }

        instruction = `Based on the provided document fragments, answer the user' question.`;
        prompt = `Document Json:\n${combined_text}\nUser's question: ${query}`;
    }

    info += `provide_citation: ${provide_citation}.\n|  `;    
    info += `instruction: ${instruction}.\n|  `;
    info += `prompt: ${prompt}.\n|  `;

    const response = await queryLlmByModelId(ctx, prompt, instruction, model_id);
    const answer = response?.answer_text || null;
    if (is_valid(answer) == false) throw new Error(`ERROR: query_answer is invalid`);

    console_warn(`instruction = \n${instruction}`);
    console_warn(`prompt = \n${prompt}`);
    return {answer, info};
}

export {smartqueryFromVectorstore}