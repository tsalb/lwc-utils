import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';
import OPEN_CHANNEL from "@salesforce/messageChannel/OpenChannel__c";

export default class LwcContactAddressForm extends LightningElement {
  @api contact;
  @api pageRef;
  @api scopedId;
  @wire(MessageContext) messageContext;

  handleSuccess() {
    this.dispatchEvent(new ShowToastEvent({
      title: null,
      message: 'Updated Mailing Address Successfully.',
      variant: 'success'
    }));
    publish(this.messageContext, OPEN_CHANNEL, { key: 'forceRefreshView' }); // actually targets the datatable for the refresh.
    this.template.querySelector('c-message-broker').notifyClose(); // consistent to use the @api in case implementation changes. do not fire event directly.
  }
}