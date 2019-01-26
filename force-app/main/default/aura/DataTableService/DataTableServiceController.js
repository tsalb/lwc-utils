({
  handleFetchData : function(component, event, helper) {
    let params = event.getParam("arguments");
    let action = component.get("c.createTableCache");
    action.setParams({
      tableRequest : params.tableRequest
    });
    helper.dispatchAction(component, action, params);
  },
})