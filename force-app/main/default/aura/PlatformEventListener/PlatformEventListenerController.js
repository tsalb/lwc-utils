({
  handleContactDmlEvent : function(component, event, helper) {
    const payloadJSON = JSON.stringify(event.getParam("payload"));
    component.set("v.payloadJSON", payloadJSON);
    component.set("v.showSection", true);
  },
  handleOpenPopover : function(component, event, helper) {
    const popover = component.get("v.popover");
    let timer = component.get("v.timer");

    window.clearTimeout(timer);
    timer = window.setTimeout(
      $A.getCallback(() => {
        if (popover === null || !popover) {
          helper.messageService(component).showPopover(
            component.get("v.payloadJSON"),
            null, // no params
            ".platform-event-span",
            "cPlatformEventListener,slds-popover_large,popoverclass,slds-nubbin_left",
            $A.getCallback(popover => {
              component.set("v.popover", popover);
            })
          );
        }
      }), 350
    );
    component.set("v.timer", timer);
  },
  handleClosePopover : function(component, event, helper) {
    let timer = component.get("v.timer");

    window.clearTimeout(timer);
    timer = window.setTimeout(
      $A.getCallback(() => {
        component.get("v.popover").close();
        component.set("v.popover", null);
      }), 500
    );
    component.set("v.timer", timer);
  },
})