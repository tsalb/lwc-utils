({
  handleDialogService : function(component, event, helper) {
    let payload = event.getParam("payload");
    let config = payload.config;
    let flowModalConfig;

    if (payload.method.startsWith('flow')) {
      flowModalConfig = {
        auraId: 'flow-wizard-container',
        headerLabel: config.flowHeaderLabel,
        component: 'c:FlowWrapper',
        componentParams: {
          flowApiName: config.componentParams.flowApiName,
          inputVariables: config.componentParams.inputVariables
        }
      }
    }
    switch (payload.method) {
      case "bodyModal":
        helper.bodyModal(component, config);
        break;
      case "bodyModalLarge":
        helper.bodyModalLarge(component, config);
        break;
      case 'flow':
        helper.bodyModal(component, flowModalConfig);
        break;
      case 'flowLarge':
        helper.bodyModalLarge(component, flowModalConfig);
        break;
      default:
        // nothing
    }
  },
  handleNotifyClose : function(component, event, helper) {
    helper.dialogService(component).get("v.overlayPromise").close();
  },
})
