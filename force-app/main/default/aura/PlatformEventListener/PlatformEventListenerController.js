({
  handleContactDmlEvent : function(component, event, helper) {
    let payloadJSON = JSON.stringify(event.getParam("payload"));
    component.set("v.payloadJSON", payloadJSON);
  }
})