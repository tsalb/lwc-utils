({
  doInit : function(component, event, helper) {
    let flowApiName = component.get("v.flowApiName");
    let inputVars =  component.get("v.inputVariables");
    helper.flow(component).startFlow(flowApiName, inputVars);
  },
  handleStatusChange : function(component, event, helper) {
    let status = event.getParam("status");
    let payload = event.getParams();
    console.log(JSON.parse(JSON.stringify(payload)));
    if (status === "FINISHED") {
      helper.eventService(component).fireAppEvent("FLOW_WRAPPER_FINISHED");
    }
  }
})