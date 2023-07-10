// extension.js

import {ChunkFilesComponent} from "./ChunkFilesComponent.js";
import {LoadPDFComponent} from "./LoadPDFComponent.js";
import {LoopLLMComponent} from "./LoopLLMComponent.js";
import {QueryChunksComponent} from "./QueryChunksComponent.js";

var components = [LoadPDFComponent, ChunkFilesComponent, LoopLLMComponent, QueryChunksComponent];
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
