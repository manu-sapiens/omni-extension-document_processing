//@ts-check
// extension.js
import { IndexDocumentsComponent } from "./component_IndexDocuments.js";
import { async_getQueryIndexBruteforceComponent } from "./component_QueryIndexBruteforce.js";
import { async_getQueryIndexComponent } from "./component_QueryIndex.js";
import { DocumentsIndexesComponent } from "./component_GetDocumentsIndexes.js";

async function CreateComponents() 
{
  const LoopGPTComponent = await async_getQueryIndexBruteforceComponent();
  const QueryIndexComponent = await async_getQueryIndexComponent();
  const components = [
    IndexDocumentsComponent, 
    LoopGPTComponent, 
    QueryIndexComponent,  
    DocumentsIndexesComponent,
    ];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}