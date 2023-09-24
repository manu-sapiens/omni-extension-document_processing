//@ts-check
import { createComponent} from 'omni-utils'; //'omnilib-utils/component.js';
import { countTokens as countTokensFunction } from 'omni-utils'; //'omnilib-llms/tiktoken.js';
import { downloadTextsFromCdn } from 'omni-utils'; //'omnilib-utils/cdn.js';

import { initialize_hasher, computeDocumentId } from './omnilib-docs/hashers.js';
import { initializeSplitter, getSplitterChoices } from './omnilib-docs/splitter.js';
import { initializeEmbedder } from './omnilib-docs/embeddings.js';
import { chunkText, uploadTextWithCaching } from './omnilib-docs/chunking.js';
import { DEFAULT_HASHER_MODEL } from './omnilib-docs/hashers.js';
import { DEFAULT_SPLITTER_MODEL } from './omnilib-docs/splitter.js';
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, saveIndexedDocument, computeTokenToChunkingSizeRatio } from './omnilib-docs/chunking.js';
import { GLOBAL_INDEX_NAME, loadIndexes, addCdnToIndex as addCdnToIndex, saveIndexes, getIndexesChoices, getIndexName, getIndexedDocumentCdnFromId, getIndexedDocumentInfoFromCdn } from './omnilib-docs/vectorstore.js';

const NAMESPACE = 'document_processing';
const OPERATION_ID = "index_documents";
const TITLE = 'Index documents'
const DESCRIPTION = 'Index document(s), chunking them and computing the embedding for each chunk'
const SUMMARY = 'Index document(s), chunking them and computing the embedding for each chunk'
const CATEGORY = 'document processing'

const inputs = [
    { name: 'documents', title: 'Documents to ingest', type: 'array', customSocket: 'documentArray', description: 'Documents to be chunked', allowMultiple: true },
    { name: 'text', type: 'string', title: 'Text to ingest', customSocket: 'text', description: 'And/or some Text to ingest directly', allowMultiple: true  },
    { name: 'splitter_model', type: 'string', defaultValue: 'RecursiveCharacterTextSplitter', title: "Splitter Model", description: "Choosing a splitter model that matches the type of document ingested will produce the best results", choices: getSplitterChoices()},
    { name: 'chunk_size', type: 'number', defaultValue: 4096, minimum: 0, maximum:1000000, step:1 },
    { name: 'chunk_overlap', type: 'number', defaultValue: 512, minimum: 0, maximum:500000, step:1 },
    { name: 'overwrite', type: 'boolean', defaultValue: false, description: "If set to true, will overwrite existing matching documents" },
    { name: 'existing_index', title: 'Existing Indexes', type: 'string', defaultValue: GLOBAL_INDEX_NAME, choices: getIndexesChoices(), description: "If set, will ingest into the existing index with the given name"},
    { name: 'new_index', title: 'Index', type: 'string', description: "All indexed information sharing the same index will be grouped and queried together"},
  ];

const outputs = [
    { name: 'info', type: 'string', customSocket: "text", description: 'Info on the result of the ingestion'},
    { name: 'index', type: 'string', customSocket: "text", description: 'The name of the index that was created or updated' },
    { name: 'documents', title: "Indexed Documents", type: 'array', customSocket: 'documentArray', description: 'The indexed version of the documents' },
  ];

const links = {};

const controls = null;

const IndexDocumentsComponent = createComponent(NAMESPACE, OPERATION_ID,TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, indexDocuments_function );

