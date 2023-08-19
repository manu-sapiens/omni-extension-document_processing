import fs from 'fs/promises';
import path from 'path';
import { omnilog } from 'mercs_shared';

async function walkDirForExtension(filePaths, directory_path, substring, extension) 
{
  substring = substring.toLowerCase();
  const files = await fs.readdir(directory_path);
  omnilog.warn(`reading dir: ${directory_path}`)
  for (const file of files) 
  {
    const filepath = path.join(directory_path, file);
    const stats = await fs.stat(filepath);

    if (stats.isDirectory()) 
    {
      omnilog.warn(`Found directory: ${filepath}`)
      filePaths = await walkDirForExtension(filepath, directory_path, substring, extension) 
    } 
    else 
    {
      omnilog.warn(`Found file: ${filepath} with ext: ${path.extname(filepath)},  comparing to ${extension}`)

      if (path.extname(filepath) === extension) 
      {
        const filename = file.toLowerCase(); // Convert filename to lowercase

        if (filename.includes(substring)) {
          omnilog.warn(`Adding ${filepath} to the list`)
          filePaths.push(filepath);
        }
        else
        {
          omnilog.warn(`${filename} does not contain ${substring}`);
        }
      }
    }
  }

  return filePaths;
}

async function read_json_file(jsonPath)
{
  const jsonContent = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  return jsonContent;
}

// Function to validate directory existence
async function validateDirectoryExists(path) 
{
    try {
      const stats = await fs.stat(path)
      return stats.isDirectory() // Returns true if directory exists
    } catch {
      return false // Returns false if directory doesn't exist
    }
  }
  
  // Function to validate file existence
  async function validateFileExists (path) 
  {
    try {
      const stats = await fs.stat(path)
      return stats.isFile() // Returns true if file exists
    } catch {
      return false // Returns false if file doesn't exist
    }
  } 

export {walkDirForExtension, validateDirectoryExists, validateFileExists, read_json_file }