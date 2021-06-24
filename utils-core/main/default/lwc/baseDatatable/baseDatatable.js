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

import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import * as tableService from 'c/tableService'; // Data, columns, mass update

import getActionConfig from '@salesforce/apex/DataTableService.getActionConfig';
import getLookupConfig from '@salesforce/apex/DataTableService.getLookupConfig';

// Toast and Errors
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors, createFlattenedSetFromDelimitedString } from 'c/baseUtils';

// Global Search
import Fuse from 'c/fuseBasic';

const COLUMN_LABEL_DELIMITER = '=>';
const MAX_ROW_SELECTION = 200;
const OBJECTS_WITH_COMPOUND_NAMES = ['Contact'];

// Fuse Config
const INCLUDE_SCORE = true;
const IGNORE_LOCATION = true;
const SEARCH_THRESHOLD = 0.2; // Lower is less fuzzy

// Datatable_Action_Config__mdt
const LEGACY_TABLE_ACTION_ONE_STRING = 'Primary';
const LEGACY_TABLE_ACTION_TWO_STRING = 'Secondary';
const TABLE_ACTION_STRING = 'Table Action';
const TABLE_OVERFLOW_ACTION_STRING = 'Table Overflow Action';
const ROW_ACTION_STRING = 'Row Action';

// Datatable_Lookup_Config__mdt
const DATATABLE_LOOKUP_CONFIG_DEFAULT = 'Default_Lookup_Config';

// API props are controlled by soqlDatatable and collectionDatatable
/* eslint @lwc/lwc/no-api-reassignments: 0 */

export default class BaseDatatable extends LightningElement {
  @api recordId;
  @api
  get keyField() {
    return this._keyField || 'Id';
  }
  set keyField(value = 'Id') {
    this._keyField = value;
  }
  @api title;
  @api iconName;
  @api showRecordCount = false;

  // MessageService boundary, for when multiple instances are on same page
  @api uniqueBoundary;

  // Misc
  @api columnWidthsMode = 'auto'; // override salesforce default
  @api showSearch = false;
  @api showRefreshButton = false;
  @api showSpinner = false;
  @api customHeight;
  @api customRelativeMaxHeight;
  @api useRelativeMaxHeight = false;

  // Sorting
  @api
  get sortedBy() {
    return this._sortedBy;
  }
  set sortedBy(value) {
    if (value) {
      this._sortedBy = value.replace('.', '_');
    }
  }
  @api sortedDirection = 'asc';
  @api
  get sortableFields() {
    return this._sortableFields;
  }
  set sortableFields(value = '') {
    this._sortableFields = createFlattenedSetFromDelimitedString(value, ',');
  }

  @api
  get columnLabels() {
    return this._columnLabelsMap;
  }
  set columnLabels(value = '') {
    if (value !== '') {
      const columnMappingArr = value.trim().split(',');
      // When this has keys, it will be used to reassign labels during column construction
      this._columnLabelsMap = new Map(
        columnMappingArr
          .filter(mapping => mapping.includes(COLUMN_LABEL_DELIMITER))
          .map(mapping => {
            // Gets rid of any excess spaces around the delimiter
            // Map can be initialized from arrays
            return mapping.split(COLUMN_LABEL_DELIMITER).map(part => part.trim());
          })
      );
    } else {
      this._columnLabelsMap = new Map();
    }
  }

  // Row selections
  @api selectedRows = [];
  @api
  get checkboxType() {
    return this._checkboxType;
  }
  set checkboxType(value = 'None') {
    this._checkboxType = value;
    switch (value) {
      case 'Multi':
        this.maxRowSelection = MAX_ROW_SELECTION;
        this.isHideCheckbox = false;
        this.isShowRowNumber = true;
        break;
      case 'Single':
        this.maxRowSelection = 1;
        this.isHideCheckbox = false;
        this.isShowRowNumber = true;
        break;
      default:
        this.isHideCheckbox = true;
        this.isShowRowNumber = false;
        break;
    }
  }

  // Inline editing
  @api isSaveToServer;
  @api
  get editableFields() {
    return this._editableFields;
  }
  set editableFields(value = '') {
    this._editableFields = createFlattenedSetFromDelimitedString(value, ',');
  }

  // Datatable_Config__mdt configs
  @api actionConfigDevName;
  @api lookupConfigDevName;

