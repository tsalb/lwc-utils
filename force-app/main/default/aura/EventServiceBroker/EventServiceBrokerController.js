({
  handleLwcToAuraEvent: function(component, event, helper) {
    let eventService = component.find("eventService");
    let payload = event.getParam("finalPayload");

    console.log(JSON.parse(JSON.stringify(payload)));

    switch (payload.type) {
      case "refreshView":
        if (component.get("v.allowRecursion")) {
          component.set("v.allowRecursion", false);
          // Refresh for both, attempt to "Unify"
          component.find("eventBroker").brokerMessageToLWC({key: "forceRefreshView"});
          $A.get("e.force:refreshView").fire();
        }
        // This must remain outside the lifecycle check above
        window.setTimeout(
          $A.getCallback(function() {
            component.set("v.allowRecursion", true);
          }), 500
        );
        break;
      case "appEvent":
        eventService.fireAppEvent(payload.key, payload.value);
        break;
      case "recordEvent":
        // Re-configure the recordId on this component if overridden by message broker
        if (payload.recordId) {
          component.set("v.recordId", payload.recordId);
        }
        eventService.fireRecordEvent(payload.key, payload.value);
        break;
      case "notifyClose":
        // Close from the promise directly since from LWC the notifyClose() doesn"t seem to work, even on the source overlayLib
        let overlayPromise = component.find("dialogService").get("v.overlayPromise");
        overlayPromise.close();
        break;
      default:
    }
  },
  handleForceRefreshViewForLWC: function(component, event, helper) {
    if (component.get("v.allowRecursion")) {
      component.set("v.allowRecursion", false);
      // Refresh for both, attempt to "Unify"
      component.find("eventBroker").brokerMessageToLWC({key: "forceRefreshView"});
      $A.get("e.force:refreshView").fire();
    }
    // This must remain outside the lifecycle check above
    window.setTimeout(
      $A.getCallback(function() {
        component.set("v.allowRecursion", true);
      }), 500
    );
  },
  handleRecordEventToLWC : function(component, event, helper) {
    event.stopPropagation();
    let params = event.getParams();

    console.log(JSON.parse(JSON.stringify(params)));

    if (params.recordEventScopeId !== component.get("v.recordId")) {
      return;
    }

    switch(params.recordEventKey) {
      // Allowed list of record events which can pass through to LWC
      case "ACCOUNT_SELECTED":
        //component.find("eventBroker").brokerMessageToLWC({key: params.recordEventKey, value: params.recordEventValue});
        break;
    }
  },
  handleAppEventToLWC : function(component, event, helper) {
    event.stopPropagation();
    let params = event.getParams();

    console.log(JSON.parse(JSON.stringify(params)));

    switch(params.appEventKey) {
      // Allowed list of app events which can pass through to LWC
      case "ACCOUNT_SELECTED":
        //component.find("eventBroker").brokerMessageToLWC({key: params.appEventKey, value: params.appEventValue});
        break;
    }
  },
})