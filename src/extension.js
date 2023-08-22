// extension.js
import { ChunkFilesComponent } from "./ChunkFilesComponent.js";
import { async_get_gpt_IxP_component } from "./GptIXPComponent.js";
import { async_get_loop_gpt_component } from "./LoopGPTComponent.js";
import { async_GetQueryChunksComponent } from "./QueryChunksComponent.js";
import { ReadTextFilesComponent } from "./ReadTextFilesComponent.js";
import { async_get_docs_with_gpt_component } from "./DocsWithGPTComponent.js";


async function CreateComponents() 
{
  const GptIXPComponent = await async_get_gpt_IxP_component();
  const LoopGPTComponent = await async_get_loop_gpt_component();
  const DocsWithGPTComponent = await async_get_docs_with_gpt_component();
  const QueryChunksComponent = await async_GetQueryChunksComponent();
  const components = [GptIXPComponent, ChunkFilesComponent, LoopGPTComponent, QueryChunksComponent, ReadTextFilesComponent, DocsWithGPTComponent];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}