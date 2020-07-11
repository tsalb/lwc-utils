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
import { reduceErrors, createFlattenedSetFromDelimitedString } from 'c/utils';

const MAX_ROW_SELECTION = 200;
const OBJECTS_WITH_COMPOUND_NAMES = ['Contact'];

// Datatable_Action_Config__mdt
const PRIMARY_CONFIG_CHECK = 'Primary';
const SECONDARY_CONFIG_CHECK = 'Secondary';
const ROW_ACTION_CHECK = 'Row Action';

// Datatable_Lookup_Config__mdt
const DATATABLE_LOOKUP_CONFIG_DEFAULT = 'Default_Lookup_Config';

// HACK ALERT START
// Currently, there is no way to to inject css into a base component, lightning-datatable
// This is needed to support overflow of customPicklist and customLookup when there are only a few rows
import datatableStyleOverrides from '@salesforce/resourceUrl/Datatable_CSS_Override';
import { loadStyle } from 'lightning/platformResourceLoader';
// HACK ALERT END

export default class Datatable extends LightningElement {
    @api recordId;
    @api
    get keyField() {
        return this._keyField || 'Id';
    }
    set keyField(value = 'Id') {
        this._keyField = value;
    }
    @api title;
    @api showRecordCount = false;

    // MessageService boundary, for when multiple instances are on same page
    @api uniqueBoundary;

    // SOQL
    @api queryString;
    @api isRecordBind = false;

    // Misc
    @api columnWidthsMode = 'auto'; // override salesforce default
    @api showRefreshButton = false;
    @api showSpinner = false;
    @api useRelativeMaxHeight = false;

    // Sorting
    @api sortedBy;
    @api sortedDirection = 'asc';
    @api
    get sortableFields() {
        return this._sortableFields;
    }
    set sortableFields(value = '') {
        this._sortableFields = createFlattenedSetFromDelimitedString(value, ',');
    }

    // Row selections
    @api selectedRows = [];
    @api
    get checkboxType() {
        return this._checkboxType;
    }
    set checkboxType(value = 'None') {
        switch (value) {
            case 'Multi':
                this.maxRowSelection = MAX_ROW_SELECTION;
                this.isHideCheckbox = false;
                break;
            case 'Single':
                this.maxRowSelection = 1;
                this.isHideCheckbox = false;
                break;
            default:
                this.isHideCheckbox = true;
                break;
        }
    }

    // Inline editing
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

    // Template and getters
    isHideCheckbox = true;
    maxRowSelection = MAX_ROW_SELECTION;

    tableData = [];
    tableColumns = [];
    draftValues = []; // this is to feed into the datatable to clear stuff out
    saveErrors = {};

    primaryConfig = {};
    secondaryConfig = {};
    rowActionConfigs = [];

    get recordCount() {
        return this.tableData ? this.tableData.length : 0;
    }

    get hasActions() {
        return this.showRefreshButton || this.showTableActions;
    }

    get showTableActions() {
        return this.hasPrimaryAction || this.hasSecondaryAction;
    }

    get hasPrimaryAction() {
        return this.primaryConfig && this.primaryConfig.Button_Label__c;
    }

    get primaryActionName() {
        return this.primaryConfig.Type__c.toLowerCase().includes('flow')
            ? this.primaryConfig.Flow_API_Name__c
            : this.primaryConfig.LWC_Name__c;
    }

    get hasSecondaryAction() {
        return this.secondaryConfig && this.secondaryConfig.Button_Label__c;
    }

    get secondaryActionName() {
        return this.secondaryConfig.Type__c.toLowerCase().includes('flow')
            ? this.secondaryConfig.Flow_API_Name__c
            : this.secondaryConfig.LWC_Name__c;
    }

    get showRowMenuActions() {
        return this.rowActionConfigs.length;
    }

    // Public APIs

    @api
    initializeTable(objectApiName, columns, data) {
        this.showSpinner = true;
        this._objectApiName = objectApiName;
        this._setTableColumns(columns);
        this._setTableData(data);
        console.log(this.tableData);
        console.log(this.tableColumns);
        // for inline-edit success
        if (this._draftSuccessIds.size) {
            this._clearDraftValues([...this._draftSuccessIds.keys()]);
        }
        this.showSpinner = false;
    }

    @api
    refreshTable() {
        this.showSpinner = true;
        this.dispatchEvent(new CustomEvent('refresh'));
    }

    // private
    _isRendered;
    _messageService;
    _objectApiName;
    _objectInfo;

    // private - inline edit
    _draftValuesMap = new Map();
    _draftSuccessIds = new Set();

    // private - table and lwc actions
    _actionConfigs = [];

    // Datatable_Lookup_Config__mdt
    _lookupConfigDevName;

    // For future enhancements
    @wire(getObjectInfo, { objectApiName: '$_objectApiName' })
    objectInfoWire({ error, data }) {
        if (error) {
            this._notifySingleError('getObjectInfo error', error);
        } else if (data) {
            this._objectInfo = data;
            console.log(this._objectInfo);
        }
    }

    // For any actions configured for this table
    @wire(getActionConfig, { configName: '$actionConfigDevName' })
    actionConfigWire({ error, data }) {
        if (error) {
            this._notifySingleError('getActionConfig error', error);
        } else if (data) {
            this._actionConfigs = data;
            console.log(this._actionConfigs);
            // Table Actions
            this.primaryConfig = this._actionConfigs.find(cfg => cfg.Type__c.includes(PRIMARY_CONFIG_CHECK));
            this.secondaryConfig = this._actionConfigs.find(cfg => cfg.Type__c.includes(SECONDARY_CONFIG_CHECK));
            // Row Actions
            this.rowActionConfigs = this._actionConfigs.filter(cfg => cfg.Type__c === ROW_ACTION_CHECK);
        }
    }

