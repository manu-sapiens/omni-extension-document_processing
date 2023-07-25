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
            "text": {
              "title": "Text(s)",
              "type": "string",
              "x-type": "text",
              'description': 'text or JSON list of texts',
            },
          "url": {
            "title": "url(s) of text files",
            "type": "string",
            "x-type": "text",
            'description': 'url or JSON list of urls',
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
                "documents": {
                  "title": "Documents",
                  "type": "array",
                  "x-type": "documentArray",
                  "description": `Read documents`,
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
        "title": "Read text files",
        "category": "Text Manipulation",
        "summary": "Read text files",
        "meta": {
          "source": {
            "summary": "Read text files",
          },
        },
      },      
    },  
    functions: {
      _exec: async (payload, ctx) =>
      {
        const documents = await read_text_file_component(ctx, payload);
        return { result: { "ok": true }, documents:documents};
      }
    }
  };

export {ReadTextFileComponent};
  