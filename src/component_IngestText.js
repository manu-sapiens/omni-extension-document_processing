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
const OPERATION_ID = "ingest_text";
const TITLE = 'Ingest Text'
const DESCRIPTION = 'Ingest Text into a Library for later querying'
const SUMMARY = 'Ingest Text into Library'
const CATEGORY = 'document processing'

const libraries_block_name = `omni-extension-document_processing:document_processing.get_vectorstore_libraries`;
const library_choices = {
    "block": libraries_block_name,
    "args": {},
    "cache": "user",
    "map": { "root": "libraries" }
};

const inputs = [
    { name: 'documents', title: 'Documents to ingest', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked', allowMultiple: true },
    { name: 'text', type: 'string', title: 'Text to ingest', customSocket: 'text', description: 'And/or some Text to ingest directly', allowMultiple: true  },
    { name: 'splitter_model', type: 'string', defaultValue: 'RecursiveCharacterTextSplitter', title: "Splitter Model", description: "Choosing a splitter model that matches the type of document ingested will produce the best results",
        choices: [
            {value: "RecursiveCharacterTextSplitter", title: "RecursiveCharacterTextSplitter"},
            {value: "TokenTextSplitter", title: "TokenTextSplitter"},
            {value: "CodeSplitter_cpp", title: "CodeSplitter_cpp"},
            {value: "CodeSplitter_go", title: "CodeSplitter_go"},
            {value: "CodeSplitter_java",  title: "CodeSplitter_java"},
            {value: "CodeSplitter_ruby",  title: "CodeSplitter_ruby"},
            {value: "CodeSplitter_js",  title: "CodeSplitter_js"},
            {value: "CodeSplitter_php",  title: "CodeSplitter_php"},
            {value: "CodeSplitter_proto",  title: "CodeSplitter_proto"},
            {value: "CodeSplitter_python",  title: "CodeSplitter_python"},
            {value: "CodeSplitter_rst",  title: "CodeSplitter_rst"},
            {value: "CodeSplitter_rust",  title: "CodeSplitter_rust"},
            {value:  "CodeSplitter_scala",  title: "CodeSplitter_scala"},
            {value: "CodeSplitter_swift",  title: "CodeSplitter_swift"},
            {value: "CodeSplitter_markdown",  title: "CodeSplitter_markdown"},
            {value: "CodeSplitter_latex",  title: "CodeSplitter_latex"},
            {value: "CodeSplitter_html", title: "CodeSplitter_html"},
        ]},
    { name: 'chunk_size', type: 'number', defaultValue: 4096, minimum: 1, maximum:32768, step:1 },
    { name: 'chunk_overlap', type: 'number', defaultValue: 512, minimum: 0, maximum:32768, step:1 },
    { name: 'overwrite', type: 'boolean', defaultValue: false, description: "If set to true, will overwrite existing matching documents" },
    { name: 'existing_library', type: 'string', defaultValue: `${DEFAULT_VECTORSTORE_NAME}   [empty]`, choices: library_choices, description: "If set, will ingest into the existing library with the given name"},
    { name: 'new_library', title: 'New Library', type: 'string', description: "All injested information sharing the same Library will be grouped and queried together"},
  ];

const outputs = [
    { name: 'info', type: 'string', customSocket: "text", description: 'Info on the result of the ingestion'},
    { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'A chunked version of the ingested texts' },
  ];

const links = {};

const controls = null;

const IngestTextComponent = createComponent(NAMESPACE, OPERATION_ID,TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, ingestText_function );

async function ingestText_function(payload, ctx)
{
    console.time("ingestText_function");

    const embedder_model =  DEFAULT_EMBEDDER_MODEL;
    const hasher_model = DEFAULT_HASHER_MODEL;

    let info = "";
    const documents = payload.documents || []
    const text = payload.text;
    const overwrite = payload.overwrite || false;
    const splitter_model = payload.splitter_model || DEFAULT_SPLITTER_MODEL;
    const chunk_size = payload.chunk_size || DEFAULT_CHUNK_SIZE; 
    const chunk_overlap = payload.chunk_overlap || DEFAULT_CHUNK_OVERLAP;
    const new_library = clean_vectorstore_name(payload.new_library);
    const existing_library = payload.existing_library;

    let library_name = new_library;

    if ( (!new_library || new_library.length == 0) && ( existing_library && existing_library.length > 0) ) 
    {
        let parts = existing_library.split("   ");  // Split the string by three spaces
        library_name = parts[0];
    }
    if (!library_name || library_name.length == 0) throw new Error(`ERROR: no library name passed for ingestion`);

    const hasher = initialize_hasher(hasher_model);
    const splitter = initialize_splitter(splitter_model, chunk_size, chunk_overlap);
    const embedder = await initializeEmbedder(ctx, embedder_model, hasher_model, library_name, overwrite);
    
    // --------------- UPLOAD ----------------
    if (text && text.length > 0) 
    {
        const text_cdn = await uploadTextWithCaching(ctx, text, library_name, hasher, overwrite);
        if (!text_cdn) throw new Error(`ERROR: could not upload Text to CDN`);
        documents.push(text_cdn);
        info += `Uploaded text to CDN with fid ${text_cdn.fid} \n`;
    }

    if (!documents|| documents.length == 0) throw new Error(`ERROR: no documents passed for ingestion`);
   

    const chapters = await gather_all_texts_from_documents(ctx, documents);
    
    // gather an array of texts, 1 per document. we will split and chunk them separately
    // if collate is true, we will then put them all in the same arrays
    // This allows to feed a book as an array of chapters, for examplea and have chunks that do not overlap across chapter transitions
    // For this reason, we call each of the passed documents a 'chapter'

    let all_texts = "";
    let all_chunks = [];
    for (let chapter_index = 0; chapter_index < chapters.length; chapter_index++)
    {
        const text = chapters[chapter_index];
        const chapter_id = compute_document_id(ctx, [text], library_name, hasher);
        let response = await processChapter(ctx, text, library_name, hasher, embedder, splitter, chapter_id, overwrite, hasher_model, embedder_model, splitter_model, countTokens);
        if (!response) throw new Error(`ERROR: could not process chapter ${chapter_id}`);
        const document_json = response.json;
        if (!document_json) throw new Error(`ERROR: could not process chapter ${chapter_id} with response: ${JSON.stringify(response)}`);
     
        all_texts += text + "\n\n";
        all_chunks = all_chunks.concat(document_json.chunks);

        info += `Uploaded chapter to CDN with fid ${response.cdn?.fid} \n`

    }

    omnilog.log(`collating #${chapters.length} chapters with combined # of chunks = ${all_chunks.length}`);
    const collated_document_id = compute_document_id(ctx, [all_texts], library_name, hasher);
    const collated_json = { id: collated_document_id, hasher_model: hasher_model, embedder_model: embedder_model, splitter_model: splitter_model, vectorstore_name: library_name, chunks: all_chunks, chapters: chapters };
    const collated_document_cdn = await save_json_to_cdn_as_buffer(ctx, collated_json);

    info += `Uploaded collated document to CDN with fid ${collated_document_cdn?.fid} \n`;

    // -------------- INGEST INTO VECTORSTORE ----------------
    const vectorstore = await computeVectorstore(all_chunks, embedder);
    if (!vectorstore) throw new Error(`ERROR: could not compute Library ${library_name} from ${all_chunks.length} chunks`);

    info += `Ingested ${all_chunks.length} chunks of documents into Library: ${library_name} \n`;
    console.timeEnd("ingestText_function");

    return { result: { "ok": true }, documents: [collated_document_cdn], info: info };
}


export { IngestTextComponent, ingestText_function };
