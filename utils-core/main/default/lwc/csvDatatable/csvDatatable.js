/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2021, james@sparkworks.io
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

import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors, convertToSingleLineString } from 'c/baseUtils';

import Fuse from 'c/fuseBasic';
import papaParseLib from '@salesforce/resourceUrl/papa_parse_5_0_2';
import { loadScript } from 'lightning/platformResourceLoader';

const FUZZY_SFDC_ID_HEADERS = ['Salesforce Id', 'SFDC Id', 'Salesforce Record Id'];
const ID_FIELD_API_NAME = 'Id';

export default class CsvDatatable extends LightningElement {
  @api title;
  @api showRecordCount = false;
  @api actionConfigDevName;
  @api lookupConfigDevName;
  @api useRelativeMaxHeight = false;
  @api customRelativeMaxHeight;
  @api useLoadStyleHackForOverflow = false;

  get soqlDatatable() {
    return this.template.querySelector('c-soql-datatable');
  }

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  get isApplyValuesDisabled() {
    return !this._loadedRows || !this._loadedRows.length;
  }

  // For this LWC
  uniqueBoundary; // set by soqlDatatable
  showSpinner = false;
  isFileInputDisabled = true;

  // Passthrough
  editableFields;
  sortableFields;
  sortedBy = ID_FIELD_API_NAME;
  sortedDirection = 'asc';

  // private
  _csvHeadersFromFile = [];
  _csvHeadersToApiNamesMap = new Map();
  _csvLines = [];
  _recordIdColumnIndex;
  _recordIdSet = new Set();
  _singleRecordId;
  _objectApiName;
  _objectInfoFieldsMap = new Map();
  _loadedRows = [];

  // Goes after _validateFileForWires()
  @wire(getRecord, { recordId: '$_singleRecordId', layoutTypes: ['Compact'], modes: ['View'] })
  wiredRecord({ error, data }) {
    if (error) {
      const errMsg = reduceErrors(error)[0];
      if (errMsg.includes('resource does not exist')) {
        this._notifyError(
          'Error parsing first Salesforce Id',
          'Are you sure that this Salesforce Id exists in this org?'
        );
      } else {
        this._notifySingleError('Error in getRecord', error);
      }
    } else if (data) {
      this._objectApiName = data.apiName;
    }
  }

  // Goes after getRecord, via assignment of reactive variable
  @wire(getObjectInfo, { objectApiName: '$_objectApiName' })
  wiredObjectInfo({ error, data }) {
    if (error) {
      this._notifySingleError('Error in getObjectInfo', error);
    } else if (data) {
      this._objectInfoFieldsMap = new Map(Object.entries(data.fields));
      this._initializeDatatable();
    }
  }

  constructor() {
    super();
    this.template.addEventListener('rowsload', this.handleRowsLoaded);
    this.template.addEventListener('editablecellrendered', this.handleEditableCellRendered);
  }

  async connectedCallback() {
    try {
      await loadScript(this, papaParseLib);
      this._enableInputs();
    } catch (error) {
      this._notifySingleError('Error Loading Papa Parse', error);
    }
  }

  renderedCallback() {
    if (this._isRendered) {
      return;
    }
    this._isRendered = true;
    this.soqlDatatable.suppressSpinner();
    this.uniqueBoundary = this.soqlDatatable.uniqueBoundary;
  }

  // Event Handlers

  handleFileInputClicked(event) {
    // https://stackoverflow.com/a/12102992/899446
    event.target.value = null;
  }

  handleFileInputChanged(event) {
    if (!event.target.files || !event.target.files.length) {
      return;
    }
    this.soqlDatatable.resetTable();
    this._resetFileInput();
    this._disableInputs();
    this._parseFile(event.target.files[0]);
  }

  handleApplyValuesClick() {
    this._applyFileValues();
  }

  // Keeps lexical scope correct
  handleRowsLoaded = event => {
    this._enableInputs();
    this._loadedRows = event.detail.tableData;
  };

  // Keeps lexical scope correct
  handleEditableCellRendered = () => {
    window.clearTimeout(this._delayEditableCellRendered);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._delayEditableCellRendered = setTimeout(() => {
      this._applyFileValues();
    }, 500);
  };

  // Private funcs

  _enableInputs() {
    this.isFileInputDisabled = false;
    this.showSpinner = false;
  }

