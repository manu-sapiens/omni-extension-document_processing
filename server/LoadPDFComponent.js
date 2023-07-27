import { load_pdf_component } from "./documentsLib.js";

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

export {LoadPDFComponent};
