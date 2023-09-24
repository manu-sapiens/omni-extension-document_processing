//@ts-check
import { is_valid, console_log } from 'omni-utils';//'omnilib-utils/utils.js';
import { user_db_put, user_db_get, user_db_delete } from 'omni-utils';//'omnilib-utils/database.js';

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

        /*
        this.indexes = {};


        if (!this.ctx)
        {
            throw new Error(`[embeddings] Context not provided`);
        }
        
        if (!this.embedder) this.loadIndexes(this.ctx);
        */
    }

    /*
    // Function to save keys
    async saveIndexes()
    {
        await user_db_put(this.ctx, this.indexes, INDEXES_LIST);
    }
    */
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

    async embedQuery(text, index_name = "", save_embedding = true)
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

                /*
                this.addCdnToIndex(GLOBAL_INDEX_NAME, embedding_id);
                if (index_name && index_name != "" && index_name != GLOBAL_INDEX_NAME) this.addCdnToIndex(index_name, embedding_id);
                

                // Save the updated list of keys to the database.
                await this.saveIndexes();
                */
            }

            return embedding;
        }
        catch (error)
        {
            throw new Error(`[embeddings] Error generating embedding: ${error}`);
        }
    }
    /*
    addCdnToIndex(index_name, embedding_id)
    {
        if (index_name in this.indexes === false || this.indexes[index_name] === null || this.indexes[index_name] === undefined || Array.isArray(this.indexes[index_name]) === false)
        {
            this.indexes[index_name] = [embedding_id];
        }
        else
        {
            this.indexes[index_name].push(embedding_id);
        }
    }
    
    async getAllDbEntries(index_name)
    {
        const dbEntries = [];
        if (index_name in this.indexes === false) return null;
        const keys = this.indexes[index_name];

        if (Array.isArray(keys) === false)
        {
          throw new Error(`UNEXPECTED type for keys: ${typeof keys}, keys = ${JSON.stringify(keys)}, this.indexes = ${JSON.stringify(this.indexes)}, index_name = ${index_name}`);
        }
        for (const key of keys)
        {
            const embedding = await user_db_get(this.ctx, key);
            if (embedding)
            {
                dbEntries.push(embedding);
            } else
            {
                console.warn(`[embeddings] Could not retrieve embedding for key: ${key}`);
            }
        }

        return dbEntries;
    }
    
    async getAllTextsAndIds()
    {
        const allEntries = await this.getAllDbEntries();
        const allTexts = allEntries?.map(db_entry => db_entry.text);
        const allIds = allEntries?.map(db_entry => db_entry.id);
        return [allTexts, allIds];
    }

    async loadIndexes(ctx) 
    {
        const loadedData = await user_db_get(ctx, INDEXES_LIST);
        this.indexes = loadedData || {};
        return;
    }
    */
};




export { Embedder };