// embeddings.js

import { Embeddings } from "langchain/embeddings/base";
import { is_valid, console_log } from './utils.js';
import { DEFAULT_VECTORSTORE_NAME } from "./configs.js";
import { runBlock } from "./blocks.js";
import { compute_chunk_id } from "./hashers.js";
import { user_db_put, user_db_get, user_db_delete } from "./database.js"

class CachedEmbeddings extends Embeddings
{
    // A db-cached version of the embeddings
    // NOTE: This is a general purpose "cached embeddings" class
    // that can wrap any langchain embeddings model
    constructor(ctx, embedder, hasher, vectorstore_name = DEFAULT_VECTORSTORE_NAME, overwrite = false, params = null)
    {
        super(params);
        this.embedder = embedder;

        this.ctx = ctx;
        this.db = ctx.app.services.get('db');
        this.user = ctx.user;
        this.vectorstore_name = vectorstore_name;
        this.overwrite = false;

        this.hasher = hasher;

        if (!this.ctx)
        {
            throw new Error(`[embeddings] Context not provided`);
        }
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
        if (!is_valid(text))
        {
            throw new Error(`[embeddings] passed text is invalid ${text}`);
        }
        console_log(`[embeddings] Requested to embed text: ${text.slice(0, 128)}[...]`);

        const embedding_id = compute_chunk_id(this.ctx, text, this.vectorstore_name, this.hasher);
        let embedding = null;

        if (this.overwrite) 
        {
            await user_db_delete(this.ctx, embedding_id);
        }
        else
        {
            embedding = await user_db_get(this.ctx, embedding_id);
        }

        if (is_valid(embedding)) 
        {
            console_log(`[embeddings]: embedding found in DB - returning it`);
            return embedding;
        }

        console_log(`[embeddings] Not found in DB. Generating embedding for ${text.slice(0, 128)}[...]`);
        try
        {
            console_log(`[embeddings] Using embedded: ${this.embedder}`);

            embedding = await this.embedder.embedQuery(text);
            if (!is_valid(embedding))
            {
                console_log(`[embeddings]: [WARNING] embedding ${embedding} is invalid - returning null <---------------`);
                return null;
            }

            console_log(`[embeddings]: computed embedding: ${embedding.slice(0, 128)}[...]`);
            const success = await user_db_put(this.ctx, embedding, embedding_id);
            if (success == false)
            {
                throw new Error(`[embeddings] Error saving embedding for text chunk: ${text.slice(0, 128)}[...]`);
            }
            else
            {
                console_log(`[embeddings] Saved to DB`);
            }

            return embedding;
        }
        catch (error)
        {
            throw new Error(`[embeddings] Error generating embedding: ${error}`);
        }
    }
}

class OmniOpenAIEmbeddings extends Embeddings
{
    constructor(ctx, params = null)
    {
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
        args.user = ctx.user.id;
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

export {CachedEmbeddings, OmniOpenAIEmbeddings}