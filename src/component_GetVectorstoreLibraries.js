//@ts-check
// ChunkFilesComponent.js
import { omnilog } from 'mercs_shared'
import { createComponent} from 'omnilib-utils/component.js';
import { initialize_hasher, compute_document_id } from './omnilib-docs/hashers.js';
import { save_json_to_cdn_as_buffer, gather_all_texts_from_documents } from 'omnilib-utils/cdn.js';
import { initialize_splitter } from './omnilib-docs/splitter.js';
import { initializeEmbedder } from './omnilib-docs/embeddings.js';
import { processChapter, uploadTextWithCaching } from './omnilib-docs/chunking.js';
import { computeVectorstore, clean_vectorstore_name, DEFAULT_VECTORSTORE_NAME } from './omnilib-docs/vectorstore.js';
import { getVectorstoreLibraries } from './omnilib-docs/embedder.js';
import { DEFAULT_HASHER_MODEL } from './omnilib-docs/hashers.js';
import { DEFAULT_EMBEDDER_MODEL } from './omnilib-docs/embeddings.js';
import { DEFAULT_SPLITTER_MODEL } from './omnilib-docs/splitter.js';
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from './omnilib-docs/chunking.js';
import { countTokens } from 'omnilib-llms/tiktoken.js';

const NAMESPACE = 'document_processing';
const OPERATION_ID = "get_vectorstore_libraries";
const TITLE = 'Get Vectorstore Libraries'
const DESCRIPTION = 'Get information about the non-empty Libraries currently present'
const SUMMARY = 'Get information about the non-empty Vectorstore Libraries currently present'
const CATEGORY = 'document processing'

const inputs = [];
const outputs = [
    { name: 'libraries', type: 'array', description: 'An array of libraries, each with a key and a length' },
  ];

const links = {};

const controls = null;

const VectorstoreLibrariesComponent = createComponent(NAMESPACE, OPERATION_ID,TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, getVectorstoreLibraries_function );

async function getVectorstoreLibraries_function(payload, ctx)
{
    console.time("getVectorstoreLibraries_function");

    // --- DEBUG --
    let libraries_info = await getVectorstoreLibraries(ctx);
    if (!libraries_info)  return { result: { "ok": false }, libraries: []};

    const libraries = [];

    var found_default = false;
    for (const library of libraries_info)
    {
        if (library.key == DEFAULT_VECTORSTORE_NAME) found_default = true;
        libraries.push(`${library.key}   [${library.length}]`);
        omnilog.warn("Library: " + library.key + " has " + library.length + " chunks" + " and " + libraries.length + " entries");

    }
    if (found_default == false) libraries.push(`${DEFAULT_VECTORSTORE_NAME}   [empty]`);

    omnilog.warn("Library has #"+ libraries.length + " entries");
    return { result: { "ok": true }, libraries: libraries };
}


export { VectorstoreLibrariesComponent };
