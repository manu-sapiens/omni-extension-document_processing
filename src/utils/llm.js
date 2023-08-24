//@ts-check
// llm.js
import path from "path";
import { omnilog } from 'mercs_shared';
import { walkDirForExtension, validateDirectoryExists, validateFileExists, readJsonFromDisk, fetchJsonFromUrl } from './files.js';

export const DEFAULT_UNKNOWN_CONTEXT_SIZE = 2048;
const MODELS_DIR_JSON_PATH = ["..", "..", "user_files", "local_llms_directories.json"]; // from process.cwd(), which is ./packages/server/

export function combineModelNameAndProvider(model_name, model_provider)
{
    return `${model_name}|${model_provider}`;
}

export function splitModelNameFromProvider(model_combined)
{
    const splits = model_combined.split('|');
    if (splits.length != 2) throw new Error(`splitModelNameFromType: model_combined is not valid: ${model_combined}`);
    return { model_name: splits[0], model_provider: splits[1] };
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
        const combined = combineModelNameAndProvider(name, model_provider);
        const title = deduceLlmTitle(name, model_provider);
        const description = deduceLlmDescription(name);
        const choice = { value: combined, title: title, description: description };

        llm_model_types[name] = model_type;
        llm_context_sizes[name] = DEFAULT_UNKNOWN_CONTEXT_SIZE;
        choices.push(choice);
}

    return;
}

export function getModelMaxSize(model_name, llm_context_sizes, use_a_margin = true)
{
    const context_size = getModelContextSize(model_name, llm_context_sizes)
    if (use_a_margin == false) return context_size

    const safe_size = Math.floor(context_size * 0.9);
    return safe_size;
}


function getModelContextSize(model_name, llm_context_sizes)
{
    if (model_name in llm_context_sizes == false) return DEFAULT_UNKNOWN_CONTEXT_SIZE;
    
    const context_size = llm_context_sizes[model_name];
    return context_size;
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