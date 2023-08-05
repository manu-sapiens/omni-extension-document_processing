// extension.js
import { ChunkFilesComponent } from "./ChunkFilesComponent.js";
import { LoadPDFComponent } from "./LoadPDFComponent.js";
import { GptIXPComponent } from "./GptIXPComponent.js";
import { LoopGPTComponent } from "./LoopGPTComponent.js";
import { QueryChunksComponent } from "./QueryChunksComponent.js";
import { ReadTextFilesComponent } from "./ReadTextFilesComponent.js";
import { TextsToGPTComponent } from "./TextsToGPTComponent.js";

let components = [GptIXPComponent, ChunkFilesComponent, LoopGPTComponent, LoadPDFComponent, QueryChunksComponent, ReadTextFilesComponent, TextsToGPTComponent];

function CreateComponents ()
{
  return {
    blocks: components,
    patches: []
  }
}
export default {createComponents: CreateComponents}