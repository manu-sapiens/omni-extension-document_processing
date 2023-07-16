// extension.js

import {ChunkFilesComponent} from "./ChunkFilesComponent.js";
import {LoadPDFComponent} from "./LoadPDFComponent.js";
import {LoopLLMComponent} from "./LoopLLMComponent.js";
import {QueryChunksComponent} from "./QueryChunksComponent.js";
import { CollateChaptersComponent } from "./CollateChaptersComponent.js";
import { ReadTextFileComponent } from  "./ReadTextFiles.js";

var components = [ReadTextFileComponent, LoadPDFComponent, ChunkFilesComponent, LoopLLMComponent, QueryChunksComponent, CollateChaptersComponent];
var components_default = (FactoryFn) =>
{
  return components.map((c) => FactoryFn(c.schema, c.functions));
};

var extensionHooks = {};
var extension_default = { hooks: extensionHooks, createComponents: components_default };
export
{
  extension_default as default
};
