//@ts-check
//llmLmStudio.js
import { omnilog } from 'mercs_shared';
import { runBlock } from './blocks.js';
import { console_log } from './utils.js';
import { Llm, generateModelId, getModelsDirJson, DEFAULT_UNKNOWN_CONTEXT_SIZE} from './llm.js'
import { validateDirectoryExists } from './files.js';
import { Tokenizer_Openai } from './tokenizer_Openai.js' // TBD: use llama tokenizer: https://github.com/belladoreai/llama-tokenizer-js
const LLM_PROVIDER_LM_STUDIO_LOCAL = "lm-studio";
const LLM_MODEL_TYPE_LM_STUDIO = "lm-studio"
const BLOCK_LM_STUDIO_SIMPLE_CHATGPT = "lm-studio.simpleGenerateTextViaLmStudio";
const ICON_LM_STUDIO = '🖥';
const DEFAULT_MODEL_NAME_LM_STUDIO = 'loaded_model'

export class Llm_LmStudio extends Llm
{
    constructor()
    {
        const tokenizer_Openai = new Tokenizer_Openai()
        // TBD: use Llama tokenizer

        super(tokenizer_Openai);
    }

    // -----------------------------------------------------------------------
    /**
     * @param {any} ctx
     * @param {string} prompt
     * @param {string} instruction
     * @param {string} model_name
     * @param {number} [temperature=0]
     * @param {any} [args=null]
     * @returns {Promise<{ answer_text: string; answer_json: any; }>}
     */
    async query(ctx, prompt, instruction, model_name, temperature=0, args=null)
    {
        let return_value = {
            answer_text: "",
            answer_json: {answer_text : ""}
        };

        let block_args = {...args};
        block_args.user = ctx.userId;
        if (prompt && prompt!="") block_args.prompt = prompt;
        if (instruction && instruction!="") block_args.instruction = instruction;
        block_args.temperature = temperature;

        if ("seed" in block_args == false) block_args.seed = -1; // TBD: Check the API

        const response = await this.runLlmBlock(ctx, block_args);
        if (response.error) throw new Error(response.error);
    
        omnilog.warn(`response = ${JSON.stringify(response)}`);

        const choices = response?.choices;
        if (!choices) throw new Error("No choices returned from lm_studio");
        if (choices.length == 0) throw new Error("Empty choices returned from lm_studio");
    
        const message = choices[0].message;
        if (!message) throw new Error (`No message returned from lm_studio. response = ${JSON.stringify(response)}`);

        const answer_text = message?.content;
        if (!answer_text) throw new Error (`No content returned from lm_studio. response = ${JSON.stringify(response)}`);
        
        return_value = {
            answer_text: answer_text,
            answer_json: {answer_text: answer_text},
        };
    
        return return_value;        
    }

    async runLlmBlock(ctx, args) 
    {
        // TBD ensure all the runLLM blocks have the same exact response format
        // or clean it up here for ooabooga
        const response = await runBlock(ctx, BLOCK_LM_STUDIO_SIMPLE_CHATGPT, args);
        return response;        
    }

    getProvider()
    {
        return LLM_PROVIDER_LM_STUDIO_LOCAL;
    }

    getModelType()
    {
        return LLM_MODEL_TYPE_LM_STUDIO;
    }

    async getModelChoices(choices, llm_model_types, llm_context_sizes)
    {
        const models_dir_json = await getModelsDirJson()
        if (!models_dir_json) return;
    
        const provider_model_dir = models_dir_json[LLM_PROVIDER_LM_STUDIO_LOCAL];
        if (!provider_model_dir) return;
    
        const dir_exists = await validateDirectoryExists(provider_model_dir)
        if (!dir_exists) return;
    
        choices.push({ value: generateModelId(DEFAULT_MODEL_NAME_LM_STUDIO, LLM_PROVIDER_LM_STUDIO_LOCAL), title: ICON_LM_STUDIO+ 'model currently loaded in (LM-Studio)', description: "Use the model currently loaded in LM-Studio if that model's server is running." });
        llm_model_types[DEFAULT_MODEL_NAME_LM_STUDIO] = LLM_MODEL_TYPE_LM_STUDIO
        llm_context_sizes[DEFAULT_MODEL_NAME_LM_STUDIO] = DEFAULT_UNKNOWN_CONTEXT_SIZE
    
        return;
    }
    
}