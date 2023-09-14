//@ts-check
// extension.js
import { IndexDocumentsComponent } from "./component_IndexDocuments.js";
import { ReadTextFilesComponent } from "./component_ReadTextFiles.js";
import { async_getGptIxPComponent } from "./component_GptIxP.js";
import { async_getLoopGptComponent } from "./component_LoopGPT.js";
import { async_getQueryindexComponent } from "./component_QueryIndex.js";
import { DocumentsIndexesComponent } from "./component_GetDocumentsIndexes.js";

async function CreateComponents() 
{
  const GptIXPComponent = await async_getGptIxPComponent();
  const LoopGPTComponent = await async_getLoopGptComponent();
  const QueryIndexComponent = await async_getQueryindexComponent();
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