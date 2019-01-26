({
  doInit: function (component, event, helper) {
    helper.service(component).fetchAccountCombobox(
      $A.getCallback((error, data) => {
        // This returns whatever datatype is specified in the controller
        if (!$A.util.isEmpty(data)) {
          component.set("v.topAccounts", JSON.parse(data).items);
        } else {
          helper.messageService(component).showToast({
            message: "No Accounts in org!",
            variant: "error"
          });
        }
      })
    );
  },
  handleAccountOptionSelected : function(component, event, helper) {
    helper.eventService(component).fireAppEvent("ACCOUNT_ID_SELECTED", event.getParam("value"));
  },
  handleClearTableOnly : function(component, event, helper) {
    helper.eventService(component).fireAppEvent("HEADER_CLEARTABLE");
  },
})