  _disableInputs() {
    this.isFileInputDisabled = true;
    this.showSpinner = true;
  }

  _resetFileInput() {
    this.showSpinner = false;
    this.editableFields = undefined;
    this.sortableFields = undefined;
    // csv parser related
    this._csvHeadersFromFile = [];
    this._csvHeadersToApiNamesMap = new Map();
    this._csvLines = [];
    this._recordIdColumnIndex = undefined;
    this._recordIdSet = new Set();
    this._singleRecordId = undefined;
    this._objectApiName = undefined;
    this._objectInfoFieldsMap = new Map();
    this._loadedRows = [];
  }

  _parseFile(file) {
    // eslint-disable-next-line no-undef
    Papa.parse(file, {
      // https://www.papaparse.com/docs#config
      skipEmptyLines: 'greedy',
      header: true,
      complete: results => {
        if (!results.data || !results.data.length) {
          this._notifyError('File Empty', 'Please check you have selected the correct file.');
          return;
        }
        if (results.data && results.data.length) {
          // Store these for other functions to deal with
          this._csvHeadersFromFile = Object.keys(results.data[0]);
          this._csvLines = results.data;
          this._validateFileForWires();
        }
      }
    });
  }

  _validateFileForWires() {
    // Validate Salesforce Id exists since MVP only allows updates right now
    const recordIdIndexToValueMap = new Map();
    const idColumnIndex = this._csvHeadersFromFile.indexOf(ID_FIELD_API_NAME);
    let foundIdColumn = idColumnIndex > 0;

    if (foundIdColumn) {
      recordIdIndexToValueMap.set(idColumnIndex, ID_FIELD_API_NAME);
    } else {
      const options = {
        includeScore: true
      };
      const csvHeaders = new Fuse(this._csvHeadersFromFile, options);

      for (let searchTerm of FUZZY_SFDC_ID_HEADERS) {
        const tempResult = csvHeaders.search(searchTerm);
        if (tempResult && tempResult.length) {
          const bestMatch = tempResult[0];
          const { item, refIndex } = bestMatch;
          if (!recordIdIndexToValueMap.has(refIndex)) {
            recordIdIndexToValueMap.set(refIndex, item);
          }
        }
      }
    }
    if (recordIdIndexToValueMap.size !== 1) {
      this._notifyError(
        'Salesforce Record Id column not found',
        `Make sure the file has a column called 'Id' or 'Salesforce Id'.`
      );
      return;
    }

    // Disallow dupe recordIds in same file
    // TODO - enhancement here to make the message go across all rows, possibly mark which rows are dupes
    this._recordIdColumnIndex = recordIdIndexToValueMap.keys().next().value;
    const recordIdColumnLabel = recordIdIndexToValueMap.values().next().value;
    for (let row of this._csvLines) {
      const rowRecordId = row[recordIdColumnLabel];
      if (this._recordIdSet.has(rowRecordId)) {
        this._notifyError(
          'Duplicate Record Id found',
          `Salesforce Id '${rowRecordId}' is found in more than one row. Please de-dupe the errant row(s).`
        );
        return;
      }
      this._recordIdSet.add(rowRecordId);
    }

    // Disallow multiple SObject types in same file
    const objectPrefixes = new Set(Array.from(this._recordIdSet).map(recordId => recordId.substring(0, 3)));
    if (objectPrefixes.size !== 1) {
      this._notifyError(
        'Multiple Salesforce Objects found',
        `Make sure all Ids in this file start with '${objectPrefixes.values().next().value}'`
      );
      return;
    }

    // Use LDS to validate schema and start fuzzy matching on columns.
    // However, since LDS is wire only - the code flow is now in wired function callbacks,
    // So then, go back to the top of this LWC
    this._singleRecordId = this._recordIdSet.values().next().value;
  }

  async _initializeDatatable() {
    try {
      // _assembleQueryString also creates the dataset to derive editable fields
      const queryString = this._assembleQueryString(Array.from(this._objectInfoFieldsMap.values()));
      const csvHeadersAsFieldApiNames = Array.from(this._csvHeadersToApiNamesMap.values());
      this.editableFields = csvHeadersAsFieldApiNames
        .filter(fieldApiName => this._objectInfoFieldsMap.get(fieldApiName).updateable)
        .join(',');
      this.sortableFields = csvHeadersAsFieldApiNames.join(',');
      // Column construction as editable depends on those props being set first
      await this.soqlDatatable.refreshTableWithQueryString(queryString);
    } catch (error) {
      this._notifySingleError('Error Initializing: Please contact your System Admin', error);
    }
  }