  // LWC loadStyle hack - to help with picklist and lookup menu overflows
  // https://salesforce.stackexchange.com/a/270624
  @api useLoadStyleHackForOverflow;

  // Template and getters
  isHideCheckbox = true;
  isShowRowNumber = false;
  maxRowSelection = MAX_ROW_SELECTION;

  tableData = [];
  tableColumns = [];
  draftValues = []; // this is to feed into the datatable to clear stuff out
  saveErrors = {};

  showComposedActions = true;
  primaryConfig = {};
  secondaryConfig = {};
  overflowActionConfigs = [];
  rowActionConfigs = [];

  get recordCountDisplay() {
    return this.tableData && this.tableData.length ? `(${this.tableData.length})` : '';
  }

  get composedActionSlot() {
    return this.template.querySelector('slot[name=composedActions]');
  }

  get showTableActions() {
    return this.hasPrimaryAction || this.hasSecondaryAction;
  }

  get hasPrimaryAction() {
    return this.primaryConfig && this.primaryConfig.Button_Label__c;
  }

  get primaryActionType() {
    return this.primaryConfig.Flow_API_Name__c ? 'flow' : 'lwc';
  }

  get primaryActionName() {
    // prettier-ignore
    return this.primaryConfig.Flow_API_Name__c
      ? this.primaryConfig.Flow_API_Name__c
      : this.primaryConfig.LWC_Name__c;
  }

  get hasSecondaryAction() {
    return this.secondaryConfig && this.secondaryConfig.Button_Label__c;
  }

  get secondaryActionType() {
    return this.secondaryConfig.Flow_API_Name__c ? 'flow' : 'lwc';
  }

  get secondaryActionName() {
    // prettier-ignore
    return this.secondaryConfig.Flow_API_Name__c
      ? this.secondaryConfig.Flow_API_Name__c
      : this.secondaryConfig.LWC_Name__c;
  }

  get hasOverflowTableActions() {
    return this.overflowActionConfigs && this.overflowActionConfigs.length;
  }

  get showRowMenuActions() {
    return this.rowActionConfigs.length;
  }

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  get searchInput() {
    return this.template.querySelector('.search-input');
  }

  // Public APIs

  @api
  initializeTable(objectApiName, columns, data) {
    this.showSpinner = true;
    this._objectApiName = objectApiName;
    this._setTableColumns(columns);
    this._setTableData(data);
    this.clearDraftValuesOnSuccess();
    if (this.showSearch) {
      this._prepGlobalSearch();
    }
    this.showSpinner = false;
  }

  @api
  refreshTable() {
    this.showSpinner = true;
    this.dispatchEvent(new CustomEvent('refresh'));
  }

  @api
  clearDraftValuesOnSuccess() {
    if (this._draftSuccessIds.size) {
      this._clearDraftValues([...this._draftSuccessIds.keys()]);
    }
  }

  @api
  resetTable() {
    this.selectedRows = [];
    this.tableData = [];
    this.tableColumns = [];
    this.draftValues = [];
    this.saveErrors = {};
    this.sortableFields = new Set();
    this.editableFields = new Set();
    // private
    this._objectApiName = undefined;
    this._objectInfo = undefined;
    this._draftValuesMap = new Map();
    this._draftSuccessIds = new Set();
    this._fuseData = undefined;
    this._originalTableData = [];
  }

  // private
  _isRendered;
  _objectApiName;
  _objectInfo;

  // private - inline edit
  _draftValuesMap = new Map();
  _draftSuccessIds = new Set();

  // private - table and lwc actions
  _actionConfigs = [];

  // private - Datatable_Lookup_Config__mdt
  _lookupConfigDevName;
  _lookupConfigData;

  // private - global search
  _fuseData;
  _originalTableData = [];

  // For future enhancements
  @wire(getObjectInfo, { objectApiName: '$_objectApiName' })
  objectInfoWire({ error, data }) {
    if (error) {
      this._notifySingleError('getObjectInfo error', error);
    } else if (data) {
      this._objectInfo = data;
    }
  }

