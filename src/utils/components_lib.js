
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
        var name = input.name, type = input.type, customSocket = input.customSocket, description = input.description, defaultValue = input.defaultValue, title = input.title, choices = input.choices, minimum = input.minimum, maximum = input.maximum, step = input.step;
        
        if (!title || title == '') title = generateTitle(name);
        
        component.addInput(
            component.createInput(name, type, customSocket)
            .set('title', title || '')
            .set('description', description || '')
            .set('choices', choices || null)
            .set('minimum', minimum || null)
            .set('maximum', maximum || null)
            .set('step', step || null)
            .setDefault(defaultValue)
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

class Component
{
    constructor(group_id, id, title, category, description, summary, inputs, outputs, controls, payloadParser)
    {
        this.group_id = group_id;
        this.id = id;
        this.title = title;
        this.category = category
        this.description = description;
        this.summary = summary;
        this.inputs = inputs;
        this.outputs = outputs;
        this.controls = controls;
        this.payloadParser = payloadParser;
 
        let component = OAIBaseComponent
            .create(this.group_id, this.id)
            .fromScratch()
            .set('title', this.title)
            .set('category', this.category)
            .set('description', this.description)
            .setMethod('X-CUSTOM')
            .setMeta({
                source: {
                    summary: this.summary,
                    links: {
                    },
                }
            });
            
        component = setComponentInputs(component, this.inputs);
        component = setComponentOutputs(component, this.outputs);
        if (this.controls) component = setComponentControls(component, this.controls);
        component.setMacro(OmniComponentMacroTypes.EXEC, this.payloadParser);

        this.component = component.toJSON();
    }
}

export { Component, setComponentInputs, setComponentOutputs, setComponentControls}