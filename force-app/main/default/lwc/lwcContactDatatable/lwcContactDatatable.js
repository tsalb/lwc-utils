import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import wireContactsByAccountId from '@salesforce/apex/DataServiceCtrl.wireContactsByAccountId';
import getContactsByAccountId from '@salesforce/apex/DataServiceCtrl.getContactsByAccountId';

const TABLE_COLUMNS = [
    { label: 'Name', fieldName: 'Name', type: 'text', initialWidth: 110 },
    { label: 'Email', fieldName: 'Email', type: 'email', initialWidth: 170 },
    { label: 'Phone', fieldName: 'Phone', type: 'phone', initialWidth: 130 },
    { label: 'Street', fieldName: 'MailingStreet', type: 'text' },
    { label: 'City', fieldName: 'MailingCity', type: 'text' },
    { label: 'State', fieldName: 'MailingState', type: 'text' },
    { label: 'Zip', fieldName: 'MailingPostalCode', type: 'text' },
    { label: 'Country', fieldName: 'MailingCountry', type: 'text' },
    {
        type: 'button',
        initialWidth: 135,
        typeAttributes: { label: 'Clear Address', name: 'clear_address', title: 'Click to clear out Mailing Address' }
    },
    {
        type: 'button',
        initialWidth: 155,
        typeAttributes: {
            label: 'Update Address',
            name: 'update_address',
            title: 'Click to open modal to update Mailing Address'
        }
    }
];

export default class LwcContactDatatable extends LightningElement {
    @api
    get recordId() {
        return this._recordId;
    }
    set recordId(value) {
        this._accountId = value;
        this._recordId = value;
    }
    columns = TABLE_COLUMNS;

    @wire(wireContactsByAccountId, { accountId: '$_accountId' })
    contacts;

    // private
    _isRendered;
    _messageService;
    _accountId; // app flexipages
    _recordId; // record flexipage

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._messageService = this.template.querySelector('c-message-service');
    }

    // Event handlers

    handleClearTable() {
        this.contacts = [];
    }

    handleAccountSelected(event) {
        this._accountId = event.detail.value;
    }

    handleRefreshContacts() {
        this.reloadTable();
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'clear_address': {
                this.clearMailingAddress(row);
                break;
            }
            case 'update_address': {
                const dialogServicePayload = {
                    method: 'bodyModal',
                    config: {
                        auraId: 'update-address-single-row',
                        headerLabel: 'Update Address',
                        component: 'c:lwcContactAddressForm',
                        componentParams: {
                            boundary: this._recordId, // null for app page is fine
                            contact: row
                        }
                    }
                };
                this._messageService.dialogService(dialogServicePayload);
                break;
            }
            default:
        }
    }

    async clearMailingAddress(row) {
        let recordObject = {
            fields: {
                Id: row.Id,
                MailingStreet: null,
                MailingCity: null,
                MailingState: null,
                MailingPostalCode: null,
                MailingCountry: null
            }
        };
        try {
            await updateRecord(recordObject);
        } catch (error) {
            this._messageService.notifySingleError('Error Clearing Mailing Address', error);
        } finally {
            this.reloadTable();
        }
    }

    async reloadTable() {
        try {
            this.contacts.data = await getContactsByAccountId({ accountId: this._accountId });
        } catch (error) {
            this._messageService.notifySingleError('Error Reloading Table', error);
        }
    }
}