  // For any actions configured for this table
  @wire(getActionConfig, { configName: '$actionConfigDevName' })
  actionConfigWire({ error, data }) {
    if (error) {
      this._notifySingleError('getActionConfig error', error);
    } else if (data) {
      this._actionConfigs = data;

      // Table Actions
      this.primaryConfig = this._actionConfigs.find(cfg => cfg.Type__c === TABLE_ACTION_STRING && cfg.Order__c === 1);
      this.secondaryConfig = this._actionConfigs.find(cfg => cfg.Type__c === TABLE_ACTION_STRING && cfg.Order__c === 2);

      // Table Actions - Legacy Format
      if (!this.primaryConfig) {
        this.primaryConfig = this._actionConfigs.find(cfg => cfg.Type__c.includes(LEGACY_TABLE_ACTION_ONE_STRING));
      }
      if (!this.secondaryConfig) {
        this.secondaryConfig = this._actionConfigs.find(cfg => cfg.Type__c.includes(LEGACY_TABLE_ACTION_TWO_STRING));
      }

      // Overflow Actions
      this.overflowActionConfigs = this._actionConfigs.filter(cfg => cfg.Type__c === TABLE_OVERFLOW_ACTION_STRING);

      // Row Actions
      this.rowActionConfigs = this._actionConfigs.filter(cfg => cfg.Type__c === ROW_ACTION_STRING);
    }
  }

  // For lookup edits, if configured for this table
  @wire(getLookupConfig, { configName: '$_lookupConfigDevName' })
  lookupConfigWire({ error, data }) {
    if (error) {
      this._notifySingleError('getLookupEditConfig error', error);
    } else if (data) {
      this._lookupConfigData = data;
      this._initializeLookupConfigData();
    }
  }

  constructor() {
    super();
    this.template.addEventListener('editablecellrendered', this.handleEditableCellRendered);
  }

  renderedCallback() {
    if (this._isRendered) {
      return;
    }
    this._isRendered = true;
    // Assists with in-line edit on tables with only a few rows
    if (this.useLoadStyleHackForOverflow) {
      const style = document.createElement('style');
      style.innerText = `
        .${this.extensionBoundaryClass} .slds-scrollable_x {
          overflow: visible !important;
        }
        .${this.extensionBoundaryClass} .slds-scrollable_y {
          overflow: visible !important;
        }
      `;
      this.template.querySelector(`.${this.extensionBoundaryClass}`).appendChild(style);
    }
  }

  // Dynamic Event Handlers

  // Keeps lexical scope correct
  handleEditableCellRendered = () => {
    // This event is emitted from every editable cell, which is why needs to be debounced
    window.clearTimeout(this._delayEditableCellRendered);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._delayEditableCellRendered = setTimeout(() => {
      // Editable cells need these even if the pencil icon is not enabled
      this._initializeLookupConfigData();
      this._initializeRecordTypeIdData();
    }, 500);
  };

  // Event Handlers

  handleComposedActionSlotChange(event) {
    this.showComposedActions =
      (this.composedActionSlot && this.composedActionSlot.assignedElements().length !== 0) ||
      event.target.assignedElements().length !== 0;
  }

  handleSearch(event) {
    if (!this.tableData || !this._fuseData) {
      return;
    }
    const searchText = event.detail.value;

    // Debounce the entire search key enter process, guards against rapid filtering and clearing of input
    window.clearTimeout(this._delaySearch);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._delaySearch = setTimeout(() => {
      if (!searchText) {
        this.tableData = this._originalTableData;
        return;
      }
      if (searchText.length >= 2) {
        const results = this._fuseData.search(searchText);
        // Not sure why fuse returns hits higher than score, filter it out again here
        const indexHits = results.filter(obj => obj.score <= SEARCH_THRESHOLD).map(obj => obj.refIndex);
        // Even if there are no hits, we want that UX feedback to the user
        this.tableData = this._originalTableData.filter((row, index) => indexHits.includes(index));
      }
    }, 350);
  }

  handleRefresh() {
    this.refreshTable();
  }

  handleTableAction(event) {
    const type = event.target.dataset.type;
    if (type.toLowerCase().includes('flow')) {
      this.handleFlowAction(event);
    }
    if (type.toLowerCase().includes('lwc')) {
      this.handleLwcAction(event);
    }
  }

  handleTableOverflowAction(event) {
    const config = this.overflowActionConfigs.find(cfg => cfg.DeveloperName === event.target.dataset.key);
    const isFlow = config.Flow_API_Name__c && !config.LWC_Name__c;
    // Since name can't be assigned dynamically via getter in a list, do this instead
    event.target.name = isFlow ? config.Flow_API_Name__c : config.LWC_Name__c;
    if (isFlow) {
      this.handleFlowAction(event);
    } else {
      this.handleLwcAction(event);
    }
  }

