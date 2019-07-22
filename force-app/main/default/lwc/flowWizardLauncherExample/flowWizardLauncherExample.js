import { LightningElement } from 'lwc';

export default class FlowWizardLauncherExample extends LightningElement {
  openModal() {
    const messageServicePayload = {
      method: 'flow',
      config: {
        flowHeaderLabel: 'Sample Wizard',
        componentParams: {
          flowApiName: 'Sample_Wizard',
          inputVariables: [] // no inputs
        }
      }
    }
    this.template.querySelector('c-message-broker').messageService(messageServicePayload);
  }
}