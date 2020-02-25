import { LightningElement } from 'lwc';

export default class FlowWizardLauncherExample extends LightningElement {
  openModal() {
    const dialogServicePayload = {
      method: 'flow',
      config: {
        flowHeaderLabel: 'Sample LWC Wizard',
        componentParams: {
          flowApiName: 'Sample_LWC_Wizard',
          inputVariables: [] // no inputs
        }
      }
    }
    this.template.querySelector('c-message-broker').dialogService(dialogServicePayload);
  }
}