  handleFlowAction(event) {
    const flowInputVars = [];
    let flowMethod;
    let flowApiName;
    let selectedRows = [];

    // From Table Action
    if (event.target) {
      flowMethod = event.target.dataset.dialogSize === 'Large' ? 'flowLarge' : 'flow';
      flowApiName = event.target.name;
      selectedRows = this.selectedRows;
    }
    // Row Menu Action
    if (event.rowMenuAction) {
      flowMethod = event.rowMenuAction.dialogSize === 'Large' ? 'flowLarge' : 'flow';
      flowApiName = event.rowMenuAction.flowApiName;
      selectedRows.push(event.rowMenuAction.row);
    }

    if (!flowApiName || !flowMethod) {
      return;
    }

    // Input vars need to be calculated only when when necessary
    if (selectedRows.length) {
      flowInputVars.push({
        name: 'SelectedRows',
        type: 'SObject',
        value: selectedRows
      });
      flowInputVars.push({
        name: 'FirstSelectedRow',
        type: 'SObject',
        value: selectedRows[0]
      });
    }
    if (this.uniqueBoundary) {
      flowInputVars.push({
        name: 'UniqueBoundary',
        type: 'String',
        value: this.uniqueBoundary
      });
    }
    if (this.recordId) {
      flowInputVars.push({
        name: 'SourceRecordId',
        type: 'String',
        value: this.recordId
      });
    }
    const flowPayload = {
      method: flowMethod,
      config: {
        componentParams: {
          flowApiName: flowApiName,
          inputVariables: flowInputVars
        }
      }
    };
    this.messageService.dialogService(flowPayload);
  }

  handleLwcAction(event) {
    let dialogMethod;
    let headerLabel;
    let componentName;
    let selectedRows = [];

    // From Table Action
    if (event.target) {
      dialogMethod = event.target.dataset.dialogSize === 'Large' ? 'bodyModalLarge' : 'bodyModal';
      headerLabel = event.target.label;
      componentName = event.target.name;
      selectedRows = this.selectedRows;
    }
    // Row Menu Action
    if (event.rowMenuAction) {
      dialogMethod = event.rowMenuAction.dialogSize === 'Large' ? 'bodyModalLarge' : 'bodyModal';
      headerLabel = event.rowMenuAction.dialogHeader;
      componentName = event.rowMenuAction.lwcName;
      selectedRows.push(event.rowMenuAction.row);
    }

    const dialogPayload = {
      method: dialogMethod,
      config: {
        auraId: `${headerLabel.toLowerCase()}_${componentName.toLowerCase()}`,
        headerLabel: headerLabel,
        component: componentName,
        componentParams: {
          uniqueBoundary: this.uniqueBoundary,
          selectedRows: selectedRows,
          sourceRecordId: this.recordId
        }
      }
    };
    this.messageService.dialogService(dialogPayload);
  }

  handleRowSelection(event) {
    this.selectedRows = event.detail.selectedRows;
    this._notifyPublicEvent('rowselection');
    // Supports mass inline editing
    this.messageService.publish({
      key: 'rowselected',
      value: { selectedRows: this.selectedRows }
    });
  }

  handleRowAction(event) {
    const action = event.detail.action;
    const row = event.detail.row;

    // Default Actions
    switch (action.name) {
      case 'delete_row': {
        const dialogPayload = {
          method: 'bodyModal',
          config: {
            auraId: 'base-datatable-delete-row',
            headerLabel: 'Delete ' + this._objectInfo.label,
            component: 'c:baseDatatableDeleteRowForm',
            componentParams: {
              row: row,
              uniqueBoundary: this.uniqueBoundary
            }
          }
        };
        this.messageService.dialogService(dialogPayload);
        break;
      }
      case 'edit_row': {
        const dialogPayload = {
          method: 'bodyModalLarge',
          config: {
            auraId: 'base-datatable-edit-row',
            headerLabel: `Edit ${this._objectInfo.label} Record`,
            component: 'c:baseDatatableEditRowForm',
            componentParams: {
              row: row,
              objectApiName: this._objectInfo.apiName,
              uniqueBoundary: this.uniqueBoundary
            }
          }
        };
        this.messageService.dialogService(dialogPayload);
        break;
      }
      case 'custom_flow': {
        const payload = {
          rowMenuAction: {
            flowApiName: action.flowApiName,
            dialogSize: action.dialogSize,
            row: row
          }
        };
        this.handleFlowAction(payload);
        break;
      }
      case 'custom_lwc': {
        const payload = {
          rowMenuAction: {
            lwcName: action.lwcName,
            dialogSize: action.dialogSize,
            dialogHeader: action.label,
            row: row
          }
        };
        this.handleLwcAction(payload);
        break;
      }
      default: {
        // nothing
      }
    }
  }

