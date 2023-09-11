//@ts-check
// ReadTextFilesComponent.js
import { createComponent} from 'omnilib-utils/component.js';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const DISPLAY_NAMESPACE = 'document_processing';
const DISPLAY_OPERATION_ID = 'download_files';
const TITLE = 'Download files';
const CATEGORY = 'File Management';
const DESCRIPTION = 'Download files';

const DOWNLOAD_BASE_PATH = '../../user_files/';


// Adding input(s)
const inputs = [
    { name: 'files', type: 'array', title: 'Files', customSocket: 'fileArray', description: 'Files to be downloaded', allowMultiple: true },
    { name: 'images', type: 'array', title: 'Images', customSocket: 'imageArray', description: 'Images to be downloaded', allowMultiple: true },
    { name: 'audio', type: 'array', title: 'Audio', customSocket: 'audioArray', description: 'Audio files to be downloaded', allowMultiple: true },
    { name: 'documents', type: 'array', title: 'Documents', customSocket: 'documentArray', description: 'Documents to be downloaded', allowMultiple: true },
    { name: 'object', type: 'array', title: 'JSON', customSocket: 'objectArray', description: 'JSON objects to be downloaded', allowMultiple: true },
    { name: 'text', type: 'string', title: 'Text', customSocket: 'text', description: 'Texts to be downloaded', allowMultiple: true },
    { name: 'folder', type: 'string', title: 'Folder', customSocket: 'text', description: 'Folder to download files relative to ./user_files/ directory', defaultValue: './cdn_downloads/' },
    { name: 'rename', type: 'boolean', title: 'Rename', description: 'Rename files', defaultValue: true },
    { name: 'basename', type: 'string', title: 'Base Name', customSocket: 'text', description: 'Base name for renamed files', defaultValue: 'file' },
];

// Adding outpu(t)
const outputs = [
    { name: 'info', type: 'string', customSocket: 'text', description: 'Info on what has been downloaded and where' },
];

/*
let component = OAIBaseComponent
    .create(DISPLAY_NAMESPACE, DISPLAY_OPERATION_ID)
    .fromScratch()
    .set('title', TITLE)
    .set('category', CATEGORY)
    .setMethod(METHOD)
    .setMeta({
        source: {
            summary: DESCRIPTION,
        }
    });
// ----------------------------
component = setComponentInputs(component, inputs);
component = setComponentOutputs(component, outputs);
component.setMacro(OmniComponentMacroTypes.EXEC, parsePayload); */

const DownloadFilesComponent = createComponent(DISPLAY_NAMESPACE, DISPLAY_OPERATION_ID, TITLE, CATEGORY, DESCRIPTION, DESCRIPTION, {}, inputs, outputs, null, parsePayload );

async function parsePayload(payload, ctx)
{
    const files = payload.files || [];
    const images = payload.images|| [];
    const audio = payload.audio|| [];
    const documents = payload.documents|| [];
    const object = payload.object|| [];
    const text = payload.text;
    const folder = payload.folder || "./cdn_downloads/";
    const rename = payload.rename || false;
    const basename = payload.basename || "file";

    const files_to_download = [...files, ...images, ...audio, ...documents, ...object];

    if (text && text.length > 0)
    {
        const text_buffer = Buffer.from(text);
        const text_cdn = await ctx.app.cdn.putTemp(text_buffer, { mimeType: 'text/plain; charset=utf-8', userId: ctx.userId });

        files_to_download.push(text_cdn);
    }

    
    const result = await downloadFiles(ctx, files_to_download, folder, rename, basename);
    return result;
}




async function downloadFiles(ctx, cdn_responses, folderPath = './cdn_downloads/', rename = false, baseName = 'file')
{
    let basepath = DOWNLOAD_BASE_PATH;
    
    let info = "";

    if (!Array.isArray(cdn_responses))
    {
        return { result: { "ok": false },info : 'Tickets parameter should be an array of ticket objects' };
    }

    
    // Normalize and resolve the folder path to prevent directory traversal attacks and ensure correct formatting
    const combined_path = path.join(basepath, folderPath);
    const resolved_path = path.resolve(path.normalize(combined_path));

    // Ensure folder exists
    if (!fs.existsSync(resolved_path))
    {
        fs.mkdirSync(resolved_path, { recursive: true });
    }

    let success = 0;
    for (let i = 0; i < cdn_responses.length; i++)
    {
        const cdn_response = cdn_responses[i];

        if (cdn_response && cdn_response.ticket)
        {
            try
            {
                const response_from_cdn = await ctx.app.cdn.get(cdn_response.ticket, null);
                if (response_from_cdn == null) throw new Error(`downloadFilesFromTickets: response_from_cdn is null for cdn_response = ${JSON.stringify(cdn_response)}`);

                const buffer = Buffer.from(response_from_cdn.data); // we directly use Buffer.from without 'base64'

                let fileExtension = path.extname(cdn_response.fileName || '').substring(1);

                // If file extension is not present or invalid, derive it from the mime type
                if (!fileExtension || fileExtension === '.')
                {
                    fileExtension = mime.extension(cdn_response.mimeType) || '';
                }

                let fileName;
                if (rename)
                {
                    fileName = `${baseName}${String(i).padStart(3, '0')}.${fileExtension}`;
                } else
                {
                    fileName = cdn_response.fileName || `${baseName}${String(i).padStart(3, '0')}.${fileExtension}`;
                }

                const filePath = path.join(resolved_path, fileName);
                fs.writeFileSync(filePath, buffer);
                console.log(`File downloaded to ${filePath}`);

                info += `[${i}] File ${fileName} downloaded to ${filePath}, originally: ${cdn_response.fileName}\n`;
                success += 1;

            } catch (error)
            {
                info += `[${i}] Failed to download file for cdn_response: ${JSON.stringify(cdn_response)} with error ${error}\n`;
            }
        }
    }
    if (success == 0) return { result: { "ok": false },info : `Could not download anything out of ${cdn_responses.length} files passed.` };

    return { result: { "ok": true },info : info };
}


export { DownloadFilesComponent, downloadFiles };
