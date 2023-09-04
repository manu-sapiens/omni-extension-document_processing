/*
import { LanceDB } from "langchain/vectorstores/lancedb";
import { connect } from "vectordb";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";

async function newDbTable(vectorstore_name)
{
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), vectorstore_name));
    const db = await connect(dir);
    const table = await db.createTable("vectors", []);
    // { vector: Array(1536), text: "Hello world", id: 1 },
    return table;
}

export async function loadDbTable(embedding, vectorstore_name, dir)
{
    let table = null;
    const uri = "" // TBD: create uri from dir and vectorstore_name
    // if uri does not exist
    if (false)
    {
        table = await newDbTable(vectorstore_name);    
    }
    else
    {
        const db = await connect(uri);
        table = await db.openTable("vectors");
    }     
    const vectorStore = new LanceDB(embedding, { table });
    return table;
}

export async function lancedb_from_texts(texts, text_ids, embedder, dbConfig) {
    return await LanceDB.fromTexts(texts, text_ids, embedder, dbConfig);
}
*/