  handleColumnSorting(event) {
    this._updateColumnSorting(event.detail.fieldName, event.detail.sortDirection);
  }

  handleCellChange(event) {
    event.stopPropagation();

    // This function is needed for handling custom data types to unify draftValue changes
    event.detail.draftValues.forEach(draft => {
      if (!this._draftValuesMap.has(draft[this.keyField])) {
        this._draftValuesMap.set(draft[this.keyField], draft);
      }
      const changedData = this._draftValuesMap.get(draft[this.keyField]);
      this._draftValuesMap.set(draft[this.keyField], { ...changedData, ...draft });
    });

    if (this._draftValuesMap.size > 0) {
      this.draftValues = [...this._draftValuesMap.values()];
    }
  }

  handleCancel() {
    // do not prevent default, but tell every single draft row to clear itself
    this._clearDraftValues([...this._draftValuesMap.keys()]);
    // also tell any custom data type to clear restore itself
    this.messageService.publish({ key: 'canceldraft' });
  }

  // Avoid using the event because the payload doesn't have name compound fields
  async handleSave() {
    if (!this.isSaveToServer) {
      // For collectionDatatable we just write user values to tableData, regardless of validation
      const rowKeyToDraftValuesMap = new Map(this.draftValues.map(draft => [draft[this.keyField], draft]));
      // Sets draft values directly onto tableData
      this.tableData = this.tableData.map(row => {
        const rowDraftValues = rowKeyToDraftValuesMap.get(row[this.keyField]);
        return { ...row, ...rowDraftValues };
      });
      // Clears out custom data types
      this._clearDraftValues([...rowKeyToDraftValuesMap.keys()]);
      // Output to the flow
      const payload = {
        detail: {
          editedRows: this.tableData.filter(row => rowKeyToDraftValuesMap.has(row[this.keyField])),
          allRows: this.tableData
        }
      };
      this.dispatchEvent(new CustomEvent('save', payload));
      // Finally, Remove the bottom bar
      this.draftValues = [];
      return;
    }
    // Provides data to paint errors if needed, luckily draftValues come in ordered by row number
    const rowKeyToRowNumberMap = new Map(
      this.draftValues.map(draft => [
        draft[this.keyField],
        this.tableData.findIndex(data => draft[this.keyField] === data[this.keyField]) + 1
      ])
    );

    // On partial save rows, this helps signal which rows succeeded by clearing them out
    this.showSpinner = true;
    const saveResults = await tableService.updateDraftValues(this.draftValues, rowKeyToRowNumberMap);

    if (saveResults.errors.rows && Object.keys(saveResults.errors.rows).length) {
      this.saveErrors = saveResults.errors;
    }
    if (saveResults.success && saveResults.success.length) {
      const cleanRowKey = this.keyField === 'Id' ? 'id' : this.keyField; // LDS response lowercases this
      saveResults.success.forEach(recordInput => {
        this._draftSuccessIds.add(recordInput[cleanRowKey]);
      });
      this.refreshTable();
    }
    // In case there are only error rows
    this.showSpinner = false;
  }

  // Private functions

