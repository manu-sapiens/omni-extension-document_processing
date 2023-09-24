//@ts-check

import { TokenTextSplitter } from "langchain/text_splitter";
import { SupportedTextSplitterLanguages, RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from "./chunking.js";

const SPLITTER_MODEL_RECURSIVE = "RecursiveCharacterTextSplitter";
const SPLITTER_MODEL_TOKEN = "TokenTextSplitter";
const SPLITTER_MODEL_CODE = "CodeSplitter_"; // see extractCodeLanguage()
const DEFAULT_SPLITTER_MODEL = SPLITTER_MODEL_RECURSIVE;
const SPLITTER_TOKEN_ENCODING = "gpt2";

export function getSplitterChoices()
{
    const splitter_choices = [
        {value: "RecursiveCharacterTextSplitter", title: "RecursiveCharacterTextSplitter"},
        {value: "TokenTextSplitter", title: "TokenTextSplitter"},
        {value: "CodeSplitter_cpp", title: "CodeSplitter_cpp"},
        {value: "CodeSplitter_go", title: "CodeSplitter_go"},
        {value: "CodeSplitter_java",  title: "CodeSplitter_java"},
        {value: "CodeSplitter_ruby",  title: "CodeSplitter_ruby"},
        {value: "CodeSplitter_js",  title: "CodeSplitter_js"},
        {value: "CodeSplitter_php",  title: "CodeSplitter_php"},
        {value: "CodeSplitter_proto",  title: "CodeSplitter_proto"},
        {value: "CodeSplitter_python",  title: "CodeSplitter_python"},
        {value: "CodeSplitter_rst",  title: "CodeSplitter_rst"},
        {value: "CodeSplitter_rust",  title: "CodeSplitter_rust"},
        {value:  "CodeSplitter_scala",  title: "CodeSplitter_scala"},
        {value: "CodeSplitter_swift",  title: "CodeSplitter_swift"},
        {value: "CodeSplitter_markdown",  title: "CodeSplitter_markdown"},
        {value: "CodeSplitter_latex",  title: "CodeSplitter_latex"},
        {value: "CodeSplitter_html", title: "CodeSplitter_html"},
    ];
    return splitter_choices;
}
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

function initializeSplitter(splitter_model = DEFAULT_SPLITTER_MODEL, chunk_size = DEFAULT_CHUNK_SIZE, chunk_overlap = DEFAULT_CHUNK_OVERLAP)
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

    if (splitter == null || splitter == undefined) throw new Error(`initializeSplitter: Failed to initialize splitter_model ${splitter_model}`);
    return splitter;
}

export { initializeSplitter, DEFAULT_SPLITTER_MODEL }