import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent } from 'c/pubsub';
import getAccountOptions from '@salesforce/apex/DataServiceCtrl.getAccountOptions';

export default class LwcAccountSelector extends LightningElement {
  @track topAccounts;

  @wire(CurrentPageReference) pageRef;

  @wire(getAccountOptions)
  wiredTopAccounts({ error, data }) {
    if (data) {
      this.topAccounts = JSON.parse(data).items;
    } else if (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          message: error,
          variant: "error",
        })
      );
    }
  }

  handleAccountOptionSelected(event) {
    fireEvent(this.pageRef, 'accountSelected', event.target.value);
  }

  handleClearTable() {
    fireEvent(this.pageRef, 'clearTable');
  }
}