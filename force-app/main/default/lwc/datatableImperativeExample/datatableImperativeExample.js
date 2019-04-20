import { LightningElement, track } from 'lwc';
import { getTableRequest } from 'c/tableService';

const _defaultQueryString = 'SELECT Id, Name, UserName, Email FROM User';
const DELAY = 2000;

export default class DatatableExample extends LightningElement {
  @track data;
  @track columns;
  @track query = _defaultQueryString;

  async connectedCallback() {
    await this.fetchTableService(this.query);
  }

  async fetchTableService(queryString) {
    try {
      let tableResults = await getTableRequest({queryString: queryString});
      this.data = tableResults.tableData;
      this.columns = tableResults.tableColumns;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  handleKeyChange(event) {
    window.clearTimeout(this.delayTimeout);
    this.query = event.target.value;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.delayTimeout = setTimeout(() => {
      this.fetchTableService(this.query);
    }, DELAY);
  }
  
}