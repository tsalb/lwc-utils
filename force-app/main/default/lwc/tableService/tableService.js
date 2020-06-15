import getTableCache from '@salesforce/apex/DataTableService.getTableCache';
import { updateRecord } from 'lightning/uiRecordApi';
import * as tableUtils from 'c/tableServiceUtils';

const getTableRequest = async requestConfig => {
    // Bubble any errors immediately
    const cache = await getTableCache({ tableRequest: requestConfig });
    return {
        objectApiName: cache.objectApiName,
        tableData: tableUtils.flattenQueryResult(cache.tableData, cache.objectApiName),
        tableColumns: cache.tableColumns
    };
};

const updateDraftValues = async (draftValues, recordIdToRowNumberMap) => {
    let response;
    // This is a formatting thing for the recordInput shape
    const recordInputs = draftValues.map(draftRow => {
        const fields = { ...draftRow };
        return { fields };
    });
    try {
        const saveResults = {
            success: [],
            // Use lightning-datatable error shape
            errors: {
                rows: {},
                table: {}
            }
        };
        await Promise.all(
            recordInputs.map(async recordInput => {
                try {
                    const successResult = await updateRecord(recordInput);
                    saveResults.success.push(successResult);
                } catch (error) {
                    const errorRow = tableUtils.createDatatableErrorRow(error, recordInput);
                    saveResults.errors.rows = { ...saveResults.errors.rows, ...errorRow };
                }
            })
        );
        saveResults.errors.table = tableUtils.createDataTableError(saveResults.errors.rows, recordIdToRowNumberMap);
        response = saveResults;
    } catch (error) {
        response = error;
    } finally {
        return response;
    }
};

export { getTableRequest, updateDraftValues };
