({
  handleShowToast : function(component, event, helper) {
    // pass the config object through
    helper.notificationsLib(component).showToast(event.getParam("arguments")["configObj"]);
  },
  createOverlayModal : function(component, event, helper) {
    let params = event.getParam("arguments");
    // Creating the body first - this can be a custom component or text wrapped in formattedText
    helper.createBody(params,
      $A.getCallback((error, modalBody) => {
        if (error) {
          alert(error);
          return;
        }
        if (modalBody.isValid() && !$A.util.isEmpty(modalBody)) {
          // if mainActionReference has a c. prefix, it means we want an action on the body just created
          let str = String(params.mainActionReference);
          if (str.startsWith("c.")) {
            params.mainActionReference = modalBody.getReference(params.mainActionReference);
          }
          helper.createButton(params,
            $A.getCallback((error, mainAction) => {
              if (error) {
                alert(error);
                return;
              }
              if (mainAction.isValid() && !$A.util.isEmpty(mainAction)) {
                // Final assembly
                $A.createComponent(
                  "c:modalFooter",
                  {
                    "actions": mainAction
                  },
                  (completedFooter, status, errorMessage) => {
                    if (status === "SUCCESS") {
                      helper.overlayLib(component).showCustomModal({
                        header: params.headerLabel,
                        body: modalBody, 
                        footer: completedFooter,
                        showCloseButton: helper.defineShowCLoseButtonAttribute(params.showCloseButton),
                        cssClass: helper.defineLargeModalAttribute(params.isLargeModal)
                      })
                      .then($A.getCallback((overlay) => {
                        if (!$A.util.isEmpty(params.bodyParams)) {
                          Object.keys(params.bodyParams)
                            .forEach((v,i,a) => {
                              let valueProviderAdded = "v."+v;
                              modalBody.set(valueProviderAdded, params.bodyParams[v]);
                            });
                        }
                        helper.eventService(component).fireAppEvent("MODAL_READY");
                        if (!$A.util.isEmpty(params.callback)) {
                          params.callback(overlay);
                        }
                      }));
                    }
                  }
                );
              } else {
                console.log("mainAction error is: "+error[0].message);
              }
            })
          ); // end helper.createButton
        } else {
          console.log("modalBody error is: "+error[0].message);
        }
      })
    ); // end helper.createBody
  },
  createOverlayModalWithoutFooter : function(component, event, helper) {
    let params = event.getParam("arguments");
    helper.createBody(params,
      $A.getCallback((error, modalBody) => {
        if (error) {
          alert(error);
          return;
        }
        if (modalBody.isValid() && !$A.util.isEmpty(modalBody)) {
            helper.overlayLib(component).showCustomModal({
              header: params.headerLabel,
              body: modalBody, 
              showCloseButton: true,
              cssClass: helper.defineLargeModalAttribute(params.isLargeModal)
            })
            .then($A.getCallback((overlay) => {
              if (!$A.util.isEmpty(params.bodyParams)) {
                Object.keys(params.bodyParams).forEach((v,i,a) => {
                  let valueProviderAdded = "v."+v;
                  modalBody.set(valueProviderAdded, params.bodyParams[v]);
                });
              }
              helper.eventService(component).fireAppEvent("MODAL_READY");
              if (!$A.util.isEmpty(params.callback)) {
                params.callback(overlay);
              }
            }));
        } else {
          console.log("modalBody error is: "+error[0].message);
        }
      })
    ); // end helper.createBody
  },
})