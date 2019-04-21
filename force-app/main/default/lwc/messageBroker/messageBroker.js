import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';

export default class MessageBroker extends LightningElement {
  @wire(CurrentPageReference) pageRef;

  /* LWC broker to Aura */
  @api
  messageService(payload) {
    //console.log(JSON.parse(JSON.stringify(payload)));
    fireEvent(this.pageRef, 'messageService', payload);
  }

  @api
  notifyClose() {
    fireEvent(this.pageRef, 'notifyClose');
  }
  
}