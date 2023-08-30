import { ClientExtension, ClientUtils } from 'mercs_client'
import fs from 'fs/promises';
import path from 'path';
//import { omnilog } from 'mercs_shared';

async function fetchJsonFromUrl(url)
{
  const json = await ClientUtils.fetchJSON(url);
  return json;
}

async function walkDirForExtension(filePaths, directory_path, extension) 
{
  const files = await fs.readdir(directory_path);
  for (const file of files) 
  {

    const filepath = path.join(directory_path, file);
    const stats = await fs.stat(filepath);

    if (stats.isDirectory()) 
    {
  
      filePaths = await walkDirForExtension(filePaths, filepath, extension) 
    } 
    else 
    {
      if (path.extname(filepath) === extension) 
      {

        filePaths.push(filepath);
      }
    }
  }

  return filePaths;
}

async function readJsonFromDisk(jsonPath)
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

export {walkDirForExtension, validateDirectoryExists, validateFileExists, readJsonFromDisk, fetchJsonFromUrl }