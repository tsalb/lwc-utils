import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

export default class MessageBroker extends LightningElement {
  @wire(CurrentPageReference) pageRef;

  connectedCallback() {
    registerListener('messageService', this.messageServiceEmitter, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  messageServiceEmitter(payload) {
    // Just pass this on through to the parent enclosing aura component
    this.dispatchEvent(new CustomEvent('message', { detail: { payload } }));
  }

}