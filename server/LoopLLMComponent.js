import { loop_llm_component } from "./documentsLib.js";

var LoopLLMComponent = {
    schema:
    {
      "tags": ['default'],
      "componentKey": "loopLLM",
      "category": "Document Processing",
      "operation": {
        "schema": {
          "title": "Loop documents through a LLM",
          "type": "object",
          "required": [],
          "properties": {
            "documents": {
              "title": "Chunk Documents",
              "type": "array",
              "x-type": "documentArray",
              "description": `Chunk files`,
            },
            "instruction": {
              "title": "Instruction",
              "type": "string",
              'x-type': 'text',
              'description': 'instruction executed on each chunk',
              "default": `write a summary of the provided text, making sure to indicate the characters involved and the locations where the action is taking place`,
            },
            "llm_functions": {
              "title": "Functions",
              "type": "array",
              'x-type': 'objectArray',
              'description': 'functions to constrain the LLM output',
              "default": []
            },
            "temperature": {
              "title": "Temperature",
              "type": "number",
              "default": 0,
              "minimum": 0,
              "maximum": 2
            },
            "top_p": {
              "title": "top_p",
              "type": "number",
              "default": 1,
              "minimum": 0,
              "maximum": 1
            },
            "allow_gpt3": {
              "title": "Allow GPT3 usage",
              "type": "boolean",
              "default": true,
            },
            "allow_gpt4": {
              "title": "Allow GPT4 usage",
              "type": "boolean",
              "default": false,
            },
            "embeddings": {
              "title": "Embeddings",
              "type": "string", 
              "enum": ["openai", "tensorflow"],
              "default": "tensorflow",
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
                  "title": "Result Files",
                  "type": "array",
                  "x-type": "cdnObjectArray",
                  "description": "The files containing the results"
                },              
                "documents": {
                  "title": "Result Documents",
                  "type": "array",
                  "x-type": "documentArray",
                  "description": "The files containing the results"
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
        "title": "Loop LLM",
        "category": "Text Manipulation",
        "summary": "Loop a LLM over chunked documents",
        "meta": {
          "source": {
            "summary": "Loop a LLM (chatGPT) over chunked files",
            links: {
              "Langchainjs Website": "https://docs.langchain.com/docs/",
              "Documentation": "https://js.langchain.com/docs/",
              "Langchainjs Github": "https://github.com/hwchase17/langchainjs",
              "Faiss": "https://faiss.ai/"
            }
          }
        },
      }
    },
    functions: {
      _exec: async (payload, ctx) =>
      {
        
        const response = await loop_llm_component(ctx, payload);
        const { result_cdn, answers } = response;
        return { result: { "ok": true }, documents: [result_cdn], files: [result_cdn] };
  
      }
    }
  };

export {LoopLLMComponent};