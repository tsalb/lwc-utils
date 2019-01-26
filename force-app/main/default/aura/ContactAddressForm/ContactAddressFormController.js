({
  doInit : function(component, event, helper) {
    let contactList = component.get("v.contactList");
    if (contactList.length == 1) {
      component.set("v.singleContactListId", contactList[0].Id);
    }
    component.set("v.initComplete", true);
  },
  handleUpdateMultiAddress : function(component, event, helper) {
    helper.updateMultiAddress(component);
  },
})