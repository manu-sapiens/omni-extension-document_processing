import { component_load_pdf } from "./documentsLib.js";

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
              "default": false,
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
  
        let return_value = { result: { "ok": false }, documents: [] };
        if (payload.documents)
        {
  
          const input_cdns = payload.documents;
          const overwrite = payload.overwrite || false;
          const args = { overwrite: overwrite };
          const output_cdns = [];
          for (let i=0; i<input_cdns.length; i++)
          {
            const input_cdn = input_cdns[i];
            const output_cdn = await component_load_pdf(ctx, input_cdn, args);
            console.log(`cdn_response = ${JSON.stringify(output_cdn)}`);
            output_cdns.push(output_cdn);
          }
  
          return_value = { result: { "ok": true }, documents: output_cdns , files: output_cdns};
        }
  
        return return_value;
      }
    }
  };

export {LoadPDFComponent};
