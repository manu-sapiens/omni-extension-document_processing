// tiktoken.js
import { encoding_for_model } from "../src/node_modules/@dqbd/tiktoken/tiktoken.cjs";

const GPT_MODEL_TIKTOKEN_GPT3 = "gpt-3.5-turbo";

function count_tokens_in_text(text)
{
    const model_type = GPT_MODEL_TIKTOKEN_GPT3; // there's a simplification here as we don't consider GPT4 
    let encoding;

    try
    {
        encoding = encoding_for_model(model_type);
    }
    catch (e)
    {
        throw new Error(`Error getting encoding for model ${model_type}: ${e}`);
    }

    const tokens = encoding.encode(text);
    if (tokens !== null && tokens !== undefined && tokens.length > 0)
    {
        const num_tokens = tokens.length;
        encoding.free();

        return num_tokens;
    }
    else
    {
        encoding.free();
        return 0;
    }
}


export { count_tokens_in_text }