  _setTableColumns(tableColumns) {
    if (!tableColumns || !tableColumns.length) {
      return;
    }
    const finalColumns = [];
    for (let col of tableColumns) {
      // Never show the auto-queried RecordTypeId
      if (col.fieldName.toLowerCase() === 'recordtypeid') {
        continue;
      }
      // Column label replacement
      if (this.columnLabels && this.columnLabels.size) {
        this._setFieldLabel(col);
      }
      // Sorting
      if (this.sortableFields && this.sortableFields.size) {
        // If parent fields require sorting, use _ in place of . for the fieldName.
        if (this.sortableFields.has(col.fieldName)) {
          col.sortable = true;
        }
      }
      // Inline edit
      if (this.editableFields && this.editableFields.size) {
        col.editable = this.editableFields.has(col.fieldName);
      }
      // All custom data types first, but notice that the
      // only way to pass down attributes is via typeAttributes
      if (col.type.startsWith('custom')) {
        const additional = {
          tableBoundary: this.uniqueBoundary,
          rowKeyAttribute: this.keyField,
          rowKeyValue: { fieldName: this.keyField },
          isEditable: this.editableFields.has(col.fieldName)
        };
        col.typeAttributes = { ...col.typeAttributes, ...additional };
      }
      // Overridden by specific logic
      if (col.type === 'customName') {
        if (OBJECTS_WITH_COMPOUND_NAMES.includes(this._objectApiName)) {
          col.typeAttributes.isCompoundName = true;
        }
      }
      if (col.type === 'customLookup') {
        // Warm the getLookupConfig wire adapter before editable cells fully render
        this._lookupConfigDevName = this.lookupConfigDevName || DATATABLE_LOOKUP_CONFIG_DEFAULT;
      }
      finalColumns.push(col);
    }
    if (this.showRowMenuActions) {
      finalColumns.push({
        type: 'action',
        typeAttributes: {
          rowActions: this._getRowActions.bind(this),
          menuAlignment: 'auto'
        }
      });
    }
    this.tableColumns = finalColumns;
    this._notifyPublicEvent('columnsload');
  }

  _setFieldLabel(singleColumn) {
    if (this.columnLabels.has(singleColumn.fieldName)) {
      singleColumn.label = this.columnLabels.get(singleColumn.fieldName);
    }
  }

  _setTableData(tableData, isRefresh) {
    if (!tableData || !tableData.length) {
      this.tableData = [];
      return;
    }
    // First Paint - no sort
    if (!isRefresh && !this.sortedBy) {
      this.tableData = tableData;
    }
    // First Paint - has sort
    if (!isRefresh && this.sortedBy) {
      this._sortData(this.sortedBy, this.sortedDirection, tableData);
    }
    // Refresh should respect whatever is in the UI
    if (isRefresh) {
      this.tableData = this.tableData.map(uiRow =>
        tableData.find(serverRow => uiRow[this.keyField] === serverRow[this.keyField])
      );
    }
    // Store the fully initialized rows for global search
    this._originalTableData = this.tableData;
    this._notifyPublicEvent('rowsload');
  }

  _updateColumnSorting(fieldName, sortDirection) {
    this.sortedBy = fieldName;
    this.sortedDirection = sortDirection;
    this._sortData(fieldName, sortDirection, this.tableData);
  }

  _sortData(fieldName, sortDirection, unsortedData) {
    const dataToSort = JSON.parse(JSON.stringify(unsortedData));
    const reverse = sortDirection !== 'asc';
    this.tableData = dataToSort.sort(this._sortBy(fieldName, reverse));
  }

  _sortBy(field, reverse, primer) {
    const key = primer
      ? function (x) {
          return primer(x[field]);
        }
      : function (x) {
          return x[field];
        };
    // checks if the two rows should switch places
    reverse = !reverse ? 1 : -1;
    return function (a, b) {
      // eslint-disable-next-line no-sequences
      return (a = key(a) ? key(a) : ''), (b = key(b) ? key(b) : ''), reverse * ((a > b) - (b > a));
    };
  }

  _getRowActions(row, doneCallback) {
    let actions = [];
    // These are pre-sorted by order by server
    this.rowActionConfigs.forEach(cfg => {
      // "Native" actions
      if (this._objectInfo.updateable && cfg.Row_Action_Name__c === 'edit_row') {
        actions.push({ label: 'Edit', name: 'edit_row' });
      }
      if (this._objectInfo.deletable && cfg.Row_Action_Name__c === 'delete_row') {
        actions.push({ label: 'Delete', name: 'delete_row' });
      }
      // Custom actions
      if (cfg.Row_Action_Name__c === 'custom_flow') {
        actions.push({
          label: cfg.Button_Label__c,
          name: cfg.Row_Action_Name__c,
          flowApiName: cfg.Flow_API_Name__c,
          dialogSize: cfg.Dialog_Size__c
        });
      }
      if (cfg.Row_Action_Name__c === 'custom_lwc') {
        actions.push({
          label: cfg.Button_Label__c,
          name: cfg.Row_Action_Name__c,
          lwcName: cfg.LWC_Name__c,
          dialogSize: cfg.Dialog_Size__c
        });
      }
    });
    doneCallback(actions);
  }

