import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { fetchTableCache } from 'c/tableService';

export default class SoqlDatatableNavigationExample extends NavigationMixin(LightningElement) {
    // private
    _accountId;

    async connectedCallback() {
        const data = await fetchTableCache({ queryString: 'SELECT Id FROM Account ORDER BY Id ASC LIMIT 1' });
        this._accountId = data.tableData[0].Id;
    }

    handleNavigation() {
        this[NavigationMixin.Navigate]({
            type: 'standard__app',
            attributes: {
                appTarget: 'c__LWC_Utils_Console',
                pageRef: {
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: `${this._accountId}`,
                        actionName: 'view'
                    }
                }
            }
        });
    }
}
