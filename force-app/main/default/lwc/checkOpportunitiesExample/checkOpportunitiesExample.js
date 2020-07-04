import { LightningElement, api } from 'lwc';
import { convertToSingleLineString } from 'c/utils';

export default class CheckOpportunitiesExample extends LightningElement {
    // These should always be included when creating LWCs from the LWC Table Action
    @api uniqueBoundary;
    @api selectedRows;
    @api sourceRecordId;

    queryString;

    // private
    _isRendered;
    _messageService;
    _accountIdSet = new Set();

    connectedCallback() {
        if (this.selectedRows && this.selectedRows.length) {
            this.selectedRows.forEach(row => {
                this._accountIdSet.add(`'${row.AccountId}'`);
            });
        }
        if (this._accountIdSet.size > 0) {
            let accountIds = Array.from(this._accountIdSet.keys());
            this.queryString = convertToSingleLineString`
                SELECT Account.Name, Name, Amount, CloseDate, StageName
                FROM Opportunity
                WHERE AccountId IN (${accountIds.join(',')})
                ORDER BY Account.Name ASC
            `;
        }
    }

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._messageService = this.template.querySelector('c-message-service');
    }
}
