import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { subscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import OPEN_CHANNEL from '@salesforce/messageChannel/OpenChannel__c';

export default class EventBrokerHandler extends LightningElement {
    @api scopedId;
    @wire(CurrentPageReference) pageRef;
    @wire(MessageContext) messageContext;

    _subscription;

    connectedCallback() {
        this._subscription = subscribe(
            this.messageContext,
            OPEN_CHANNEL,
            message => {
                let payload = {};
                // messageChannel payload has immutable props, undo them here
                if (message.value) {
                    payload = JSON.parse(JSON.stringify(message.value));
                }
                // List of acceptable keys to be parsed in this component
                if (message.key === 'brokerEventToAura') {
                    this.handleMessage(payload);
                }
            },
            { scope: APPLICATION_SCOPE }
        );
    }

    handleMessage(payload) {
        // There seems to be a bug in the pageRef scoping in lightning console app for Spring 19
        // Will double check again when Summer 19 is GA, after the rounds of post GA hotfix.
        if (
            !payload.scopedId || // for app pages, this is null
            payload.scopedId === this.scopedId // for record flexipages
        ) {
            this.dispatchEvent(new CustomEvent('message', { detail: { payload } }));
        }
    }
}
