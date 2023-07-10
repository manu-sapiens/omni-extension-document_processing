import { component_loop_llm_on_chunks, NO_FUNCTIONS} from "./documentsLib.js";

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
        let return_value = { result: { "ok": false }, documents: [] };
        if (payload.documents)
        {
          const files = payload.documents;
          const instruction = payload.instruction;
          let llm_functions = payload.llm_functions || NO_FUNCTIONS;
          const temperature = payload.temperature || 0;
          const top_p = payload.top_p || 1;
          const allow_gpt3 = payload.allow_gpt3 || true;
          const allow_gpt4 = payload.allow_gpt4 || false;
          const overwrite = payload.overwrite || false;
          if (!allow_gpt3 && !allow_gpt4) throw new Error(`ERROR: You must allow at least one LLM model`);
  
          if (llm_functions.length === 0) llm_functions = NO_FUNCTIONS;
          
          const args = { temperature: temperature, top_p: top_p, allow_gpt3: allow_gpt3, allow_gpt4: allow_gpt4, overwrite: overwrite };
  
          const cdn_response_array = [];
          for (let i = 0; i < files.length; i++)
          {
            const chunks_cdn = files[i];
            const cdn_response = await component_loop_llm_on_chunks(ctx, chunks_cdn, instruction, llm_functions, args);
            cdn_response_array.push(cdn_response);
            
            console.log(`cdn_response = ${JSON.stringify(cdn_response)}`);
          }
          return_value = { result: { "ok": true }, files: cdn_response_array, documents: cdn_response_array };
        }
  
        return return_value;
      }
    }
  };

export {LoopLLMComponent};