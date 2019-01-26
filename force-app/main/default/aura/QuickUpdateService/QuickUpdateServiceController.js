({
  initUpdatePromiseChain : function(component, event, helper) {
    helper.initializeLightningDataService(component, event)
        .then($A.getCallback((callback) => {
          return helper.pollCheckWhenFullyLoaded(component, event, callback);
        }))
        .catch((error) => {
          $A.reportError("Promise Error", error);
          helper.messageService(component).showToast({
            message: error,
            variant: "error",
            mode: "pester"
          });
        });
  },
  handleRecordUpdated : function(component, event, helper) {
    let changeType = event.getParams().changeType;
    switch(changeType.toUpperCase()) {
      case "ERROR":
        helper.messageService(component).showToast({
          title: "Error in LDS",
          message: component.get("v.simpleRecordError"),
          variant: "error",
          mode: "pester"
        });
        break;
      case "LOADED" :
        component.set("v.lightningDataServiceLoaded", true);
        break;
      case "CHANGED":
        // destroy using aura:if
        component.set("v.transactionInProgress", false);
        // clear everything
        component.set("v.fieldUpdates", null);
        component.set("v.fieldApiNameToUpdateValueMap", null);
        component.set("v.recordId", null);
        component.set("v.fields", null);
        component.set("v.simpleRecord", null);
        component.set("v.simpleRecordError", null);
        component.set("v.lightningDataServiceLoaded", false);
        break;
    }
  },
})