// embedder.js

import { CachedEmbeddings, OmniOpenAIEmbeddings } from './embeddings.js';
import { TensorFlowEmbeddings } from "langchain/embeddings/tensorflow";
import { console_log } from './utils.js';
import { DEFAULT_VECTORSTORE_NAME } from './configs.js';
import "@tensorflow/tfjs-backend-cpu";

//const EMBEDINGS_ADA_2 = "text-embedding-ada-002";
const EMBEDDER_MODEL_OPENAI = "openai";
const EMBEDDER_MODEL_TENSORFLOW = "tensorflow";
const DEFAULT_EMBEDDER_MODEL = EMBEDDER_MODEL_TENSORFLOW;

function initialize_embedder(ctx, embedder_model = DEFAULT_EMBEDDER_MODEL, hasher, vectorstore_name = DEFAULT_VECTORSTORE_NAME, overwrite = false)
{

    let raw_embedder = null
    if (embedder_model == EMBEDDER_MODEL_OPENAI)
    {
        console_log("Using embedder: EMBEDDER_MODEL_OPENAI <------------------");
        raw_embedder = new OmniOpenAIEmbeddings(ctx);
    }
    else if (embedder_model == EMBEDDER_MODEL_TENSORFLOW) 
    {
        console_log("Using embedder: EMBEDDER_MODEL_TENSORFLOW <------------------");
        raw_embedder = new TensorFlowEmbeddings();
    }
    const embedder = new CachedEmbeddings(ctx, raw_embedder, hasher, vectorstore_name, overwrite);

    // TBD: more embeddings here

    if (embedder == null || embedder == undefined) throw new Error(`get_embedder: Failed to initialize embeddings_model ${embedder_model}`);
    return embedder;
}

export { initialize_embedder, DEFAULT_EMBEDDER_MODEL }