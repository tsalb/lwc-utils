import { LightningElement, track } from 'lwc';

const _defaultConfig = {
  queryString: 'SELECT Id, Name, UserName, Email FROM User'
}

export default class DatatableExample extends LightningElement {
  @track data;
  @track columns;
  @track tableRequest;
  @track tableResponse;

  connectedCallback() {
    this.tableRequest = _defaultConfig;
  }
  
  handleSuccess(event) {
    this.data = event.detail.tableData;
    this.columns = event.detail.tableColumns;
  }
}