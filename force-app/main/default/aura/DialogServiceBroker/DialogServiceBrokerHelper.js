({
  dialogService : function(component) {
    return component.find("dialogService");
  },
  bodyModal : function(component, config) {
    this.dialogService(component).bodyModal(
      config.auraId,
      config.headerLabel,
      config.component,
      config.componentParams
    );
  },
  bodyModalLarge : function(component, config) {
    this.dialogService(component).bodyModalLarge(
      config.auraId,
      config.headerLabel,
      config.component,
      config.componentParams
    );
  },
})