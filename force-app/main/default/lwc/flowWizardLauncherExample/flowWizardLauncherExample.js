import { LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';

import USERNAME_FIELD from '@salesforce/schema/User.Username';

export default class FlowWizardLauncherExample extends LightningElement {
    _userId = Id;

    @wire(getRecord, { recordId: '$_userId', fields: [USERNAME_FIELD] })
    user;

    get userName() {
        return getFieldValue(this.user.data, USERNAME_FIELD);
    }

    handleOpenDialog() {
        const dialogServicePayload = {
            method: 'flow',
            config: {
                flowHeaderLabel: 'Sample LWC Wizard',
                componentParams: {
                    flowApiName: 'Sample_LWC_Wizard',
                    inputVariables: [
                        {
                            name: 'UserName',
                            type: 'String',
                            value: this.userName
                        }
                    ]
                }
            }
        };
        this.template.querySelector('c-message-broker').dialogService(dialogServicePayload);
    }
}
