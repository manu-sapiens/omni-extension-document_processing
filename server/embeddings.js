// embeddings.js

import { Embeddings } from "langchain/embeddings/base";
import { is_valid, console_log } from './utils.js';
import { DEFAULT_VECTORSTORE_NAME } from "./configs.js";
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
        console_log(`[embeddings] embedQuery of: ${text.slice(0, 128)}[...]`);

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

export { CachedEmbeddings }