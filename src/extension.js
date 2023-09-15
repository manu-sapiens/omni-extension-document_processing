//@ts-check
// extension.js
import { IndexDocumentsComponent } from "./component_IndexDocuments.js";
import { ReadTextFilesComponent } from "./component_ReadTextFiles.js";
import { async_getGptIxPComponent } from "./component_GptIxP.js";
import { async_getQueryIndexBruteforceComponent } from "./component_LoopGPT.js";
import { async_getQueryIndexComponent } from "./component_QueryIndex.js";
import { DocumentsIndexesComponent } from "./component_GetDocumentsIndexes.js";

async function CreateComponents() 
{
  const GptIXPComponent = await async_getGptIxPComponent();
  const LoopGPTComponent = await async_getQueryIndexBruteforceComponent();
  const QueryIndexComponent = await async_getQueryIndexComponent();
  const components = [
    GptIXPComponent, 
    IndexDocumentsComponent, 
    LoopGPTComponent, 
    QueryIndexComponent, 
    ReadTextFilesComponent, 
    DocumentsIndexesComponent,
    ];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}