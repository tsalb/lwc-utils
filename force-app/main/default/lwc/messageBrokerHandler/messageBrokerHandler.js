import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

export default class MessageBrokerHandler extends LightningElement {
  @api scopedId;
  @wire(CurrentPageReference) pageRef;

  connectedCallback() {
    registerListener('messageService', this.messageServiceEmitter, this);
    registerListener('notifyClose', this.notifyCloseEmitter, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  messageServiceEmitter(payload) {
    // There seems to be a bug in the pageRef scoping in lightning console app for Spring 19
    // Will double check again when Summer 19 is GA, after the rounds of post GA hotfix.
    if (
      !payload.scopedId                      // for app pages, this is null
      || payload.scopedId === this.scopedId  // for record flexipages
    ) {
      this.dispatchEvent(new CustomEvent('message', { detail: { payload } }));
    }
  }

  notifyCloseEmitter() {
    this.dispatchEvent(new CustomEvent('notifyclose'));
  }

}