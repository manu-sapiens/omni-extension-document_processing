// blocks.js


const runBlock = async (ctx, block, args) =>
{
    const componentService = ctx.app.services.get('componentService');
    const component = componentService.components.get(block);

    if (!component) throw new Error(`Component ${block} not found`);

    const node = {
        id: block,
        name: block,
        type: 'component',
        component: block,
        inputs: [],
        outputs: [],
        data: {}
    };
    const inputData = {};
    for (const key in args)
    {
        inputData[key] = [args[key]]; // inputs are arrays
    }
    const outputData = { text: '' };

    const input_string = JSON.stringify(inputData);
    const parsed_data = JSON.parse(input_string);
    const ctx2 = { node, inputs: parsed_data, outputs: outputData, app: ctx.app, workflowId: 0, sessionId: ctx.session.sessionId, userId: ctx.user.id, jobId: 0, engine: null, args: {} };

    try
    {
        const result = await component.workerStart(inputData, ctx2);
        return result;
    }
    catch (err)
    {
        throw new Error(`Error running block ${block}: ${err}`);
    }
};

export {runBlock}