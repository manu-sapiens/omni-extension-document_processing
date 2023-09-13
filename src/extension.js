//@ts-check
// extension.js
import { IngestTextComponent } from "./component_IngestText.js";
import { ReadTextFilesComponent } from "./component_ReadTextFiles.js";
import { async_getGptIxPComponent } from "./component_GptIxP.js";
import { async_getLoopGptComponent } from "./component_LoopGPT.js";
import { async_getQueryLibraryComponent } from "./component_QueryLibrary.js";

async function CreateComponents() 
{
  const GptIXPComponent = await async_getGptIxPComponent();
  const LoopGPTComponent = await async_getLoopGptComponent();
  const QueryLibraryComponent = await async_getQueryLibraryComponent();
  const components = [
    GptIXPComponent, 
    IngestTextComponent, 
    LoopGPTComponent, 
    QueryLibraryComponent, 
    ReadTextFilesComponent, 
    ];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}