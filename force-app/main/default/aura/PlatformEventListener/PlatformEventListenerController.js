({
  doInit: function (component, event, helper) {
    component.set("v.isEmpApiConnected", true);
  },
  handleContactDmlEvent : function(component, event, helper) {
    let params = event.getParams();
    console.log(params.channel);
    component.set("v.payloadJSON", JSON.stringify(params.payload));
    component.set("v.showSection", true);
  },
  handleOpenPopover : function(component, event, helper) {
    let popover = component.get("v.popover");
    let timer = component.get("v.timer");
    window.clearTimeout(timer);
    if (!popover) {
      timer = window.setTimeout(
        $A.getCallback(() => {
          helper.dialogService(component).showPopover(
            "c:PopoverBody",
            {
              value: component.get("v.payloadJSON")
            },
            ".platform-event-span",
            "cPlatformEventListener,slds-popover_large,popoverclass,slds-nubbin_left",
            $A.getCallback(result => {
              component.find("eventService").fireAppEvent("SET_ABORT_CLOSE", false);
              component.set("v.popover", result.popover);
            })
          )
        }), 350
      );
    }
    component.set("v.timer", timer);
  },
  handleClosePopover : function(component, event, helper) {
    let timer = component.get("v.timer");
    window.clearTimeout(timer);
    timer = window.setTimeout(
      $A.getCallback(() => {
        if (!component.get("v.abortClose")) {
          component.get("v.popover").close();
          component.set("v.popover", null);
        }
      }), 500
    );
    component.set("v.timer", timer);
  },
  handleApplicationEvent : function(component, event, helper) {
    let params = event.getParams();
    switch(params.appEventKey) {
      case "SET_ABORT_CLOSE":
        let value = $A.util.getBooleanValue(params.appEventValue);
        component.set("v.abortClose", value);
        break;
      case "CLOSE_POPOVER":
        component.get("v.popover").close();
        component.set("v.popover", null);
        break;
    }
  },
})