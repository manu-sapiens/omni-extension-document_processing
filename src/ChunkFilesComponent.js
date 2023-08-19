// ChunkFilesComponent.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { omnilog } from 'mercs_shared'
import { setComponentInputs, setComponentOutputs, setComponentControls } from './utils/components_lib.js';
const NS_ONMI = 'document_processing';

import { initialize_hasher, compute_document_id } from './utils/hashers.js';
import { save_json_to_cdn_as_buffer, gather_all_texts_from_documents } from './utils/cdn.js';
import { initialize_splitter } from './utils/splitter.js';
import { initialize_embedder } from './utils/embedder.js';
import { process_chapter } from './utils/chunking.js';
import { clean_vectorstore_name, DEFAULT_VECTORSTORE_NAME } from './utils/vectorstore.js';
import { DEFAULT_HASHER_MODEL } from './utils/hashers.js';
import { DEFAULT_EMBEDDER_MODEL } from './utils/embedder.js';
import { DEFAULT_SPLITTER_MODEL } from './utils/splitter.js';
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from './utils/chunking.js';
import { printObject } from './utils/utils.js';

let chunk_files_component = OAIBaseComponent
    .create(NS_ONMI, "chunk_files")
    .fromScratch()
    .set('title', 'Chunk Files')
    .set('category', 'text manipulation')
    .set('description', 'Chunk files')
    .setMethod('X-CUSTOM')
    .setMeta({
        source: {
            summary: 'Chunk Files',
            links: {
                'OpenAI Chat GPT function calling': 'https://platform.openai.com/docs/guides/gpt/function-calling'
            }
        }
    });

// Adding input(s)
const inputs = [
    { name: 'documents', title: 'documents', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked' },
    { name: 'embedder_model', title: 'Embedder Model', type: 'string', defaultValue: 'tensorflow', 
        choices: [
            {value:"openai", title: "OpenAI embeddings"}, 
        ],},
    { name: 'splitter_model', type: 'string', defaultValue: 'RecursiveCharacterTextSplitter', title: "Splitted Model" ,
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
    { name: 'chunk_size', type: 'number', defaultValue: 512 },
    { name: 'chunk_overlap', type: 'number', defaultValue: 64 },
    { name: 'overwrite', type: 'boolean', defaultValue: false },
    { name: 'vectorstore_name', type: 'string', description: 'All injested information sharing the same vectorstore will be grouped and queried together', title: "Vector-Store Name" },
  ];
chunk_files_component = setComponentInputs(chunk_files_component, inputs);

// Adding output(s)
const outputs = [
    { name: 'text', type: 'string', customSocket: 'text', description: 'Result Text', title: 'Result Text' },
    { name: 'files', type: 'array', customSocket: 'cdnObjectArray', description: 'The chunked texts files' },
    { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'The chunked texts documents' },
  ];
chunk_files_component = setComponentOutputs(chunk_files_component, outputs);


// Adding _exec function
chunk_files_component.setMacro(OmniComponentMacroTypes.EXEC, chunk_files_parse);


async function chunk_files_parse(payload, ctx)
{

    // Copy fields from args to payload
    for (let key in payload.args)
    {
        payload[key] = payload.args[key];
    }

    // Remove args from payload
    delete payload.args;


    const documents_cdns = payload.documents;
    const overwrite = payload.overwrite || false;

    const vectorstore_name = payload.vectorstore_name;
    const splitter_model = payload.splitter_model;
    const embedder_model = payload.embedder_model;

    const chunk_size = payload.chunk_size;
    const chunk_overlap = payload.chunk_overlap;

    let return_value = { result: { "ok": false }, documents: [], files: [] };
    if (payload.documents)
    {
        const result_cdns = await chunk_files_function(ctx, documents_cdns, overwrite, vectorstore_name, embedder_model, splitter_model, chunk_size, chunk_overlap);
        return_value = { result: { "ok": true }, documents: result_cdns, files: result_cdns };
    }

    return return_value;
}

async function chunk_files_function(ctx, documents, overwrite = false, vectorstore_name = DEFAULT_VECTORSTORE_NAME, embedder_model = DEFAULT_EMBEDDER_MODEL, splitter_model = DEFAULT_SPLITTER_MODEL, chunk_size = DEFAULT_CHUNK_SIZE, chunk_overlap = DEFAULT_CHUNK_OVERLAP)
{
    omnilog.log(`--------------------------------`);
    printObject(ctx, "[chunk_files_component] chunk_files_parse() ctx=");

    console.time("chunk_files_component_processTime");

    vectorstore_name = clean_vectorstore_name(vectorstore_name);
    const hasher_model = DEFAULT_HASHER_MODEL;
    const hasher = initialize_hasher(hasher_model);
    const splitter = initialize_splitter(splitter_model, chunk_size, chunk_overlap);
    const embedder = initialize_embedder(ctx, embedder_model, hasher, vectorstore_name, overwrite);

    omnilog.log(`[chunk_files_component] splitter_model = ${splitter_model}, embedder_model = ${embedder_model}`);


    const chapters = await gather_all_texts_from_documents(ctx, documents);
    // gather an array of texts, 1 per document. we will split and chunk them separately
    // if collate is true, we will then put them all in the same arrays
    // This allows to feed a book as an array of chapters, for examplea and have chunks that do not overlap across chapter transitions
    // For this reason, we call each of the passed documents a 'chapter'

    let cdns = [];
    let all_texts = "";
    let all_chunks = [];
    for (let chapter_index = 0; chapter_index < chapters.length; chapter_index++)
    {
        const text = chapters[chapter_index];
        const chapter_id = compute_document_id(ctx, [text], vectorstore_name, hasher);
        let response = await process_chapter(ctx, text, vectorstore_name, hasher, embedder, splitter, chapter_id, overwrite, hasher_model, embedder_model, splitter_model);

        const document_json = response.json;
        all_texts += text + "\n\n";
        all_chunks = all_chunks.concat(document_json.chunks);

    }

    omnilog.log(`collating #${chapters.length} chapters with combined # of chunks = ${all_chunks.length}`);
    const collated_document_id = compute_document_id(ctx, [all_texts], vectorstore_name, hasher);
    const collated_json = { id: collated_document_id, hasher_model: hasher_model, embedder_model: embedder_model, splitter_model: splitter_model, vectorstore_name: vectorstore_name, chunks: all_chunks, chapters: chapters };
    const collated_document_cdn = await save_json_to_cdn_as_buffer(ctx, collated_json);
    cdns = [collated_document_cdn];

    console.timeEnd("chunk_files_component_processTime");

    return cdns;
}

const ChunkFilesComponent = chunk_files_component.toJSON();
export { ChunkFilesComponent, chunk_files_function };
