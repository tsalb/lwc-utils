({
  handleEnterPopover : function(component, event, helper) {
    component.find("eventService").fireAppEvent("SET_ABORT_CLOSE", true);
    let timer = component.get("v.timer");
    window.clearTimeout(timer);
  },
  handleLeavePopover : function(component, event, helper) {
    let timer = component.get("v.timer");
    window.clearTimeout(timer);
    timer = window.setTimeout(
      $A.getCallback(() => {
        component.find("eventService").fireAppEvent("CLOSE_POPOVER");
      }), 500
    );
    component.set("v.timer", timer);
  }
})
