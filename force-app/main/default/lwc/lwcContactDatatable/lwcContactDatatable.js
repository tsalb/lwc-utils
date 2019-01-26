import { LightningElement, track, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { registerListener, unregisterAllListeners } from 'c/pubsub';
import getContactsByAccountId from '@salesforce/apex/DataServiceCtrl.getContactsByAccountId';

export default class LwcContactDatatable extends LightningElement {
  _accountId;
  _tableColumns = [
    {label: "Name", fieldName: "Name", type: "text", initialWidth: 110},
    {label: "Email", fieldName: "Email", type: "email", initialWidth: 170},
    {label: "Phone", fieldName: "Phone", type: "phone", initialWidth: 130},
    {label: "Street", fieldName: "MailingStreet", type: "text"},
    {label: "City", fieldName: "MailingCity", type: "text"},
    {label: "State", fieldName: "MailingState", type: "text"},
    {label: "Zip", fieldName: "MailingPostalCode", type: "text"},
    {label: "Country", fieldName: "MailingCountry", type: "text"},
    {type: 'button', initialWidth: 135,
      typeAttributes: {label: 'Clear Address', name: 'clear_address', title: 'Click to clear out Mailing Address'}},
    {type: 'button', initialWidth: 130,
      typeAttributes: {label: 'View Cases', name: 'view_cases', title: 'Click to view all cases against this Contact'}},
  ];

  @wire(CurrentPageReference) pageRef;

  @wire(getContactsByAccountId, { accountId: '$_accountId' })
  tableData;

  connectedCallback() {
    registerListener('accountSelected', this.handleAccountSelected, this);
    registerListener('clearTable', this.handleClearTable, this);
  }

  disconnectedCallback() {
    unregisterAllListeners(this);
  }

  handleAccountSelected(accountId) {
    this._accountId = accountId;
  }

  handleClearTable() {
    this.tableData = null;
  }

  // handleRowAction: function (component, event, helper) {
  //   let action = event.getParam("action");
  //   let row = event.getParam("row");
  //   switch (action.name) {
  //     case "clear_address":
  //       helper.clearMailingAddressWithLightningDataService(component, row);
  //       break;
  //     case  "view_cases":
  //       helper.openViewCasesModal(component, row);
  //       break;
  //   }
  // },

  // handleOpenUpdateAddressModal : function(component, event, helper) {
  //   let selectedArr = component.find("searchTable").getSelectedRows();
  //   if ($A.util.isEmpty(selectedArr)) {
  //     helper.messageService(component).showToast({
  //       message: "Please choose at least one Contact."
  //     });
  //   } else {
  //     helper.messageService(component).modal(
  //       "update-address-modal",
  //       "Update Address: "+selectedArr.length+" Row(s)",
  //       "c:ContactAddressForm",
  //       {
  //         contactList: selectedArr
  //       },
  //       "c.handleUpdateMultiAddress",
  //       "Update"
  //     );
  //   }
  // },

  // handleApplicationEvent : function(component, event, helper) {
  //   let params = event.getParams();
  //   switch(params.appEventKey) {
  //     case "ACCOUNT_ID_SELECTED": // fallthrough
  //     case "CONTACTS_UPDATED":
  //       helper.loadContactTable(component, params.appEventValue);
  //       break;
  //     case "HEADER_CLEARTABLE":
  //       component.set("v.tableData", null);
  //       break;
  //   }
  // },

}