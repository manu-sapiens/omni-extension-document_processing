//@ts-check
// ChunkFilesComponent.js
import { createComponent} from 'omni-utils'; //'omnilib-utils/component.js';
import { getDocumentsIndexes} from './omnilib-docs/vectorstore.js';
const NAMESPACE = 'document_processing';
const OPERATION_ID = "get_documents_indexes";
const TITLE = 'Get Documents Indexes'
const DESCRIPTION = 'Get information about the non-empty Indexes currently present'
const SUMMARY = 'Get information about the non-empty Indexes currently present'
const CATEGORY = 'document processing'

const inputs = [];
const outputs = [
    { name: 'indexes', type: 'array', description: 'An array of Index names' },
  ];

const links = {};

const controls = null;

const DocumentsIndexesComponent = createComponent(NAMESPACE, OPERATION_ID,TITLE, CATEGORY, DESCRIPTION, SUMMARY, links, inputs, outputs, controls, getDocumentsIndexes_function );

async function getDocumentsIndexes_function(payload, ctx)
{
    console.time("getDocumentsIndexes_function");

    // --- DEBUG --
    let indexes_info = await getDocumentsIndexes(ctx);
    if (!indexes_info)  return { result: { "ok": false }, indexes: []};

    let indexes = [];

    for (const index of indexes_info)
    {
        indexes.push(index.key);
    }

    return { result: { "ok": true }, indexes: indexes };
}


export { DocumentsIndexesComponent };
