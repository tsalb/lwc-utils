import { LightningElement, track } from 'lwc';

const _defaultQueryString = 'SELECT Id, Name, UserName, Email FROM User';
const _defaultConfig = {
  queryString: _defaultQueryString,
}
const DELAY = 2000;

export default class DatatableExample extends LightningElement {
  @track data;
  @track columns;
  @track tableRequest;
  @track tableResponse;
  @track query;

  connectedCallback() {
    this.query = _defaultQueryString;
    this.tableRequest = JSON.stringify(_defaultConfig);
  }

  handleKeyChange(event) {
    window.clearTimeout(this.delayTimeout);
    this.query = event.target.value;
    this.delayTimeout = setTimeout(() => {
      let newRequest = {
        queryString: this.query
      }
      this.tableRequest = JSON.stringify(newRequest);
    }, DELAY);
  }

  handleSuccess(event) {
    console.log(JSON.parse(JSON.stringify(event.detail)));
    this.data = event.detail.tableData;
    this.columns = event.detail.tableColumns;
  }

  handleError(event) {
    console.log(JSON.parse(JSON.stringify(event.detail)));
    this.data = null;
    this.columns = null;
  }

}