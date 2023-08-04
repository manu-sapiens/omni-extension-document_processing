// ReadTextFilesComponent.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { setComponentInputs, setComponentOutputs, setComponentControls } from './components_lib.js';
const NS_ONMI = 'document_processing';

import { is_valid, console_log, rebuildToTicketObjectsIfNeeded, parse_text_to_array } from './utils.js';


let read_text_files_component = OAIBaseComponent
  .create(NS_ONMI, "read_text_files")
  .fromScratch()
  .set('title', 'Read text files')
  .set('category', 'Text Manipulation')
  .setMethod('X-CUSTOM')
  .setMeta({
    source: {
      summary: "Read text files",
    }
  });

// Adding input(s)
const inputs = [
  { name: 'text_or_url', type: 'string', title: 'Text or URL(s)', customSocket: 'text or url(s) of text files' },
];
read_text_files_component = setComponentInputs(read_text_files_component, inputs);

// Adding control(s)
const controls = [
  { name: "llm_functions", title: "LLM Functions", placeholder: "AlpineCodeMirrorComponent", description: "Functions to constrain the output of the LLM" },
];
read_text_files_component = setComponentControls(read_text_files_component, controls);

// Adding outpu(t)
const outputs = [
  { name: 'documents', type: 'array', customSocket: 'documentArray', description: 'The read documents' },
];
read_text_files_component = setComponentOutputs(read_text_files_component, outputs);


// Adding _exec function
read_text_files_component.setMacro(OmniComponentMacroTypes.EXEC, read_text_files_parse);


async function read_text_files_parse(ctx: any, payload: any) {
  const text_or_url = payload.text_or_url;
  const documents = await read_text_file_function(ctx, text_or_url);
  return { result: { "ok": true }, documents: documents };
}

async function read_text_file_function(ctx, url_or_text) {
  const returned_documents = [];

  console_log(`[read_text_file_component] url_or_text = ${url_or_text}`);
  if (is_valid(url_or_text)) {
    console.time("read_text_file_component_processTime");


    console_log(`--------------------------------`);

    const parsedArray = parse_text_to_array(url_or_text);
    console_log(`[read_text_file_component] parsedArray #  ${parsedArray.length}`);

    const cdn_tickets = rebuildToTicketObjectsIfNeeded(parsedArray);
    console_log(`[read_text_file_component] cdn_tickets #  ${cdn_tickets.length}`);

    if (cdn_tickets.length > 0) {
      // The parsedArray contains CDN tickets, return them as is.
      for (let i = 0; i < cdn_tickets.length; i++) {
        const cdn_ticket = cdn_tickets[i];
        returned_documents.push(cdn_ticket);
      }
    } else if (parsedArray.length === 1 && typeof parsedArray[0] === 'string') {
      // The parsedArray contains a single text string, save it to the CDN and return the ticket.
      const individual_text = parsedArray[0];
      const buffer = Buffer.from(individual_text);
      const document_cdn = await ctx.app.cdn.putTemp(buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });

      returned_documents.push(document_cdn);
    } else {
      // The parsedArray contains URLs, rebuild them into tickets and return as an array.
      for (let i = 0; i < cdn_tickets.length; i++) {
        const cdn_ticket = cdn_tickets[i];
        returned_documents.push(cdn_ticket);
      }
    }

    if (is_valid(returned_documents) == false) throw new Error(`ERROR: could not convert to documents`);
    console_log(`[read_text_file_component] documents # = ${returned_documents.length}`);
    console_log(`[read_text_file_component] documents = ${JSON.stringify(returned_documents)}`);

    console.timeEnd("read_text_file_component_processTime");
  }
  return returned_documents;
}

const ReadTextFileComponent = read_text_files_component.toJSON();
export { ReadTextFileComponent, read_text_file_function };
