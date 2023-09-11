//@ts-check
// embeddings.js

import { Embeddings } from "langchain/embeddings/base";
import { is_valid, console_log } from 'omnilib-utils/utils.js';
import { DEFAULT_VECTORSTORE_NAME } from "./vectorstore.js";
import { compute_chunk_id, initialize_hasher } from "./hashers.js";
import { user_db_put, user_db_get, user_db_delete } from 'omnilib-utils/database.js';

// omnilib-docs/embedder.js
const VECTORSTORE_KEY_LIST_ID = "vectorstore_key_list";

var Embedder = class extends Embeddings {

  // A db-cached version of the embeddings
  // NOTE: This is a general purpose "cached embeddings" class
  // that can wrap any langchain embeddings model
  constructor(ctx, embedder, hasher_model, embedder_model, vectorstore_name = DEFAULT_VECTORSTORE_NAME, overwrite = false, params = null) {
    //@ts-ignore
    super(params);
    this.embedder = embedder;
    this.embedder_model = embedder_model;
    this.ctx = ctx;
    this.db = ctx.app.services.get("db");
    this.user = ctx.user;
    this.vectorstore_name = vectorstore_name;
    this.overwrite = false;
    this.hasher_model = hasher_model;
    const hasher = initialize_hasher(hasher_model);
    this.hasher = hasher;
    this.vectorstore_keys= {};
    
    if (!this.ctx) {
      throw new Error(`[embeddings] Context not provided`);
    }
  }


    // Function to save keys
    async saveVectorstoreKeys()
    {
        await user_db_put(this.ctx, this.vectorstore_keys, VECTORSTORE_KEY_LIST_ID);
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

        const embedding_id = compute_chunk_id(this.ctx, text, this.vectorstore_name, this.hasher);
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
        
                const keys = this.vectorstore_keys[this.vectorstore_name];

                if (Array.isArray(keys) === false)
                {
                throw new Error(`UNEXPECTED type for keys: ${typeof keys}, keys = ${JSON.stringify(keys)}, this.vectorstoreKeys = ${JSON.stringify(this.vectorstore_keys)}, vectorstore_name= ${this.vectorstore_name}`);
                }
                
                // Add the key to the Set.
                keys.push(embedding_id);

                // Save the updated list of keys to the database.
                await this.saveVectorstoreKeys();
            }

            return embedding;
        }
        catch (error)
        {
            throw new Error(`[embeddings] Error generating embedding: ${error}`);
        }
    }

    async getAllDbEntries()
    {
        const dbEntries = [];
        if (this.vectorstore_name in this.vectorstore_keys === false) return null;

        const keys = this.vectorstore_keys[this.vectorstore_name];
        if (Array.isArray(keys) === false)
        {
          throw new Error(`UNEXPECTED type for keys: ${typeof keys}, keys = ${JSON.stringify(keys)}, this.vectorstoreKeys = ${JSON.stringify(this.vectorstore_keys)}, vectorstore_name= ${this.vectorstore_name}`);
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
}

async function saveEmbedderParameters(ctx, embedder)
{
    const hasher_model = embedder.hasher_model;
    const vectorstore_name = embedder.vectorstore_name;
    const embedder_model = embedder.embedder_model;
    const embedder_id = `EMBEDDERS_STORAGE_${vectorstore_name}`;
    const db_value = { hasher_model: hasher_model, vectorstore_name: vectorstore_name, embedder_model: embedder_model };

    const success = await user_db_put(ctx, db_value, embedder_id);
    const check = await user_db_get(ctx, embedder_id );
    if (!check) throw new Error(`ERROR could not retrieve after saving in the db`);
    
    return success;
}
async function loadEmbedderParameters(ctx, vectorstore_name)
{
    const embedder_id = `EMBEDDERS_STORAGE_${vectorstore_name}`;
    const entry = await user_db_get(ctx, embedder_id);
    if (!entry) throw new Error(`[loadEmbedderParameters] Error loading embedder parameters for vectorstore_name = ${vectorstore_name}`);
    return entry;
}

async function loadVectorstoreKeys(ctx, embedder) 
{
    const loadedData = await user_db_get(ctx, VECTORSTORE_KEY_LIST_ID);
    const vectorstore_keys = loadedData || {};
    embedder.vectorstore_keys = vectorstore_keys;

    return;
}


async function getVectorstoreChoices(ctx)
{
    const loadedData = await user_db_get(ctx, VECTORSTORE_KEY_LIST_ID);
    const vectorstore_keys = loadedData || null;
    if (!vectorstore_keys) return null;

    const choices = [];

    // Iterate through each key in the dictionary
    for (const [vectorstore_name, records] of Object.entries(vectorstore_keys)) {
      
      // Check if the value is a non-null array
      if (Array.isArray(records) && records !== null) 
      {
        const length = records.length;
        const choice = { value: vectorstore_name, title: `${vectorstore_name} [${length}]`, description: `${vectorstore_name} with ${length} chunks recorded`};
        // Add information to the result array
        choices.push(choice);
      }

    }
    return choices;
}
export { Embedder, saveEmbedderParameters, loadEmbedderParameters, loadVectorstoreKeys, getVectorstoreChoices };