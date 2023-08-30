//@ts-check

// splitter.js

import { TokenTextSplitter } from "langchain/text_splitter";
import { SupportedTextSplitterLanguages, RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from "./chunking.js";

const SPLITTER_MODEL_RECURSIVE = "RecursiveCharacterTextSplitter";
const SPLITTER_MODEL_TOKEN = "TokenTextSplitter";
const SPLITTER_MODEL_CODE = "CodeSplitter_"; // see extractCodeLanguage()
const DEFAULT_SPLITTER_MODEL = SPLITTER_MODEL_RECURSIVE;
const SPLITTER_TOKEN_ENCODING = "gpt2";

function extractCodeLanguage(str)
{
    const pattern = new RegExp('^' + SPLITTER_MODEL_CODE + '(\\w+)$', 'i');
    const match = str.match(pattern);

    if (match)
    {
        const language = match[1].toLowerCase();
        const validLanguages = SupportedTextSplitterLanguages;
        /*
        [
            'cpp', 'go', 'java', 'js', 'php', 'proto',
            'python', 'rst', 'ruby', 'rust', 'scala',
            'swift', 'markdown', 'latex', 'html'
        ];
        */
        if (validLanguages.includes(language))
        {
            return language;
        }
    }

    return null;
}

function initialize_splitter(splitter_model = DEFAULT_SPLITTER_MODEL, chunk_size = DEFAULT_CHUNK_SIZE, chunk_overlap = DEFAULT_CHUNK_OVERLAP)
{

    let splitter = null;
    if (splitter_model == SPLITTER_MODEL_RECURSIVE) 
    {
        splitter = new RecursiveCharacterTextSplitter({
            chunkSize: chunk_size, // in characters!
            chunkOverlap: chunk_overlap, // in characters!
        });
    }
    else if (splitter_model == SPLITTER_MODEL_TOKEN) 
    {
        splitter = new TokenTextSplitter({
            encodingName: SPLITTER_TOKEN_ENCODING,
            chunkSize: chunk_size, // in tokens!
            chunkOverlap: chunk_overlap, // in tokens!
        });
    }
    else
    {
        // SPLITTER_CODE
        const code_language = extractCodeLanguage(splitter_model);
        if (code_language)
        {
            splitter = RecursiveCharacterTextSplitter.fromLanguage(code_language, {
                chunkSize: chunk_size, // in characters!
                chunkOverlap: chunk_overlap, // in characters!
            });
        }
    }
    // TBD: more splitters here

    if (splitter == null || splitter == undefined) throw new Error(`initialize_splitter: Failed to initialize splitter_model ${splitter_model}`);
    return splitter;
}

export { initialize_splitter, DEFAULT_SPLITTER_MODEL }