//@ts-check
import { is_valid, console_log, user_db_put, user_db_get, user_db_delete } from '../../../../src/utils/omni-utils'

import { Embeddings } from "langchain/embeddings/base";
import { computeChunkId, initialize_hasher } from "./hashers.js";



var Embedder = class extends Embeddings
{

    // A db-cached version of the embeddings
    // NOTE: This is a general purpose "cached embeddings" class
    // that can wrap any langchain embeddings model
    constructor(ctx, embedder, hasher_model, embedder_model, overwrite = false, params = null)
    {
        //@ts-ignore
        super(params);
        this.embedder = embedder;
        this.embedder_model = embedder_model;
        this.ctx = ctx;
        this.db = ctx.app.services.get("db");
        this.user = ctx.user;
        this.overwrite = false;
        this.hasher_model = hasher_model;
        const hasher = initialize_hasher(hasher_model);
        this.hasher = hasher;

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

    async embedQuery(text, save_embedding = true)
    {
        // TBD we could save query embeddings in a separate vectorstore (instead of not saving them at all using save_embedding = false)
        if (!is_valid(text))
        {
            throw new Error(`[embeddings] passed text is invalid ${text}`);
        }

        console_log(`[embeddings] embedQuery of: ${text.slice(0, 128)}[...]`);

        const embedding_id = computeChunkId(this.ctx, text, this.hasher);
        let embedding = null;

        if (save_embedding)
        {
            if (this.overwrite) 
            {
                await user_db_delete(this.ctx, embedding_id);
            }
            else
            {
                const db_entry = await user_db_get(this.ctx, embedding_id);
                embedding = db_entry?.embedding;
            }

            if (is_valid(embedding)) 
            {
                console_log(`[embeddings]: embedding found in DB - returning it`);
                return embedding;
            }
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
            if (save_embedding)
            {
                const db_value = { embedding: embedding, text: text, id: embedding_id };
                const success = await user_db_put(this.ctx, db_value, embedding_id);
                if (success == false)
                {
                    throw new Error(`[embeddings] Error saving embedding for text chunk: ${text.slice(0, 128)}[...]`);
                }

            }

            return embedding;
        }
        catch (error)
        {
            throw new Error(`[embeddings] Error generating embedding: ${error}`);
        }
    }
  
};




export { Embedder };