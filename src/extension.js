// extension.js
import { ChunkFilesComponent } from "./ChunkFilesComponent.js";
import { GptIXPComponent } from "./GptIXPComponent.js";
import { LoopGPTComponent } from "./LoopGPTComponent.js";
import { QueryChunksComponent } from "./QueryChunksComponent.js";
import { ReadTextFilesComponent } from "./ReadTextFilesComponent.js";
import { DocsWithGPTComponent } from "./DocsWithGPTComponent.js";

let components = [GptIXPComponent, ChunkFilesComponent, LoopGPTComponent, QueryChunksComponent, ReadTextFilesComponent, DocsWithGPTComponent];

function CreateComponents ()
{
  return {
    blocks: components,
    patches: []
  }
}
export default {createComponents: CreateComponents}