
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';

function generateTitle(name) 
{
    const title = name
      .replace(/_/g, ' ')  // Replace all underscores with spaces
      .replace(/\b\w/g, (match) => match.toUpperCase()); // Capitalize the first letter of each word

    return title;
}
  
function setComponentInputs(component, inputs) {
    inputs.forEach(function (input) {
        var name = input.name, type = input.type, customSocket = input.customSocket, description = input.description, default_value = input.defaultValue, title = input.title, choices = input.choices, minimum = input.minimum, maximum = input.maximum, step = input.step;
        
        if (!title || title == '') title = generateTitle(name);
        
        component.addInput(
            component.createInput(name, type, customSocket)
            .set('title', title || '')
            .set('description', description || '')
            .set('choices', choices || null)
            .set('minimum', minimum || null)
            .set('maximum', maximum || null)
            .set('step', step || null)
            .setDefault(default_value)
            .toOmniIO()
        );
    });
    return component;
}

function setComponentOutputs(component, outputs) {
    outputs.forEach(function (output) {
        var name = output.name, type = output.type, customSocket = output.customSocket, description = output.description, title = output.title;

        if (!title || title == '') title = generateTitle(name);

        component.addOutput(
            component.createOutput(name, type, customSocket)
            .set('title', title || '')
            .set('description', description || '')
            .toOmniIO()
        );
    });
    return component;
}

function setComponentControls(component, controls) {
    controls.forEach(function (control) {
        var name = control.name, title = control.title, placeholder = control.placeholder, description = control.description;

        if (!title || title == '') title = generateTitle(name);

        component.addControl(
            component.createControl(name)
            .set('title', title || '')
            .set('placeholder', placeholder || '')
            .set('description', description || '')
            .toOmniControl() 
        );
    });
    return component;
}

function createComponent(group_id, id, title, category, description, summary, links, inputs, outputs, controls, payloadParser)
{
    if (!links) links = {}

    let baseComponent = OAIBaseComponent
        .create(group_id, id)
        .fromScratch()
        .set('title', title)
        .set('category', category)
        .set('description', description)
        .setMethod('X-CUSTOM')
        .setMeta({
            source: {
                summary: summary,
                links: links,
            }
        });
        
    baseComponent = setComponentInputs(baseComponent, inputs);
    baseComponent = setComponentOutputs(baseComponent, outputs);
    if (controls) baseComponent = setComponentControls(baseComponent, controls);
    baseComponent.setMacro(OmniComponentMacroTypes.EXEC, payloadParser);

    const component = baseComponent.toJSON();
    return component;
}


export { createComponent, setComponentInputs, setComponentOutputs, setComponentControls}