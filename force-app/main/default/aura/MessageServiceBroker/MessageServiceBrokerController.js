({
  handleMessageService : function(component, event, helper) {
    let payload = event.getParam("payload");
    let messageService = component.find("messageService");
    switch (payload.method) {
      case "bodyModal":
        let config = payload.config;
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
