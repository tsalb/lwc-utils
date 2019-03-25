import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent } from 'c/pubsub';

export default class LwcContactAddressForm extends LightningElement {
  @api contact;
  @api pageRef;

  handleSuccess() {
    this.dispatchEvent(new ShowToastEvent({
      title: null,
      message: 'Updated Mailing Address Successfully.',
      variant: 'success'
    }));
    fireEvent(this.pageRef, 'reloadTable');
    fireEvent(this.pageRef, 'notifyClose');
  }
}