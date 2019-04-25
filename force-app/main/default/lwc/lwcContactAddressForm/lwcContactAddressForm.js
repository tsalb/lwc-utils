import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent } from 'c/pubsub';

export default class LwcContactAddressForm extends LightningElement {
  @api contact;
  @api pageRef;
  @api scopedId;

  handleSuccess() {
    this.dispatchEvent(new ShowToastEvent({
      title: null,
      message: 'Updated Mailing Address Successfully.',
      variant: 'success'
    }));
    fireEvent(this.pageRef, 'forceRefreshView'); // actually targets the datatable for the refresh.
    this.template.querySelector('c-message-broker').notifyClose(); // consistent to use the @api in case implementation changes. do not fire event directly.
  }
}