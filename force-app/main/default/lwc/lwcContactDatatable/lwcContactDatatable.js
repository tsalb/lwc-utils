import { LightningElement, api, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { registerListener, unregisterAllListeners } from 'c/pubsub';
import { updateRecord } from 'lightning/uiRecordApi';
import wireContactsByAccountId  from '@salesforce/apex/DataServiceCtrl.wireContactsByAccountId';
import getContactsByAccountId  from '@salesforce/apex/DataServiceCtrl.getContactsByAccountId';

const TABLE_COLUMNS = [
  {label: 'Name', fieldName: 'Name', type: 'text', initialWidth: 110},
  {label: 'Email', fieldName: 'Email', type: 'email', initialWidth: 170},
  {label: 'Phone', fieldName: 'Phone', type: 'phone', initialWidth: 130},
  {label: 'Street', fieldName: 'MailingStreet', type: 'text'},
  {label: 'City', fieldName: 'MailingCity', type: 'text'},
  {label: 'State', fieldName: 'MailingState', type: 'text'},
  {label: 'Zip', fieldName: 'MailingPostalCode', type: 'text'},
  {label: 'Country', fieldName: 'MailingCountry', type: 'text'},
  {type: 'button', initialWidth: 135,
    typeAttributes: {label: 'Clear Address', name: 'clear_address', title: 'Click to clear out Mailing Address'}},
  {type: 'button', initialWidth: 155,
    typeAttributes: {label: 'Update Address', name: 'update_address', title: 'Click to open modal to update Mailing Address'}},
];

export default class LwcContactDatatable extends LightningElement {
  @api
  get recordId() {
    return this._accountId;
  }
  set recordId(value) {
    this._accountId = value;
  }
  @track columns = TABLE_COLUMNS;

  @wire(CurrentPageReference)pageRef;

  @wire(wireContactsByAccountId, { accountId: '$_accountId' })
  contacts;

  // private
  _accountId;

  connectedCallback() {
    registerListener('accountSelected', this.handleAccountSelected, this);
    registerListener('forceRefreshView', this.reloadTable, this);
    registerListener('clearTable', this.handleClearTable, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  handleAccountSelected(accountId) {
    this._accountId = accountId;
  }

  handleClearTable() {
    this.contacts = [];
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
        const messageServicePayload = {
          method: 'bodyModal',
          config: {
            auraId: 'update-address-single-row',
            headerLabel: 'Update Address',
            component: 'c:lwcContactAddressForm',
            componentParams: {
              contact: row,
              pageRef: this.pageRef
            }
          }
        }
        this.template.querySelector('c-message-broker').messageService(messageServicePayload);
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
    }
    try {
      await updateRecord(recordObject);
    } catch (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          message: String(error),
          variant: 'error',
        })
      );
    } finally {
      this.reloadTable();
    }
  }

  async reloadTable() {
    console.log('reloadTable');
    try {
      this.contacts.data = await getContactsByAccountId({accountId: this._accountId});
    } catch (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          message: String(error),
          variant: 'error',
        })
      );
    } finally {
      this.template.querySelector('c-event-broker').forceRefreshView();
    }
  }
}