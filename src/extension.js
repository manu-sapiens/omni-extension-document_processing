//@ts-check
// extension.js
import { ChunkFilesComponent } from "./component_ChunkFiles.js";
import { ReadTextFilesComponent } from "./component_ReadTextFiles.js";
import { async_getGptIxPComponent } from "./component_GptIxP.js";
import { async_getLoopGptComponent } from "./component_LoopGPT.js";
import { async_getQueryChunksComponent } from "./component_QueryChunks.js";
import { async_getDocsWithGptComponent } from "./component_DocsWithGPT.js";
import { DownloadFilesComponent } from "./component_DownloadFiles.js";

async function CreateComponents() 
{
  const GptIXPComponent = await async_getGptIxPComponent();
  const LoopGPTComponent = await async_getLoopGptComponent();
  const DocsWithGPTComponent = await async_getDocsWithGptComponent();
  const QueryChunksComponent = await async_getQueryChunksComponent();
  const components = [
    GptIXPComponent, 
    ChunkFilesComponent, 
    LoopGPTComponent, 
    QueryChunksComponent, 
    ReadTextFilesComponent, 
    DocsWithGPTComponent,
    DownloadFilesComponent, 
    ];

  return {
    blocks: components,
    patches: []
  }
}

export default {createComponents: CreateComponents}