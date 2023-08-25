//@ts-check
// llm.js
import path from "path";
import { omnilog } from 'mercs_shared';
import { walkDirForExtension, validateDirectoryExists, validateFileExists, readJsonFromDisk, fetchJsonFromUrl } from './files.js';
import { is_valid, console_log, pauseForSeconds } from './utils.js';


export const DEFAULT_UNKNOWN_CONTEXT_SIZE = 2048;
const MODELS_DIR_JSON_PATH = ["..", "..", "user_files", "local_llms_directories.json"]; // from process.cwd(), which is ./packages/server/

export function generateModelId(model_name, model_provider)
{
    return `${model_name}|${model_provider}`;
}

export function getModelNameAndProviderFromId(model_id)
{
    const splits = model_id.split('|');
    if (splits.length != 2) throw new Error(`splitModelNameFromType: model_id is not valid: ${model_id}`);
    return { model_name: splits[0], model_provider: splits[1] };
}

export async function isProviderAvailable(model_provider)
{
    const models_dir_json = await getModelsDirJson()
    if (!models_dir_json) return false;

    const provider_model_dir = models_dir_json[model_provider];
    if (!provider_model_dir) return false;

    const dir_exists = await validateDirectoryExists(provider_model_dir)
    if (!dir_exists) return false;

    return true;
}

export async function addLocalLlmChoices(choices, llm_model_types, llm_context_sizes, model_type, model_provider) 
{
    const models_dir_json = await getModelsDirJson()
    if (!models_dir_json) return;

    const provider_model_dir = models_dir_json[model_provider];
    if (!provider_model_dir) return;

    const dir_exists = await validateDirectoryExists(provider_model_dir)
    if (!dir_exists) return;

    let filePaths = [];
    filePaths = await walkDirForExtension(filePaths, provider_model_dir, '.bin');

    for (const filepath of filePaths)
    {
        const name = path.basename(filepath);
        const id = generateModelId(name, model_provider);
        const title = deduceLlmTitle(name, model_provider);
        const description = deduceLlmDescription(name);
        const choice = { value: id, title: title, description: description };

        llm_model_types[name] = model_type;
        llm_context_sizes[name] = DEFAULT_UNKNOWN_CONTEXT_SIZE;
        choices.push(choice);
}

    return;
}

export function deduceLlmTitle(model_name, model_provider, provider_icon = '?')
{
    const title = provider_icon + model_name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) + ' (' + model_provider + ')';
    return title;
}

export function deduceLlmDescription(model_name, context_size = 0)
{
    let description = model_name.substring(0, model_name.length - 4); // remove ".bin"
    if (context_size > 0) description += ` (${Math.floor(context_size / 1024)}k)`;
    return description;
}

export async function getModelsDirJson()
{
    const json_path = path.resolve(process.cwd(), ...MODELS_DIR_JSON_PATH);
    const file_exist = validateFileExists(json_path);
    if (!file_exist) return null;

    const models_dir_json =  await readJsonFromDisk(json_path);

    //debug
    omnilog.warn(`[getModelsDirJson] json_path = ${json_path}, models_dir_json = ${JSON.stringify(models_dir_json)}`)
    return models_dir_json;

}


async function fixJsonWithLlm(llm, json_string_to_fix)
{
    const ctx = llm.ctx;
    let response = null;
    const args = {};
    args.user = ctx.userId;
    args.prompt = json_string_to_fix;
    args.instruction = "Fix the JSON string below. Do not output anything else but the carefully fixed JSON string.";;
    args.temperature = 0;

    try
    {
        response = await llm.runLlmBlock(ctx, args);
    }
    catch (err)
    {
        console.error(`[FIXING] fixJsonWithLlm: Error fixing json: ${err}`);
        return null;
    }

    let text = response?.answer_text || "";
    console_log(`[FIXING] fixJsonWithLlm: text: ${text}`);

    if (is_valid(text) === false) return null;

    return text;

}

export async function fixJsonString(llm, passed_string) 
{

    if (is_valid(passed_string) === false)
    {
        throw new Error(`[FIXING] fixJsonString: passed string is not valid: ${passed_string}`);

    }
    if (typeof passed_string !== 'string')
    {
        throw new Error(`[FIXING] fixJsonString: passed string is not a string: ${passed_string}, type = ${typeof passed_string}`);
    }

    // Replace \n with actual line breaks
    let cleanedString = passed_string.replace(/\\n/g, '\n');
    let jsonObject = null;
    let fixed = false;
    let attempt_count = 0;
    let attempt_at_cleaned_string = cleanedString;
    while (fixed === false && attempt_count < 10)
    {
        attempt_count++;
        console_log(`[FIXING] Attempting to fix JSON string after ${attempt_count} attempts.\n`);

        try 
        {
            jsonObject = JSON.parse(attempt_at_cleaned_string);
        }
        catch (err)
        {
            console.error(`[FIXING] [${attempt_count}] Error fixing JSON string: ${err}, attempt_at_cleaned_string: ${attempt_at_cleaned_string}`);
        }

        if (jsonObject !== null && jsonObject !== undefined)
        {
            fixed = true;
            console_log(`[FIXING] Successfully fixed JSON string after ${attempt_count} attempts.\n`);
            return jsonObject;
        }

        let response = await fixJsonWithLlm(llm, passed_string);
        if (response !== null && response !== undefined)
        {
            attempt_at_cleaned_string = response;
        }
        await pauseForSeconds(0.5);

    }

    if (fixed === false)
    {
        throw new Error(`Error fixing JSON string after ${attempt_count} attempts.\ncleanedString: ${cleanedString})`);
    }

    return "{}";
}

class Llm
{
    constructor(tokenizer, params = null)
    {
        this.tokenizer = tokenizer
        this.context_sizes = {}
    }

    countTextTokens(text)
    {
        return this.tokenizer.countTextTokens(text);
    }

    getModelContextSize(model_name)
    {
        return this.context_sizes[model_name];
    }

    // -----------------------------------------------------------------------

    async query(ctx, prompt, instruction, model_name, temperature=0, args)
    {
        return { answer: "You have to implement this method", args:null }
    }

    async runLlmBlock(ctx, args) 
    {
        return { answer: "You have to implement this method", args:null }
    }

    getProvider()
    {
        return 'You have to implement this method';
    }

    getModelType()
    {
        return 'You have to implement this method';
    }

    async getModelChoicesFromDisk(choices, llm_model_types, llm_context_sizes)
    {
        throw new Error('You have to implement this method');
    }
   
}

export { Llm }