    // For lookup edits, if configured for this table
    @wire(getLookupConfig, { configName: '$_lookupConfigDevName' })
    lookupConfigWire({ error, data }) {
        if (error) {
            this._notifySingleError('getLookupEditConfig error', error);
        } else if (data) {
            console.log(data);
            // This is ok to use now since this wire is only accessed after the table column set
            this._messageService.publish({ key: 'lookupconfigload', value: { lookupConfigs: data } });
        }
    }

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._messageService = this.template.querySelector('c-message-service');
        loadStyle(this, datatableStyleOverrides + '/datatable.css');
    }

    // Event Handlers

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

    handleFlowAction(event) {
        const flowInputVars = [];
        let flowMethod;
        let flowApiName;
        let selectedRowKeys = [];

        // From Table Action
        if (event.target) {
            flowMethod = event.target.dataset.dialogSize === 'Large' ? 'flowLarge' : 'flow';
            flowApiName = event.target.name;
            selectedRowKeys = this.selectedRows.map(row => row[this.keyField]);
        }
        // Row Menu Action
        if (event.rowMenuAction) {
            flowMethod = event.rowMenuAction.dialogSize === 'Large' ? 'flowLarge' : 'flow';
            flowApiName = event.rowMenuAction.flowApiName;
            selectedRowKeys.push(event.rowMenuAction.row[this.keyField]);
        }

        if (!flowApiName || !flowMethod) {
            return;
        }

        // Input vars need to be calculated only when when necessary
        if (selectedRowKeys.length) {
            flowInputVars.push({
                name: 'SelectedRowKeys',
                type: 'String', // array
                value: selectedRowKeys
            });
            flowInputVars.push({
                name: 'SelectedRowKeysSize',
                type: 'Number',
                value: selectedRowKeys.length
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
        this._messageService.dialogService(flowPayload);
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
        } else {
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
        console.log(dialogPayload);
        this._messageService.dialogService(dialogPayload);
    }

    handleRowSelection(event) {
        this.selectedRows = event.detail.selectedRows;
        this._notifyPublicEvent('rowselection');
        // Supports mass inline editing
        this._messageService.publish({
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
                        auraId: 'datatable-delete-row',
                        headerLabel: 'Delete ' + this._objectInfo.label,
                        component: 'c:datatableDeleteRowForm',
                        componentParams: {
                            row: row,
                            uniqueBoundary: this.uniqueBoundary
                        }
                    }
                };
                this._messageService.dialogService(dialogPayload);
                break;
            }
            case 'edit_row': {
                const dialogPayload = {
                    method: 'bodyModalLarge',
                    config: {
                        auraId: 'datatable-edit-row',
                        headerLabel: `Edit ${this._objectInfo.label} Record`,
                        component: 'c:datatableEditRowForm',
                        componentParams: {
                            row: row,
                            objectApiName: this._objectInfo.apiName,
                            uniqueBoundary: this.uniqueBoundary
                        }
                    }
                };
                this._messageService.dialogService(dialogPayload);
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

        //console.log(this._draftValuesMap);

        if (this._draftValuesMap.size > 0) {
            this.draftValues = [...this._draftValuesMap.values()];
            //console.log(this.draftValues);
        }
    }

    handleCancel() {
        // do not prevent default, but tell every single draft row to clear itself
        this._clearDraftValues([...this._draftValuesMap.keys()]);
        // also tell any custom data type to clear restore itself
        this._messageService.publish({ key: 'canceldraft' });
    }

    // Avoid using the event because the payload doesn't have name compound fields
    async handleSave() {
        // Provides data to paint errors if needed, luckily draftValues come in ordered by row number
        const rowKeyToRowNumberMap = new Map(
            this.draftValues.map(draft => [
                draft[this.keyField],
                this.tableData.findIndex(data => draft[this.keyField] === data[this.keyField]) + 1
            ])
        );

        //console.log(rowKeyToRowNumberMap);
        //console.log(this.draftValues);

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
                if (col.typeAttributes.isEditable) {
                    // Warm the cache with a variable assignment for each c-datatable-lookup-cell
                    // messageService then publishes this to each one when the edit mode is accessed
                    this._lookupConfigDevName = this.lookupConfigDevName || DATATABLE_LOOKUP_CONFIG_DEFAULT;
                }
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
            return (a = key(a) ? key(a) : ''), (b = key(b) ? key(b) : ''), reverse * ((a > b) - (b > a));
        };
    }

    _getRowActions(row, doneCallback) {
        let actions = [];
        console.log(this.rowActionConfigs);
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
        this._messageService.publish({
            key: 'setdraftvalue',
            value: { rowKeysToNull: rowKeysToNull }
        });
        // Removes both table and row errors from `lightning-datatable`
        if (this._draftValuesMap.size === 0 && this.draftValues.length === 0) {
            this.saveErrors = [];
            this._draftSuccessIds = new Set();
        }
    }

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
        if (this._messageService) {
            this._messageService.notifySingleError(title, error);
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
        let css = 'slds-border_top slds-border_bottom slds-border_left slds-border_right slds-is-relative ';
        if (this.useRelativeMaxHeight) {
            css += 'table-vh ';
        }
        return css;
    }

    get refreshClass() {
        let css = 'slds-p-left_x-small ';
        if (!this.showTableActions) {
            css += 'slds-p-right_small ';
        }
        return css;
    }
}
