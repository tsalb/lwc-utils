({
    handleRowAction: function (component, event, helper) {
        let action = event.getParam('action');
        let row = event.getParam('row');
        switch (action.name) {
            case 'clear_address':
                helper.clearMailingAddressWithLightningDataService(component, row);
                break;
            case 'view_cases':
                helper.openViewCasesModal(component, row);
                break;
        }
    },
    handleOpenUpdateAddressModal: function (component, event, helper) {
        let selectedArr = component.find('searchTable').getSelectedRows();
        if ($A.util.isEmpty(selectedArr)) {
            helper.messageService(component).notifyInfo('Please choose at least one Contact.');
        } else {
            const dialogServicePayload = {
                method: 'modal',
                config: {
                    auraId: 'update-address-modal',
                    headerLabel: 'Update Address: ' + selectedArr.length + ' Row(s)',
                    component: 'c:ContactAddressForm',
                    componentParams: {
                        contactList: selectedArr
                    },
                    mainActionReference: 'c.handleUpdateMultiAddress',
                    mainActionLabel: 'Update'
                }
            };
            helper.messageService(component).dialogService(dialogServicePayload);
        }
    },
    handleAccountSelected: function (component, event, helper) {
        const value = event.getParam('value');
        helper.loadContactTable(component, value);
    },
    handleClearTable: function (component, event, helper) {
        component.set('v.tableData', null);
    }
});
