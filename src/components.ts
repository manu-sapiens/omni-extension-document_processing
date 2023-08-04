import { GptIXPComponent } from './GptIXPComponent';
import { ChunkFilesComponent } from './ChunkFilesComponent';
import { LoopGPTComponent } from './LoopGPTComponent';
import { LoadPDFComponent } from './LoadPDFComponent';
import { QueryChunksComponent } from './QueryChunksComponent';
import { ReadTextFileComponent } from './ReadTextFilesComponent';
import { TextsToGPTComponent } from './TextsToGPTComponent';


let components = [GptIXPComponent, ChunkFilesComponent, LoopGPTComponent, LoadPDFComponent, QueryChunksComponent, ReadTextFileComponent, TextsToGPTComponent];

export default () =>
{
  return {
    blocks: components,
    patches: []
  }
}
