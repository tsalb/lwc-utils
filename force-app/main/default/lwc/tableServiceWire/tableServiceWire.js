import { LightningElement, api, wire } from 'lwc';
import wireTableCache from '@salesforce/apex/DataTableService.wireTableCache';
import * as tableUtils from 'c/tableServiceUtils';

export default class TableServiceWire extends LightningElement {
  @api request;

  @wire(wireTableCache, { tableRequest: '$request' })
  wiredCache({ error, data }) {
    if (data) {
      let flatData = tableUtils.flattenQueryResult(data.tableData);
      const originalRequest = JSON.parse(this.request);
      const response = {
        tableColumns: data.tableColumns,
        tableData: originalRequest.linkify
          ? tableUtils.applyLinks(flatData, originalRequest.linkify)
          : flatData
      }
      this.dispatchEvent(
        new CustomEvent('success', {detail: response})
      );
    } else if (error) {
      this.dispatchEvent(
        new CustomEvent('error', {detail: error})
      );
    }
  }

}