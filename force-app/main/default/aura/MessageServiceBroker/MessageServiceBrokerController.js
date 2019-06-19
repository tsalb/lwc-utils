({
  handleMessageService : function(component, event, helper) {
    let payload = event.getParam("payload");
    let messageService = component.find("messageService");
    let config = payload.config;

    switch (payload.method) {
      case "bodyModal":
        messageService.bodyModal(
          config.auraId,
          config.headerLabel,
          config.component,
          config.componentParams
        );
        break;
      case "bodyModalLarge":
        messageService.bodyModal(
          config.auraId,
          config.headerLabel,
          config.component,
          config.componentParams
        );
        break;
    }
  },
  handleNotifyClose : function(component, event, helper) {
    component.find("messageService").get("v.overlayPromise").close();
  },
})
