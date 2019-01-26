({
  handleRowAction: function (component, event, helper) {
    let action = event.getParam("action");
    let row = event.getParam("row");
    switch (action.name) {
      case "clear_address":
        helper.clearMailingAddressWithLightningDataService(component, row);
        break;
      case  "view_cases":
        helper.openViewCasesModal(component, row);
        break;
    }
  },
  handleOpenUpdateAddressModal : function(component, event, helper) {
    let selectedArr = component.find("searchTable").getSelectedRows();
    if ($A.util.isEmpty(selectedArr)) {
      helper.messageService(component).showToast({
        message: "Please choose at least one Contact."
      });
    } else {
      helper.messageService(component).modal(
        "update-address-modal",
        "Update Address: "+selectedArr.length+" Row(s)",
        "c:ContactAddressForm",
        {
          contactList: selectedArr
        },
        "c.handleUpdateMultiAddress",
        "Update"
      );
    }
  },
  handleApplicationEvent : function(component, event, helper) {
    let params = event.getParams();
    switch(params.appEventKey) {
      case "ACCOUNT_ID_SELECTED": // fallthrough
      case "CONTACTS_UPDATED":
        helper.loadContactTable(component, params.appEventValue);
        break;
      case "HEADER_CLEARTABLE":
        component.set("v.tableData", null);
        break;
    }
  },
})