  _assembleQueryString(objectInfoFields) {
    const fieldsByLabelMap = new Map(objectInfoFields.map(field => [field.label, field.apiName]));
    const fieldsByApiNameMap = new Map(objectInfoFields.map(field => [field.apiName, field.label]));

    // Use labels as baseline to search against, it's rare that users will provide the field API Name
    const options = {
      includeScore: true
    };
    const fieldLabels = new Fuse(
      objectInfoFields.map(field => field.label),
      options
    );
    for (const [index, header] of this._csvHeadersFromFile.entries()) {
      if (index === this._recordIdColumnIndex) {
        this._csvHeadersToApiNamesMap.set(header, ID_FIELD_API_NAME);
        continue;
      }
      // If user was kind enough to give api names...
      if (fieldsByApiNameMap.has(header)) {
        this._csvHeadersToApiNamesMap.set(header, header);
        continue;
      }
      // Otherwise a hail mary...
      if (fieldsByLabelMap.has(header)) {
        this._csvHeadersToApiNamesMap.set(header, fieldsByLabelMap.get(header));
        continue;
      }
      // Finally, fuzzy search is likeliest...
      console.info(`Fuzzy Search TERM: ${header}`);
      const searchResults = fieldLabels.search(header);
      console.info(`Fuzzy Search RESULTS:`);
      console.info(searchResults);
      const bestResult = searchResults[0];
      const fieldApiName = fieldsByLabelMap.get(bestResult.item);
      console.info(`Fuzzy Search BEST MATCH: ${fieldApiName}`);

      if (!Array.from(this._csvHeadersToApiNamesMap.values()).includes(fieldApiName)) {
        this._csvHeadersToApiNamesMap.set(header, fieldApiName);
      }
    }
    console.info(`CSV Headers to API Names:`);
    console.info(this._csvHeadersToApiNamesMap);
    const formattedRecordIds = Array.from(this._recordIdSet).map(recordId => `'${recordId}'`);
    return convertToSingleLineString`
      SELECT ${Array.from(this._csvHeadersToApiNamesMap.values()).join(',')}
      FROM ${this._objectApiName}
      WHERE Id IN (${formattedRecordIds.join(',')})
    `;
  }

  _applyFileValues() {
    // First prep the loaded rows by their key, which for now is just Id
    const loadedRowByKeyMap = new Map(this._loadedRows.map(row => [row[ID_FIELD_API_NAME], row]));

    // Then diff against the values from the csv
    const rowIdentifiers = {};
    for (const row of this._csvLines) {
      const rowRecordId = row[this._csvHeadersFromFile[this._recordIdColumnIndex]];
      const loadedRow = loadedRowByKeyMap.get(rowRecordId);

      for (const header of Object.keys(row)) {
        const fieldValue = row[header];
        const loadedRowFieldValue = loadedRow[this._csvHeadersToApiNamesMap.get(header)];

        // For now, only handle updating non-null, truthy values
        if (fieldValue && fieldValue !== rowRecordId && fieldValue !== loadedRowFieldValue) {
          const identifier = `${rowRecordId}_${this._objectApiName}_${this._csvHeadersToApiNamesMap.get(header)}`;
          rowIdentifiers[identifier] = fieldValue;
        }
      }
    }
    if (Object.keys(rowIdentifiers).length) {
      // Publish 1 event with many payloads and let each cell parse it out
      // Doing the reverse, many events with 1 payload causes huge perf hits in the browser
      this.messageService.publish({
        key: 'setdraftvalue',
        value: { rowIdentifierToValues: rowIdentifiers }
      });
    }
  }

  // Private toast funcs

  _notifySingleError(title, error = '') {
    this._enableInputs();
    if (this.messageService) {
      this.messageService.notifySingleError(title, error);
    } else {
      this._notifyError(title, reduceErrors(error)[0]);
    }
  }

  _notifyError(title, error = '') {
    this._enableInputs();
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: error,
        variant: 'error',
        mode: 'sticky'
      })
    );
  }
}
