import { read_text_file_component} from "./documentsLib.js";

var ReadTextFileComponent = {
    schema:
    {
      "tags": ['default'],
      "componentKey": "readTextFiles",
      "category": "Document Processing",
      "operation": {
        "schema": {
          "title": "Read Text Files",
          "type": "object",
          "required": [],
          "properties": {
            "documents": {
              "title": "Documents",
              "type": "array",
              "x-type": "documentArray",
              "description": `Text documents to read.`,
            },
          }
        },
        "responseTypes": {
          "200": {
            "schema": {
              "title": "JSON",
              "required": [],
              "type": "object",
              "properties": {
                "texts": {
                  "title": "Texts from the document(s)",
                  "type": "string",
                  "x-type": "text",
                  "description": "The texts contained in the text document(s"
                },
              },
            },
            "contentType": "application/json"
          },
        },
        "method": "X-CUSTOM"
      },
    },  
    functions: {
      _exec: async (payload, ctx) =>
      {
  
        let return_value = { result: { "ok": false }, text:"" };
        if (payload.documents)
        {
          const texts = await read_text_file_component(ctx, payload);
          return_value =  { result: { "ok": true }, texts:texts};
        }
        console.log(`return_value: ${JSON.stringify(return_value)} <----------`);
        return return_value;
      }
    }
  };

export {ReadTextFileComponent};
  