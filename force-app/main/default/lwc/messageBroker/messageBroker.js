import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { publish, MessageContext } from 'lightning/messageService';
import OPEN_CHANNEL from '@salesforce/messageChannel/OpenChannel__c';

export default class MessageBroker extends LightningElement {
    @api scopedId;
    @wire(CurrentPageReference) pageRef;
    @wire(MessageContext) messageContext;

    /* LWC broker to Aura */
    @api
    dialogService(payload) {
        const boundary = { scopedId: this.scopedId };
        publish(this.messageContext, OPEN_CHANNEL, { key: 'dialogService', value: { ...payload, ...boundary } });
    }

    @api
    notifyClose() {
        publish(this.messageContext, OPEN_CHANNEL, { key: 'notifyClose' });
    }
}
