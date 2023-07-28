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
        },
      },
      "responseTypes": {
        "200": {
          "schema": {
            "title": "JSON",
            "required": [],
            "type": "object",
            "properties": {
              "answer": {
                "title": "Answer",
                "type": "string",
                "x-type": "text",
                "description": "The answer to the query or prompt"
              },
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
      "inputs": {
        "llm_functions": {
          "control": {
            "type": "AlpineCodeMirrorComponent"
          }
        },
      },
    }
  },
  functions: {
    _exec: async (payload, ctx) =>
    {

      const llm_functions = payload.llm_functions;
      const documents = payload.documents;
      const instruction = payload.instruction;
      const temperature = payload.temperature;
      const top_p = payload.top_p;
      const allow_gpt3 = payload.allow_gpt3;
      const allow_gpt4 = payload.allow_gpt4;
  


      const response = await loop_llm_component(ctx, documents, instruction, llm_functions, temperature, top_p, allow_gpt3, allow_gpt4);
      const response_cdn = response.cdn;
      let answer = "";
      if (llm_functions !== null && llm_functions !== undefined && llm_functions.length > 0)
      {
        answer = response.function_string;
      }
      else
      {
        answer = response.answer;
      }
      return { result: { "ok": true }, answer: answer, documents: [response_cdn], files: [response_cdn] };

    }
  }
};

export { LoopLLMComponent };