/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, james@sparkworks.io
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * - Neither the name of the copyright holder nor the names of its
 *   contributors may be used to endorse or promote products derived from
 *   this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import getTableCache from '@salesforce/apex/DataTableService.getTableCache';
import getQueryExceptionMessage from '@salesforce/apex/DataTableService.getQueryExceptionMessage';
import { updateRecord } from 'lightning/uiRecordApi';
import * as tableUtils from 'c/tableServiceUtils';
import { isRecordId } from 'c/baseUtils';

const checkQueryException = async queryString => {
  // Here, we actually want to use await to denote a thenable value
  // eslint-disable-next-line no-return-await
  return await getQueryExceptionMessage({ queryString: queryString });
};

const fetchTableCache = async requestConfig => {
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
  }
  return response;
};

export { isRecordId, checkQueryException, fetchTableCache, updateDraftValues };
