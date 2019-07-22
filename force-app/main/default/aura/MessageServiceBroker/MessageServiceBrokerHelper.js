({
  messageService : function(component) {
    return component.find("messageService");
  },
  bodyModal : function(component, config) {
    this.messageService(component).bodyModal(
      config.auraId,
      config.headerLabel,
      config.component,
      config.componentParams
    );
  },
  bodyModalLarge : function(component, config) {
    this.messageService(component).bodyModalLarge(
      config.auraId,
      config.headerLabel,
      config.component,
      config.componentParams
    );
  },
})