import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

export default class MessageBrokerHandler extends LightningElement {
  @wire(CurrentPageReference) pageRef;

  connectedCallback() {
    registerListener('messageService', this.messageServiceEmitter, this);
    registerListener('notifyClose', this.notifyCloseEmitter, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  messageServiceEmitter(payload) {
    //console.log(JSON.parse(JSON.stringify(payload)));
    this.dispatchEvent(new CustomEvent('message', { detail: { payload } }));
  }

  notifyCloseEmitter() {
    this.dispatchEvent(new CustomEvent('notifyclose'));
  }

}