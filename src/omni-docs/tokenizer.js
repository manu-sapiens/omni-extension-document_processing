//@ts-check
class Tokenizer
{
    constructor(params = null)
    {
    }


    encodeText(text)
    {
        throw new Error('You have to implement the method: encode');
    }
    textIsWithinTokenLimit(text, token_limit)
    {
        throw new Error('You have to implement the method: isWithinTokenLimit');
    }
    countTextTokens(text)
    {
        throw new Error('You have to implement the method: countTextTokens');
    }

}

export { Tokenizer }