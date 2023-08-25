//@ts-check
//llmOobabooga.js

import { runBlock } from './blocks.js';
import { Llm, generateModelId, deduceLlmTitle, deduceLlmDescription, addLocalLlmChoices, DEFAULT_UNKNOWN_CONTEXT_SIZE} from './llm.js'
import { Tokenizer_Openai } from './tokenizer_Openai.js' // TBD: use llama tokenizer: https://github.com/belladoreai/llama-tokenizer-js
const LLM_PROVIDER_OOBABOOGA_LOCAL = "oobabooga";
const LLM_MODEL_TYPE_OOBABOOGA = "oobabooga";
const BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT = "oobabooga.simpleGenerateText";
const BLOCK_OOBABOOGA_MANAGE_MODEL = "oobabooga.manageModelComponent";
const ICON_OOBABOOGA = '📁';

function parseOobaboogaModelResponse(model_response)
{
    let nestedResult = JSON.parse(model_response);

    // Rename the keys
    if (nestedResult['shared.settings']) {
        nestedResult.shared_settings = nestedResult['shared.settings'];
        delete nestedResult['shared.settings'];
    }
    
    if (nestedResult['shared.args']) {
        nestedResult.shared_args = nestedResult['shared.args'];
        delete nestedResult['shared.args'];
    }

    return nestedResult;
}

export class Llm_Oobabooga extends Llm
{
    constructor()
    {
        const tokenizer_Openai = new Tokenizer_Openai()
        // TBD: use Llama tokenizer

        super(tokenizer_Openai);
    }

    async query(ctx, prompt, instruction, model_name, temperature=0, args=null)
    {
        // for now, for this to work we need:
        // 1. a model manually copied into oobabbooga's models directory 
        // 2. in oobabooga session tab, options --api and --listen checked (or used as cmdline parameters when launching oobabooga)
      
        let model_response = await this.getCurrentModelInfo();
    
        // Parsing the nested JSON string inside the 'result' property
        let nestedResult = parseOobaboogaModelResponse(model_response);
        
        let loaded_model = nestedResult?.model_name;
        const context_size = nestedResult?.shared_settings?.max_new_tokens_max || 0;
        this.context_sizes[model_name] = context_size;

        if (loaded_model != model_name)
        {
            model_response = await this.loadModel(model_name);
            nestedResult = parseOobaboogaModelResponse(model_response);
            loaded_model = nestedResult?.model_name;
        }
        
        if (loaded_model != model_name) throw new Error (`Failed to load model ${model_name} into oobabooga`);
    
        let block_args = {...args};
        block_args.user = ctx.userId;
        block_args.prompt = `${instruction}\n\n${prompt}`;
        block_args.temperature = temperature;
        block_args.model = model_name;
    
        const response = await this.runLlmBlock(ctx, block_args);
        return response;        
    }

    async runLlmBlock(ctx, args) 
    {
        // TBD ensure all the runLLM blocks have the same exact response format
        // or clean it up here for ooabooga
        const response = await runBlock(ctx, BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT, args);
        if (response.error) throw new Error(response.error);
    
        const results = response?.results || [];
        if (results.length == 0) throw new Error("No results returned from oobabooga");
    
        const text = results[0].text || null;
        if (!text) throw new Error("Empty text result returned from oobabooga. Did you load a model in oobabooga?");
    
        const return_value = {
            answer: text,
            args: null
        };
    
        return return_value;
    }

    getProvider()
    {
        return LLM_PROVIDER_OOBABOOGA_LOCAL;
    }

    getModelType()
    {
        return LLM_MODEL_TYPE_OOBABOOGA;
    }

    async getModelChoicesFromDisk(choices, llm_model_types, llm_context_sizes)
    {
        await addLocalLlmChoices(choices, llm_model_types, llm_context_sizes, LLM_MODEL_TYPE_OOBABOOGA, LLM_PROVIDER_OOBABOOGA_LOCAL);
    }

    // -------------------------------------------------

    async getCurrentModelInfo(ctx)
    {
        const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "info" });
        
        // format:
        // {'model_name': shared.model_name,
        //  'lora_names': shared.lora_names,
        //  'shared.settings': shared.settings,
        //  'shared.args': vars(shared.args),}
    
        return response?.result;
    }
    
    async loadModel(ctx, model_name)
    {
        const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "load", model_name: model_name });
        return response?.result;
    }

    async getModelChoicesFromServer(ctx, choices, llm_model_types, llm_context_sizes)
    {
        const model_names = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "list" });
    
        for (const model_name in model_names)
        {
            let title, description, model_type, context_size, memory_need;
    
            const model_id = generateModelId(model_name, LLM_PROVIDER_OOBABOOGA_LOCAL)
    
            title = deduceLlmTitle(model_name, LLM_PROVIDER_OOBABOOGA_LOCAL, ICON_OOBABOOGA);
            description = deduceLlmDescription(model_name);
    
            llm_model_types[model_name] = LLM_MODEL_TYPE_OOBABOOGA;
            llm_context_sizes[model_name] = DEFAULT_UNKNOWN_CONTEXT_SIZE;
    
            const choice = { value: model_id, title: title, description: description };
            choices.push(choice);
        }
    }
}