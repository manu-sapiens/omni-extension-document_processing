import { encode } from 'gpt-tokenizer'

const GPT_MODEL_TIKTOKEN_GPT3 = "cl100k_base";//gpt-3.5-turbo";

function count_tokens_in_text(text)
{

    const tokens = encode(text); //encoding.encode(text);
    if (tokens !== null && tokens !== undefined && tokens.length > 0)
    {
        const num_tokens = tokens.length;
        return num_tokens;
    }
    else
    {
        return 0;
    }
}


export { count_tokens_in_text }