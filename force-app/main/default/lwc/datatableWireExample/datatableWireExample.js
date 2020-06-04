import { LightningElement } from 'lwc';

const _defaultQueryString = 'SELECT Id, Name, UserName, Email FROM User';
const _defaultConfig = {
    queryString: _defaultQueryString
};
const DELAY = 2000;

export default class DatatableExample extends LightningElement {
    data;
    columns;
    tableRequest;
    tableResponse;
    query;

    connectedCallback() {
        this.query = _defaultQueryString;
        this.tableRequest = JSON.stringify(_defaultConfig);
    }

    handleKeyChange(event) {
        window.clearTimeout(this.delayTimeout);
        this.query = event.target.value;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delayTimeout = setTimeout(() => {
            let newRequest = {
                queryString: this.query
            };
            this.tableRequest = JSON.stringify(newRequest);
        }, DELAY);
    }

    handleSuccess(event) {
        // eslint-disable-next-line no-console
        console.log(JSON.parse(JSON.stringify(event.detail)));
        this.data = event.detail.tableData;
        this.columns = event.detail.tableColumns;
    }

    handleError(event) {
        // eslint-disable-next-line no-console
        console.log(JSON.parse(JSON.stringify(event.detail)));
        this.data = null;
        this.columns = null;
    }
}
