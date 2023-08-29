//@ts-check
// extension.js
import { ChunkFilesComponent } from "./component_ChunkFiles.js";
import { ReadTextFilesComponent } from "./component_ReadTextFiles.js";
import { async_getGptIxPComponent } from "./component_GptIxP.js";
import { async_getLoopGptComponent } from "./component_LoopGPT.js";
import { async_getQueryChunksComponent } from "./component_QueryChunks.js";
import { async_getDocsWithGptComponent } from "./component_DocsWithGPT.js";
import { LlmQueryComponent } from "./component_LlmQuery.js";
import { async_getLlmManagerOpenaiComponent } from "./component_LlmManager_Openai.js";
import { async_getLlmManagerOobaboogaComponent } from "./component_LlmManager_Oobabooga.js"; 
import { LlmManagerLmStudioComponent } from "./component_LlmManager_LmStudio.js";
import { LlmQueryComponent_Oobabooga } from "./component_LlmQuery_Oobabooga.js";
import { LlmQueryComponent_LmStudio } from "./component_LlmQuery_LmStudio.js";
import { LlmQueryComponent_Openai } from "./component_LlmQuery_Openai.js";

// TBD: Move async_getLlmManagerOobaboogaComponen and LlmManagerLmStudioComponent into their own extension


async function CreateComponents() 
{
  const GptIXPComponent = await async_getGptIxPComponent();
  const LoopGPTComponent = await async_getLoopGptComponent();
  const DocsWithGPTComponent = await async_getDocsWithGptComponent();
  const QueryChunksComponent = await async_getQueryChunksComponent();
  const LlmManagerOpenaiComponent = await async_getLlmManagerOpenaiComponent();
  const LlmManagerOobaboogaComponent = await async_getLlmManagerOobaboogaComponent();
  const components = [GptIXPComponent, ChunkFilesComponent, LoopGPTComponent, QueryChunksComponent, ReadTextFilesComponent, DocsWithGPTComponent, LlmManagerOpenaiComponent, LlmManagerOobaboogaComponent, LlmManagerLmStudioComponent, LlmQueryComponent, LlmQueryComponent_Openai, LlmQueryComponent_Oobabooga, LlmQueryComponent_LmStudio];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}