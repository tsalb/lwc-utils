import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';
import OPEN_CHANNEL from "@salesforce/messageChannel/OpenChannel__c";
import getAccountOptionsCache from '@salesforce/apex/DataServiceCtrl.getAccountOptionsCache';

export default class LwcAccountSelector extends LightningElement {
  topAccounts;
  @wire(CurrentPageReference) pageRef;
  @wire(MessageContext) messageContext;

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
    publish(this.messageContext, OPEN_CHANNEL, { key: 'accountSelected', value: event.target.value });
  }

  handleClearTable() {
    publish(this.messageContext, OPEN_CHANNEL, { key: 'clearTable' });
  }
}