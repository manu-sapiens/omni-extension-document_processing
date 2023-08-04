import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'mercs_rete';
import { ComponentComposer } from 'mercs_rete/lib/components/openapi/Composers';

function setComponentInputs(component: ComponentComposer, inputs: any[]): ComponentComposer
{
       
    inputs.forEach(({ name, type, customSocket, description, defaultValue, title }) => 
    {
        component.addInput(
            component.createInput(name, type, customSocket)
            .set('title', title || '')
            .set('description', description || '')
            .setDefault(defaultValue)
            .toOmniIO()
            )
    });
        
    return component;
}

function setComponentOutputs(component: ComponentComposer, outputs: any[]): ComponentComposer
{
       
    outputs.forEach(({ name, type, customSocket, description, title}) => {
        component.addOutput(
            component.createOutput(name, type, customSocket)
            .set('title', title || '')
            .set('description', description || '')
            .toOmniIO()
            )});
    return component;
}

function setComponentControls(component: ComponentComposer, controls: any[]): ComponentComposer
{
    controls.forEach(({ name, title, placeholder, description }) => {
        component.addControl(
            component.createControl(name)
            .set('title', title || '')
            .set('placeholder', placeholder || '')
            .set('description', description || '')
            .toOmniControl() 
            )});

    return component;
}

export { setComponentInputs, setComponentOutputs, setComponentControls}