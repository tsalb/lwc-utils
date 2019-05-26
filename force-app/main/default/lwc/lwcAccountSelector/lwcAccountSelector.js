import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent } from 'c/pubsub';
import getAccountOptionsCache from '@salesforce/apex/DataServiceCtrl.getAccountOptionsCache';

export default class LwcAccountSelector extends LightningElement {
  @track topAccounts;

  @wire(CurrentPageReference) pageRef;

  @wire(getAccountOptionsCache)
  wiredTopAccounts({ error, data }) {
    if (data) {
      this.topAccounts = data.items;
    } else if (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          message: String(error),
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