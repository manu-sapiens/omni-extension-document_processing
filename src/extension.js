//@ts-check
// extension.js
import { ChunkFilesComponent } from "./component_ChunkFiles.js";
import { async_get_gpt_IxP_component } from "./component_GptIxP.js";
import { async_getLoopGptComponent } from "./component_LoopGPT.js";
import { async_GetQueryChunksComponent } from "./component_QueryChunks.js";
import { ReadTextFilesComponent } from "./component_ReadTextFiles.js";
import { async_getDocsWithGptComponent } from "./component_DocsWithGPT.js";


async function CreateComponents() 
{
  const GptIXPComponent = await async_get_gpt_IxP_component();
  const LoopGPTComponent = await async_getLoopGptComponent();
  const DocsWithGPTComponent = await async_getDocsWithGptComponent();
  const QueryChunksComponent = await async_GetQueryChunksComponent();
  const components = [GptIXPComponent, ChunkFilesComponent, LoopGPTComponent, QueryChunksComponent, ReadTextFilesComponent, DocsWithGPTComponent];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}