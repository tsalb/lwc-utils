({
  handleCancel : function(component, event, helper) {
    component.find("overlayLib").notifyClose();
  }
})