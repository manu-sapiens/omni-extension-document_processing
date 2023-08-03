// LoadPDFComponent.js

import PDFParser from 'pdf2json';
import { initialize_hasher } from './hashers.js'
import { save_text_to_cdn } from './cdn.js';
import { is_valid, clean_string, console_log } from './utils.js';
import { parsePDF, extractTextFields } from './pdf_processing.js';
import { user_db_delete, user_db_get, user_db_put } from './database.js';
import { DEFAULT_HASHER_MODEL } from './hashers.js';

var LoadPDFComponent = {
    schema:
    {
      "tags": ['default'],
      "componentKey": "loadPDF",
      "category": "Document Processing",
      "operation": {
        "schema": {
          "title": "Load PDF Documents",
          "type": "object",
          "required": [],
          "properties": {
            "documents": {
              "title": "Documents",
              "type": "array",
              "x-type": "documentArray",
              "description": `Load the PDF and save them as text in the CDN.`,
            },
            "overwrite": {
              "title": "Overwrite",
              "type": "boolean",
              "default": true,
              "description": `Overwrite the existing files in the CDN.`,
            },
          },
        },
        "responseTypes": {
          "200": {
            "schema": {
              "title": "JSON",
              "required": [],
              "type": "object",
              "properties": {
                "files": {
                  "title": "CDN Files",
                  "type": "array",
                  "x-type": "cdnObjectArray",
                  "description": "The chunked text files"
                },              
                "documents": {
                  "title": "Chunk Documents",
                  "type": "array",
                  "x-type": "documentArray",
                  "description": "The chunked text files"
                },
              },
            },
            "contentType": "application/json"
          },
        },
        "method": "X-CUSTOM"
      },
      patch:
      {
        "meta": {
          "source": {
            "summary": "Load PDF files and save them as text in the CDN",
            links: {
              "Langchainjs Website": "https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf",
              "PDF-parse Github": "https://github.com/UpLab/pdf-parse",
              "Langchainjs Github": "https://github.com/hwchase17/langchainjs"
            }
          }
        },
      }
    },
    functions: {
      _exec: async (payload, ctx) =>
      {
        const { documents, overwrite} = payload;

        let return_value = { result: { "ok": false }, documents: [], files: [] };
        if (documents)
        {
          const output_cdns = await load_pdf_component(ctx, documents, overwrite);
          return_value = { result: { "ok": true }, documents: output_cdns , files: output_cdns};
        }
  
        return return_value;
      }
    }
  };


// ---------------------------------------------------------------------------
async function load_pdf_component(ctx, documents, overwrite = false)
{

    console.time("load_pdf_component_processTime");
    if (is_valid(documents) == false) throw new Error(`load_pdf_component: documents_array = ${JSON.stringify(documents)} is invalid`);

    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", errData => console.error(`pdfParser_dataError in ${JSON.stringify(errData)}`));
    pdfParser.on("pdfParser_dataReady", pdfData => 
    {
        console_log(pdfData);
    });

    const texts_cdns = [];
    for (let i = 0; i < documents.length; i++)
    {
        const documents_cdn = documents[i];
        if ("ticket" in documents_cdn == false) throw new Error(`get_json_from_cdn: documents_cdn = ${JSON.stringify(documents_cdn)} is invalid`);

        const response_from_cdn = await ctx.app.cdn.get(documents_cdn.ticket, null, 'asBase64');
        if (response_from_cdn == null) throw new Error(`get_json_from_cdn: document = ${JSON.stringify(response_from_cdn)} is invalid`);

        const str = response_from_cdn.data.toString();
        const dataBuffer = Buffer.from(str, 'base64');

        const pdfData = await parsePDF(dataBuffer);
        const extractedTextFields = extractTextFields(pdfData);
        const all_texts = extractedTextFields.join(' ');
        const cleaned_texts = clean_string(all_texts);

        const hasher = initialize_hasher(DEFAULT_HASHER_MODEL);
        const texts_id = "converted_pdf_texts_" + ctx.userId + "_" + hasher.hash(cleaned_texts);

        let texts_cdn = null;

        if (overwrite) 
        {
            await user_db_delete(ctx, texts_id);
        }
        else
        {
            texts_cdn = await user_db_get(ctx, texts_id);
        }

        if (is_valid(texts_cdn) == false) 
        {
            console_log(`Could not find Texts CDN records for id = ${texts_id} in the DB. Saving to CDN...`);
            texts_cdn = await save_text_to_cdn(ctx, cleaned_texts);
            if (is_valid(texts_cdn) == false) throw new Error(`ERROR: could not save all_texts to cdn`);

            const success = await user_db_put(ctx, texts_cdn, texts_id);
            if (success == false) throw new Error(`ERROR: could not save texts_cdn to db`);
        }
        else
        {
            console_log(`Found Texts CDN records for id = ${texts_id} in the DB. Skipping saving to CDN...`);
        }
        texts_cdns.push(texts_cdn);
    }

    console.timeEnd("load_pdf_component_processTime");
    return texts_cdns;
}

 
export {LoadPDFComponent, load_pdf_component};
