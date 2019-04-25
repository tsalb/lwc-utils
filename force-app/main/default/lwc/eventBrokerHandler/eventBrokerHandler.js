import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

export default class EventBrokerHandler extends LightningElement {
  @api scopedId;
  @wire(CurrentPageReference) pageRef;

  connectedCallback() {
    registerListener('brokerEventToAuraEventService', this.handleMessage, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  handleMessage(finalPayload) {
    // There seems to be a bug in the pageRef scoping in lightning console app for Spring 19
    // Will double check again when Summer 19 is GA, after the rounds of post GA hotfix.
    if (
      !finalPayload.scopedId                      // for app pages, this is null
      || finalPayload.scopedId === this.scopedId  // for record flexipages
    ) {
      this.dispatchEvent(new CustomEvent('message', { detail: { finalPayload } }));
    }
  }
}