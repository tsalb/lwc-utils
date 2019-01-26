({
  handleFetchAccountCombobox : function(component, event, helper) {
    let params = event.getParam("arguments");
    let action = component.get("c.getAccountOptions");
    helper.dispatchAction(component, action, params);
  },
  handleFetchContactsByAccountId : function(component, event, helper) {
    let params = event.getParam("arguments");
    let action = component.get("c.getContactsByAccountId");
    action.setParams({
      accountId : params.accountIdEventArg
    });
    helper.dispatchAction(component, action, params);
  },
  handleUpdateMultiContactAddress : function(component, event, helper) {
    let params = event.getParam("arguments");
    let action = component.get("c.updateMultiContactAddress");
    action.setParams({
      conList : params.contactList,
      conStreet : params.contactMailingStreet,
      conCity : params.contactMailingCity,
      conState : params.contactMailingState,
      conZip : params.contactMailingZip,
      conCountry : params.contactMailingCountry
    });
    helper.dispatchAction(component, action, params);
  },
})