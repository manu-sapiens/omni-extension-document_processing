//@ts-check
// extension.js
import { ChunkFilesComponent } from "./component_ChunkFiles.js";
import { ReadTextFilesComponent } from "./component_ReadTextFiles.js";
import { async_getGptIxPComponent } from "./component_GptIxP.js";
import { async_getLoopGptComponent } from "./component_LoopGPT.js";
import { async_getQueryChunksComponent } from "./component_QueryChunks.js";
import { async_getDocsWithGptComponent } from "./component_DocsWithGPT.js";
import { async_getLlmQueryComponent } from "./component_LlmQuery.js";
import { async_getLlmManagerOpenaiComponent } from "./component_LlmManager_Openai.js";
import { async_getLlmManagerOobaboogaComponent } from "./component_LlmManager_Oobabooga.js"; 
// TBD: Move async_getLlmManagerOobaboogaComponent into its own extension
// TBD: Creaate async_getLlmManagerLmStudioComponent

async function CreateComponents() 
{
  const GptIXPComponent = await async_getGptIxPComponent();
  const LoopGPTComponent = await async_getLoopGptComponent();
  const DocsWithGPTComponent = await async_getDocsWithGptComponent();
  const QueryChunksComponent = await async_getQueryChunksComponent();
  const LlmQueryComponent = await async_getLlmQueryComponent();
  const LlmManagerOpenaiComponent = await async_getLlmManagerOpenaiComponent();
  const LlmManagerOobaboogaComponent = await async_getLlmManagerOobaboogaComponent();
  const components = [GptIXPComponent, ChunkFilesComponent, LoopGPTComponent, QueryChunksComponent, ReadTextFilesComponent, DocsWithGPTComponent, LlmQueryComponent, LlmManagerOpenaiComponent, LlmManagerOobaboogaComponent];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}