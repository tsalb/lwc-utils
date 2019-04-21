import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

export default class EventBrokerHandler extends LightningElement {
  @wire(CurrentPageReference) pageRef;

  connectedCallback() {
    registerListener('brokerMessageToAuraEventService', this.handleMessage, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  handleMessage(finalPayload) {
    //console.log(JSON.parse(JSON.stringify(finalPayload)));
    this.dispatchEvent(
      new CustomEvent(
        'message', {
          detail: { finalPayload }
        }
      )
    );
  }
}