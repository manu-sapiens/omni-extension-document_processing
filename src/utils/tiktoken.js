// tiktoken.js
//import { encoding_for_model } from "@dqbd/tiktoken";
//import * as tiktoken from "tiktoken-node"
import { encode } from 'gpt-tokenizer'

const GPT_MODEL_TIKTOKEN_GPT3 = "cl100k_base";//gpt-3.5-turbo";

function count_tokens_in_text(text)
{
    //const model_type = GPT_MODEL_TIKTOKEN_GPT3; // there's a simplification here as we don't consider GPT4 
    //let encoding;
/*
    try
    {
        encoding = tiktoken.getEncoding(model_type)
    }
    catch (e)
    {
        throw new Error(`Error getting encoding for model ${model_type}: ${e}`);
    }
*/
    const tokens = encode(text); //encoding.encode(text);
    if (tokens !== null && tokens !== undefined && tokens.length > 0)
    {
        const num_tokens = tokens.length;
        //encoding.free();

        return num_tokens;
    }
    else
    {
        //encoding.free();
        return 0;
    }
}


export { count_tokens_in_text }