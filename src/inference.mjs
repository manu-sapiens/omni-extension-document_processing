import { LLM } from "llama-node";
import { LLamaCpp } from "llama-node/dist/llm/llama-cpp.js";
import path from "path";
const model_dir = path.join(process.cwd(),"..","models")
const model_path = path.resolve(model_dir, 'ggml-vicuna-7b-1.1-q4_0.bin');//'wizard-vicuna-7b-uncensored-superhot-8k.ggmlv3.q3_K_S.bin');//'dolphin-llama2-7b.ggmlv3.q3_K_S.bin');//'llama-2-7b-chat.ggmlv3.q4_K_S.bin');//'open-llama-7b-v2-q3_K_S.bin');//"ggml-vic7b-q5_1.bin");
console.log(`model dir = ${model_path}`)
const llama = new LLM(LLamaCpp);
const config = {
    modelPath: model_path,
    enableLogging: true,
    nCtx: 1024,
    seed: 0,
    f16Kv: false,
    logitsAll: false,
    vocabOnly: false,
    useMlock: false,
    embedding: false,
    useMmap: true,
    nGpuLayers: 0
};
const template = `How are you?`;
const prompt = `A chat between a user and an assistant.
USER: ${template}
ASSISTANT:`;
const params = {
    nThreads: 4,
    nTokPredict: 2048,
    topK: 40,
    topP: 0.1,
    temp: 0.2,
    repeatPenalty: 1,
    prompt,
};
const run = async () => {
    await llama.load(config);
    await llama.createCompletion(params, (response) => {
        process.stdout.write(response.token);
    });
};
run();
