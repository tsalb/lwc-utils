import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

export default class MessageBroker extends LightningElement {
  @wire(CurrentPageReference) pageRef;

  connectedCallback() {
    // These are granular for example, but it's entirely possible to genericise these
    // so that the aura controller is handling the granlarity.
    registerListener('messageService', this.messageServiceEmitter, this);
    registerListener('notifyClose', this.notifyCloseEmitter, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  messageServiceEmitter(payload) {
    // Just pass this on through to the parent enclosing aura component
    this.dispatchEvent(new CustomEvent('message', { detail: { payload } }));
  }

  notifyCloseEmitter() {
    this.dispatchEvent(new CustomEvent('notifyclose'));
  }

}