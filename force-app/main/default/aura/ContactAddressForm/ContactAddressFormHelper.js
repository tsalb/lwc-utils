({
    service: function(component) {
        return component.find('service');
    },
    messageService: function(component) {
        return component.find('messageService');
    },
    updateMultiAddress: function(component) {
        let _self = this;
        let contactList = component.get('v.contactList');
        let addressObject = component.find('mailing-address').get('v.value'); // contact mailing address is stored in key:value pairs.
        _self.service(component).updateMultiContactAddress(
            contactList,
            addressObject.MailingStreet,
            addressObject.MailingCity,
            addressObject.MailingState,
            addressObject.MailingPostalCode,
            addressObject.MailingCountry,
            $A.getCallback((error, data) => {
                if ($A.util.getBooleanValue(data)) {
                    const accountId = contactList[0].AccountId;
                    _self.messageService(component).notifySuccess('Updated Successfully');
                    _self.messageService(component).publish({ key: 'contactsupdated', value: accountId });
                    _self.messageService(component).notifyClose();
                } else {
                    if (!$A.util.isEmpty(error) && error[0].hasOwnProperty('message')) {
                        _self.messageService(component).notifySingleError('Error Updating Contacts', error);
                    }
                }
            })
        );
    }
});
