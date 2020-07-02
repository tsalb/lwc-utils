import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccountOptionsCache from '@salesforce/apex/DataServiceCtrl.getAccountOptionsCache';

export default class LwcAccountSelector extends LightningElement {
    topAccounts;

    // private
    _isRendered;
    _messageService;

    @wire(getAccountOptionsCache)
    wiredTopAccounts({ error, data }) {
        if (data) {
            this.topAccounts = data.items;
        } else if (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    message: String(error),
                    variant: 'error'
                })
            );
        }
    }

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._messageService = this.template.querySelector('c-message-service');
    }

    handleAccountOptionSelected(event) {
        const payload = {
            accountId: event.target.value
        };
        this._messageService.publish({ key: 'accountselected', value: payload });
    }

    handleClearTable() {
        this._messageService.publish({ key: 'cleartable' });
    }
}
