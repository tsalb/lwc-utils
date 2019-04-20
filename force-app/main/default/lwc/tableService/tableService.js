import getTableCache from '@salesforce/apex/DataTableService.getTableCache';
import * as tableUtils from 'c/tableServiceUtils';

const getTableRequest = (requestConfig) => {
  return new Promise (resolve => {
    getTableCache({tableRequest: requestConfig})
      .then(data => {
        const flatData = tableUtils.flattenQueryResult(data.tableData);
        const flatDataWithLinks = tableUtils.applyLinks(flatData);
        const response = {
          tableData: flatDataWithLinks,
          tableColumns: data.tableColumns
        }
        resolve(response);
      })
      .catch(error => {
        resolve(error);
      });
  })
}

export {
  getTableRequest
}