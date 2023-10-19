//@ts-check
import { is_valid, console_log , runBlock } from '../../../../src/utils/omni-utils';

import { Embeddings } from "langchain/embeddings/base";

class Embedding_Openai extends Embeddings
{
    constructor(ctx, params = null)
    {
        //@ts-ignore
        super(params);
        this.ctx = ctx;
    }

    async embedDocuments(texts)
    {

        const embeddings = [];
        if (is_valid(texts))
        {
            for (let i = 0; i < texts.length; i += 1)
            {
                let text = texts[i];
                const embedding = await this.embedQuery(text);
                embeddings.push(embedding);
            }
        }
        return embeddings;
    }

    async embedQuery(text)
    {
        console_log(`[OmniOpenAIEmbeddings] embedQuery: Requested to embed text: ${text.slice(0, 128)}[...]`);
        if (!is_valid(text)) 
        {
            console_log(`[OmniOpenAIEmbeddings] WARNING embedQuery: passed text is invalid ${text}`);
            return null;
        }

        console_log(`[OmniOpenAIEmbeddings] generating embedding for ${text.slice(0, 128)}`);
        try
        {
            const response = await this.compute_embedding_via_runblock(this.ctx, text);
            console_log(`[OmniOpenAIEmbeddings] embedQuery: response: ${JSON.stringify(response)}`);
            const embedding = response;
            return embedding;
        } catch (error)
        {
            console_log(`[OmniOpenAIEmbeddings] WARNING embedQuery: Error generating embedding via runBlock for ctx=${this.ctx} and text=${text}\nError: ${error}`);
            return null;
        }
    }

    async compute_embedding_via_runblock(ctx, input)
    {
        let args = {};
        args.user = ctx.userId;
        args.input = input;

        let response = null;
        try
        {
            response = await runBlock(ctx, 'openai.embeddings', args);
        }
        catch (err)
        {
            let error_message = `[OmniOpenAIEmbeddings] Error running openai.embeddings: ${err.message}`;
            console.error(error_message);
            throw err;
        }

        if (response == null) { throw new Error(`[OmniOpenAIEmbeddings embedding runBlock response is null`); };

        if (response.error)
        {
            throw new Error(`[OmniOpenAIEmbeddings] embedding runBlock response.error: ${response.error}`);
        }

        let data = response?.data || null;
        if (is_valid(data) == false) { throw new Error(`[OmniOpenAIEmbeddings] embedding runBlock response is invalid: ${JSON.stringify(response)}`); };

        const embedding = response?.data[0]?.embedding || null;
        return embedding;
    }
}

export {Embedding_Openai}