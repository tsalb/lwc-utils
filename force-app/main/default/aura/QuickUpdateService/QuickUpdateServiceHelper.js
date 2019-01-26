({
  messageService : function(component) {
    return component.find("messageService");
  },
  initializeLightningDataService : function(component, event) {
    return new Promise($A.getCallback((resolve, reject) => {
      let params = event.getParam("arguments");
      let fieldApiNameToUpdateValueMap = new Map();
      let recordId = params.configObject["recordId"];
      let fieldUpdates = params.configObject["fieldUpdates"];

      if (!$A.util.isEmpty(fieldUpdates)) {
        Object.keys(fieldUpdates).forEach(function(v,i,a) {
          fieldApiNameToUpdateValueMap.set(v, fieldUpdates[v]);
        });
      }

      component.set("v.recordId", recordId);
      component.set("v.fieldApiNameToUpdateValueMap", fieldApiNameToUpdateValueMap);
      component.set("v.fields", Array.from(fieldApiNameToUpdateValueMap.keys()));

      // init using aura:if
      component.set("v.transactionInProgress", true);

      // pass the callback down the chain
      resolve(params.callback);
    }));
  },
  pollCheckWhenFullyLoaded : function(component, event, callback) {
    let _self = this;
    if ($A.util.getBooleanValue(component.get("v.lightningDataServiceLoaded"))) {
      _self.updateWithLightningDataService(component, event, callback);
    } else {
      window.setTimeout(
        $A.getCallback(() => {
          _self.pollCheckWhenFullyLoaded(component, event, callback)
        }), 500
      );
    }
  },
  updateWithLightningDataService : function(component, event, callback) {
    let _self = this;
    let fieldApiNameToUpdateValueMap = component.get("v.fieldApiNameToUpdateValueMap");
    let simpleRecord = component.get("v.simpleRecord");

    for (let apiName of fieldApiNameToUpdateValueMap.keys()) {
      let updateValue = fieldApiNameToUpdateValueMap.get(apiName);
      simpleRecord[apiName] = $A.util.isEmpty(updateValue) || updateValue === "null"
        ? null
        : updateValue;
    }
    component.find("lds").saveRecord(
      $A.getCallback((saveResult) => {
        callback(saveResult);
      })
    );
  },
})