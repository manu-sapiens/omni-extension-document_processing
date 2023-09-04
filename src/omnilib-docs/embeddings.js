//@ts-check
import { Embedder, saveEmbedderParameters } from './embedder.js';
import { Embedding_Openai } from './embedding_Openai.js';
import { DEFAULT_HASHER_MODEL } from './hashers.js';
//import { TensorFlowEmbeddings } from "langchain/embeddings/tensorflow";
//import "@tensorflow/tfjs-backend-cpu";
import { DEFAULT_VECTORSTORE_NAME } from './vectorstore.js';
import { loadVectorstoreKeys } from './embedder.js';

//const EMBEDINGS_ADA_2 = "text-embedding-ada-002";
const EMBEDDER_MODEL_OPENAI = "openai";
const EMBEDDER_MODEL_TENSORFLOW = "tensorflow";
const DEFAULT_EMBEDDER_MODEL = EMBEDDER_MODEL_OPENAI//EMBEDDER_MODEL_TENSORFLOW;

async function initializeEmbedder(ctx, embedder_model = DEFAULT_EMBEDDER_MODEL, hasher_model= DEFAULT_HASHER_MODEL, vectorstore_name = DEFAULT_VECTORSTORE_NAME, overwrite = false)
{

    let raw_embedder = null
    if (embedder_model == EMBEDDER_MODEL_OPENAI)
    {
        raw_embedder = new Embedding_Openai(ctx);
    }
    else if (embedder_model == EMBEDDER_MODEL_TENSORFLOW) 
    {
     //   console_log("Using embedder: EMBEDDER_MODEL_TENSORFLOW <------------------");
     //   raw_embedder = new TensorFlowEmbeddings();
     throw new Error ("tensorflow embedding not supported at the moment")
    }
    const embedder = new Embedder(ctx, raw_embedder, hasher_model, embedder_model, vectorstore_name, overwrite);
    
    if (embedder == null || embedder == undefined) throw new Error(`get_embedder: Failed to initialize embeddings_model ${embedder_model}`);
    saveEmbedderParameters(ctx, embedder);

    await loadVectorstoreKeys(ctx, embedder);
    return embedder;
}


export { initializeEmbedder, DEFAULT_EMBEDDER_MODEL }