  _clearDraftValues(rowKeysToNull) {
    // For save of only a subset of the total rows
    this.draftValues = this.draftValues.filter(draft => !rowKeysToNull.includes(draft[this.keyField]));
    rowKeysToNull.forEach(key => {
      this._draftValuesMap.delete(key);
    });
    this.messageService.publish({
      key: 'setdraftvalue',
      value: { rowKeysToNull: rowKeysToNull }
    });
    // Removes both table and row errors from `lightning-datatable`
    if (this._draftValuesMap.size === 0 && this.draftValues.length === 0) {
      this.saveErrors = [];
      this._draftSuccessIds = new Set();
    }
  }

  _prepGlobalSearch() {
    // Dependency on _setTableData for data
    if (!this._originalTableData.length) {
      return;
    }
    // When table refreshes, clear out the search input.
    // Future enhancement here to hold onto the value and pre-filter before a refresh.
    this.searchInput.value = null;

    const firstRow = this._originalTableData[0];
    const searchKeys = Object.keys(firstRow).filter(
      fieldName =>
        // Fuse obj arr search crashes entire result if objects are detected
        typeof firstRow[fieldName] !== 'object' &&
        // Remove certain keys from being searched
        !fieldName.toLowerCase().includes('id')
    );
    const options = {
      includeScore: INCLUDE_SCORE,
      ignoreLocation: IGNORE_LOCATION,
      threshold: SEARCH_THRESHOLD, // default is 0.6, this makes it less fuzzy
      keys: searchKeys
    };
    this._fuseData = new Fuse(this._originalTableData, options);
  }

  _initializeLookupConfigData() {
    // Calling function assumes this._lookupConfigData is populated
    this.messageService.publish({ key: 'lookupconfigload', value: { lookupConfigs: this._lookupConfigData } });
  }

  _initializeRecordTypeIdData() {
    // Used for collection datatable
    this.dispatchEvent(new CustomEvent('picklistconfigload'));
  }

  // Public Events

  _notifyPublicEvent(eventName) {
    switch (eventName) {
      case 'columnsload': {
        this.dispatchEvent(
          new CustomEvent('columnsload', {
            detail: { tableColumns: this.tableColumns },
            bubbles: true,
            composed: true
          })
        );
        break;
      }
      case 'rowsload': {
        this.dispatchEvent(
          new CustomEvent('rowsload', {
            detail: { tableData: this.tableData },
            bubbles: true,
            composed: true
          })
        );
        break;
      }
      case 'rowselection': {
        this.dispatchEvent(
          new CustomEvent('rowselection', {
            detail: { selectedRows: this.selectedRows },
            bubbles: true,
            composed: true
          })
        );
        break;
      }
      default:
      // nothing
    }
  }

  // Private toast functions

  _notifySingleError(title, error = '') {
    if (this.messageService) {
      this.messageService.notifySingleError(title, error);
    } else {
      this._notifyError(title, reduceErrors(error)[0]);
    }
  }

  _notifyError(title, error = '') {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: error,
        variant: 'error',
        mode: 'sticky'
      })
    );
  }

  // Class expressions

  get containerClass() {
    // prettier-ignore
    return [
      'slds-border_top',
      'slds-border_bottom',
      'slds-border_left',
      'slds-border_right',
      'slds-is-relative']
    .join(' ');
  }

  get extensionBoundaryClass() {
    return `extension-boundary-class-${this.uniqueBoundary}`;
  }

  get customHeightStyle() {
    if (this.useLoadStyleHackForOverflow) {
      return '';
    }
    if (this.customHeight) {
      return `height: ${this.customHeight}px;`;
    }
    if (this.useRelativeMaxHeight) {
      // 62vh tries to take into account both global header and utility bar
      const viewHeight = this.customRelativeMaxHeight ? this.customRelativeMaxHeight : '62';
      return `height: ${viewHeight}vh;`;
    }
    return '';
  }

  // Always far left
  get searchClass() {
    let css = [];
    if (this.showRefreshButton || this.showComposedActions || this.showTableActions) {
      css.push('slds-p-right_x-small');
    }
    if (!this.showRefreshButton && !this.showComposedActions && !this.showTableActions) {
      css.push('slds-p-right_small');
    }
    return css.join(' ');
  }

  // Always one right from search
  get refreshClass() {
    let css = [];
    if (!this.showComposedActions && !this.showTableActions) {
      css.push('slds-p-right_small');
    }
    return css.join(' ');
  }
}