async function indexDocuments_function(payload, ctx)
{
    console.time("indexDocuments_function");

    const hasher_model = DEFAULT_HASHER_MODEL;

    let info = "";
    const documents_cdns = payload.documents || []
    const text = payload.text;
    const overwrite = payload.overwrite || false;
    const splitter_model = payload.splitter_model || DEFAULT_SPLITTER_MODEL;
    const chunk_size = payload.chunk_size || DEFAULT_CHUNK_SIZE; 
    const chunk_overlap = payload.chunk_overlap || DEFAULT_CHUNK_OVERLAP;

    const index_name = getIndexName(payload.existing_index, payload.new_index);
    
    const hasher = initialize_hasher(hasher_model);
    const splitter = initializeSplitter(splitter_model, chunk_size, chunk_overlap);
    const embedder = await initializeEmbedder(ctx);
    const indexes = await loadIndexes(ctx);
    
    // --------------- UPLOAD if needed----------------
    if (text && text.length > 0) 
    {
        const text_cdn = await uploadTextWithCaching(ctx, text, hasher, chunk_size, chunk_overlap, overwrite);
        if (!text_cdn) throw new Error(`ERROR: could not upload Text to CDN`);
        documents_cdns.push(text_cdn);
        info += `Uploaded text to CDN with fid ${text_cdn.fid} \n`;
    }

    if (!documents_cdns|| documents_cdns.length == 0) throw new Error(`ERROR: no documents passed for ingestion`);
   

    const documents_texts = await downloadTextsFromCdn(ctx, documents_cdns); 


    let all_chunks = [];
    let all_cdns = [];
    let document_index = 0;
    for (const document_text of documents_texts)
    {
        let indexed_document_chunks = null;
        const document_id = computeDocumentId(ctx, [document_text], hasher, chunk_size, chunk_overlap);
        if (!document_id) throw new Error(`ERROR: could not compute document_id for document with index:${document_index}, id:${document_id}`);

        let indexed_document_cdn = await getIndexedDocumentCdnFromId(ctx, document_id, overwrite);
        if (!indexed_document_cdn)
        {
            indexed_document_chunks = await chunkText(ctx, document_id, document_text, hasher, embedder, splitter, countTokensFunction);
            if (!indexed_document_chunks) throw new Error(`ERROR: could not chunk text in document with index:${document_index}, id:${document_id}`);
    
            // compute token_to_chunking_size_ratio. This is somewhat optional, but it is useful to know the rough ratio of tokens to chunking size
            const token_to_chunking_size_ratio = computeTokenToChunkingSizeRatio(indexed_document_chunks, chunk_size, chunk_overlap);
            
            indexed_document_cdn = await saveIndexedDocument(ctx, document_id, indexed_document_chunks, chunk_size, chunk_overlap, token_to_chunking_size_ratio, splitter_model);
        }
        else
        {
            const document_info = await getIndexedDocumentInfoFromCdn(ctx, indexed_document_cdn);
            if (!document_info) throw new Error(`ERROR: could not get document_info from cdn ${JSON.stringify(indexed_document_cdn)}`);

            indexed_document_chunks = document_info.chunks;
            if (!indexed_document_chunks) throw new Error(`ERROR: could not get chunks from document_info = ${JSON.stringify(document_info)} from cdn ${JSON.stringify(indexed_document_cdn)}`);
        }
        
        if (!indexed_document_cdn) throw new Error(`ERROR: could not chunk document with index:${document_index}, id:${document_id}`);
        addCdnToIndex(indexes, indexed_document_cdn, GLOBAL_INDEX_NAME); // always add to Global Index
        if (index_name && index_name != GLOBAL_INDEX_NAME) addCdnToIndex(indexes, indexed_document_cdn, index_name);
     
        all_chunks = all_chunks.concat(indexed_document_chunks);
        all_cdns.push(indexed_document_cdn);

        info += `Uploaded document ${document_index} to CDN with fid ${indexed_document_cdn.fid} and id: ${document_id}\n`
        document_index +=1;
    }
    saveIndexes(ctx, indexes);
    info += `Saved Indexes to DB\n`;
    info += `Indexed ${documents_texts.length} documents in ${all_chunks.length} fragments into Index: ${index_name} \n`;
    info += `Done`;

    console.timeEnd("indexDocuments_function");

    return { result: { "ok": true }, documents: all_cdns, index:index_name, info: info };
}



export { IndexDocumentsComponent, indexDocuments_function as ingestText_function };
