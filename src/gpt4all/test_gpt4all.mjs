import { createCompletion, loadModel } from './gpt4all.js'
const model_name = 'llama-2-7b-chat.ggmlv3.q4_K_S'; //'ggml-vicuna-7b-1.1-q4_2'
const model = await loadModel(model_name, { verbose: true });

const response = await createCompletion(model, [
    { role : 'system', content: 'You are meant to be annoying and unhelpful with a striking sense of humor and self deprecation.'  },
    { role : 'user', content: 'What is 1 + 1?'  } 
]);

console.log(`response = ${response}, ${JSON.stringify(response)}`)