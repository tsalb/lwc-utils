({
    doInit: function(component, event, helper) {
        helper.service(component).fetchAccountCombobox(
            $A.getCallback((error, data) => {
                // This returns whatever datatype is specified in the controller
                if (!$A.util.isEmpty(data)) {
                    component.set('v.topAccounts', data.items);
                } else {
                    helper.messageService(component).notifySingleError('No Accounts in org!');
                }
            })
        );
    },
    handleAccountOptionSelected: function(component, event, helper) {
        const payload = {
            key: 'accountselected',
            value: event.getParam('value')
        };
        helper.messageService(component).publish(payload);
    },
    handleClearTableOnly: function(component, event, helper) {
        helper.messageService(component).publish({ key: 'cleartable' });
    }
});
