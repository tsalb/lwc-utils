import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';

export default class MessageBroker extends LightningElement {
  @api scopedId;
  @wire(CurrentPageReference) pageRef;

  /* LWC broker to Aura */
  @api
  messageService(payload) {
    const boundary = { scopedId: this.scopedId };
    fireEvent(this.pageRef, 'messageService', { ...payload, ...boundary } );
  }

  @api
  notifyClose() {
    fireEvent(this.pageRef, 'notifyClose');
  }
  
}