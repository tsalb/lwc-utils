({
  eventService : function(component) {
    return component.find("eventService");
  },
  overlayLib : function(component) {
    return component.find("overlayLib");
  },
  notificationsLib : function(component) {
    return component.find("notificationsLib");
  },
  createBody : function(params, ctrlCallback) {
    let componentType = params.body.split(":")[0];
    let componentParams = {};
    // if we had some bodyParams, let's set the target modal body with their data
    if (!$A.util.isEmpty(params.bodyParams)) {
      Object.keys(params.bodyParams)
        .forEach((v,i,a) => {
          componentParams[v] = params.bodyParams[v];
        });
    }
    switch(componentType) {
      case "c" : //custom component
        $A.createComponent(
          params.body,
          componentParams,
          (newModalBody, status, errorMessage) => {
            if (status === "SUCCESS") {
              ctrlCallback(null, newModalBody);
            } else {
              ctrlCallback(errorMessage);
            }
          }
        );
        break;
      default:
        $A.createComponent(
          "lightning:formattedText",
          { 
            "value": params.body,
            "class": "slds-align_absolute-center"
          },
          (formattedText, status, errorMessage) => {
            if (status === "SUCCESS") {
              ctrlCallback(null, formattedText);
            } else {
              ctrlCallback(errorMessage);
            }
          }
        );
    }
  },
  createButton : function(params, ctrlCallback) {
    $A.createComponent(
      "lightning:button",
      {
        "aura:id": params.auraId+"-main-action",
        "label": params.mainActionLabel,
        "onclick": params.mainActionReference,
        "variant": "brand"
      },
      (newButton, status, errorMessage) => {
        if (status === "SUCCESS") {
          ctrlCallback(null, newButton);
        } else {
          ctrlCallback(errorMessage);
        }
      }
    );
  },
  defineLargeModalAttribute : function(isLargeModalVal) {
    if ($A.util.isUndefinedOrNull(isLargeModalVal)) {
      return null;
    }
    if (!$A.util.getBooleanValue(isLargeModalVal)) {
      return null;
    }
    if ($A.util.getBooleanValue(isLargeModalVal)) {
      return "slds-modal_large";
    }
  },
  defineShowCLoseButtonAttribute : function(showCloseButtonBooleanVal) {
    if ($A.util.isUndefinedOrNull(showCloseButtonBooleanVal)) {
      return true;
    }
    if (!$A.util.getBooleanValue(showCloseButtonBooleanVal)) {
      return false;
    }
    if ($A.util.getBooleanValue(showCloseButtonBooleanVal)) {
      return true;
    }
  }
})