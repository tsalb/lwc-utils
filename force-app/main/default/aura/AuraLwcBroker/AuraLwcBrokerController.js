({
  handleMessageService : function(component, event, helper) {
    const payload = event.getParam("payload");
    const messageService = component.find("messageService");
    
    console.log(JSON.parse(JSON.stringify(payload)));

    switch (payload.method) {
      case "bodyModal":
        const config = payload.config;
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
    console.log('hello');
    component.find("messageService").get("v.overlayPromise").close();
  }
})
