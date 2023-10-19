//@ts-check
import { console_log, is_valid } from '../../../../src/utils/omni-utils';

import { Hasher_SHA256 } from "./hasher_SHA256.js";

const HASHER_MODEL_SHA256 = "SHA256";
const DEFAULT_HASHER_MODEL = HASHER_MODEL_SHA256;


function computeChunkId(ctx, text, hasher)
{
    const user = ctx.userId;
    const hash = hasher.hash(text);
    const chunk_id = `chunk_${user}_${hash}`;

    console_log(`Computed chunk_id : ${chunk_id} for text length: ${text.length}, hash: ${hash}, user = ${user}, start = ${text.slice(0, 256)}, end = ${text.slice(-256)}`);

    return chunk_id;
}


export function computeDocumentId(ctx, texts, hasher, chunk_size, chunk_overlap)
{
    // get the key so that we can pass it around
    if (is_valid(texts) == false) throw new Error(`ERROR: texts is invalid`);

    const user = ctx.userId;
    const document_hash = hasher.hash_list(texts);
    const document_id = `doc_${user}_${document_hash}_${chunk_size}_${chunk_overlap}`;

    return document_id;
}

function initialize_hasher(hasher_model = DEFAULT_HASHER_MODEL)
{

    let hasher = null;
    if (hasher_model == HASHER_MODEL_SHA256) hasher = new Hasher_SHA256();
    else  
    {
        throw new Error(`initialize_hasher: Unknown hasher model: ${hasher_model}`);
    }
    // TBD: more hasher choices here
    try{

        const validate_text = "this and that"
        const validate_hash1 = hasher.hash(validate_text);
        const validate_hash2 = hasher.hash(validate_text);

        if (validate_hash1 != validate_hash2) throw new Error(`hasher: ${hasher_model} is not stable`);

    }
    catch (e)
    {
        
        throw new Error(`get_hasher: Failed to initialize hasher_model ${hasher_model} with error: ${e}`);
    }
    return hasher;
}


export { computeChunkId, initialize_hasher}
export { DEFAULT_HASHER_MODEL }