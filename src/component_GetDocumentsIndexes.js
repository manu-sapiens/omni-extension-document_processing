//@ts-check
// ChunkFilesComponent.js
import { createComponent} from '../../../src/utils/omni-utils.js';
import { getDocumentsIndexes} from './omnilib-docs/vectorstore.js';
const NAMESPACE = 'document_processing';
const OPERATION_ID = "get_documents_indexes";
const TITLE = 'Get Documents Indexes'
const DESCRIPTION = 'Get information about the non-empty Indexes currently present'
const SUMMARY = 'Get information about the non-empty Indexes currently present'
const CATEGORY = 'document processing'

const inputs = [];
const outputs = [
    { name: 'indexes', type: 'array', description: 'An array of all the Index names in the database' },
    { name: 'info', type: 'string', description: 'Info on all the indexes in the database' },
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
    let info = `Indexes in the database: ${indexes_info.length}, \n`;
    for (const index of indexes_info)
    {
        indexes.push(index.key);
        info += `${index.key} : ${index.length} documents, \n`;
    }

    return { result: { "ok": true }, indexes, info };
}


export { DocumentsIndexesComponent };
