({
  service : function(component) {
    return component.find("service");
  },
  messageService : function(component) {
    return component.find("messageService");
  },
  eventService : function(component) {
    return component.find("eventService");
  },
  updateMultiAddress : function(component) {
    let _self = this;
    let contactList = component.get("v.contactList");
    let addressObject = component.find("mailing-address").get("v.value"); // contact mailing address is stored in key:value pairs.
    _self.service(component).updateMultiContactAddress(
      contactList,
      addressObject.MailingStreet,
      addressObject.MailingCity,
      addressObject.MailingState,
      addressObject.MailingPostalCode,
      addressObject.MailingCountry,
      $A.getCallback((error, data) => {
        if ($A.util.getBooleanValue(data)) {
          _self.messageService(component).showToast({
            message: "Updated Successfully",
            variant: "success"
          });
          _self.eventService(component).fireAppEvent("CONTACTS_UPDATED", contactList[0].AccountId);
          _self.messageService(component).find("overlayLib").notifyClose(); // must be last, as this destroys this component
        } else {
          if (!$A.util.isEmpty(error) && error[0].hasOwnProperty("message")) {
            _self.messageService(component).showToast({
              message: error[0].message,
              variant: "error"
            });
          }
        }
      })
    );
  }
})