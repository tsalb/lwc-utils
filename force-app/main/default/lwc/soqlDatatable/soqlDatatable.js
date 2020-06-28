/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2019, james@sparkworks.io
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
import { getRecord } from 'lightning/uiRecordApi';
import * as tableService from 'c/tableService';

// Flow specific imports
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

// Toast and Errors
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/utils';

export default class SoqlDatatable extends LightningElement {
    @api recordId;
    @api objectApiName;

    @api isRecordBind;
    @api title;
    @api showRecordCount;
    @api showRefreshButton;

    @api queryString;
    @api checkboxType;
    @api editableFields;

    @api sortableFields;
    @api sortedBy;
    @api sortedDirection;

    // Pass through outputs for flow
    @api selectedRows;

    showSpinner;

    // private
    _isRendered;
    _messageService;
    _finalQueryString;
    _datatable;

    // supports $CurrentRecord syntax
    _mergeMap = new Map();
    _objectApiName;
    _objectInfo;
    _getRecordFields = [];

    // Goes first if there is a $CurrentRecord in the SOQL String
    @wire(getObjectInfo, { objectApiName: '$_objectApiName' })
    currentObjectWire({ error, data }) {
        if (error) {
            this._notifySingleError('getObjectInfo error', error);
        } else if (data) {
            this._objectInfo = data;
            this._getRecordFields = Array.from(this._mergeMap.values()).map(
                config => config.objectQualifiedFieldApiName
            );
        }
    }

    // Goes second
    @wire(getRecord, { recordId: '$recordId', fields: '$_getRecordFields' })
    currentRecordWire({ error, data }) {
        if (error) {
            this._notifySingleError('getRecord error', error);
        } else if (data) {
            for (let config of this._mergeMap.values()) {
                config.value = data.fields[config.fieldApiName].value;
                config.dataType = this._objectInfo.fields[config.fieldApiName].dataType;
            }
            // Finally we can merge field our queryString
            for (const [key, config] of this._mergeMap.entries()) {
                const dataType = config.dataType.toLowerCase();
                if (dataType === 'date') {
                    this.queryString = this.queryString.replace(key, config.value);
                }
                if (dataType === 'string' || dataType === 'picklist' || dataType === 'reference') {
                    this.queryString = this.queryString.replace(key, `'${config.value}'`);
                }
            }
            this._finalQueryString = this.queryString;
            this.validateQueryStringAndInitialize();
        }
    }

    @api
    async refreshTable() {
        const cache = await this.fetchTableCache();
        this.initializeTable(cache);
    }

    async connectedCallback() {
        if (!this.queryString) {
            return;
        }
        // Record binding is more complex, so run some validations first
        if (this.isRecordBind) {
            if (!tableService.isRecordId(this.recordId)) {
                this._notifyError('Invalid recordId', 'Must be 15 or 18 digit Salesforce Object recordId');
                return;
            }
            if (this.queryString.includes('$recordId')) {
                this.queryString = this.queryString.replace('$recordId', `'${this.recordId}'`);
            }
            // Backwards compat, this needs to go second since syntax above is preferred
            if (this.queryString.includes('recordId')) {
                this.queryString = this.queryString.replace('recordId', `'${this.recordId}'`);
            }
            // This one needs some heavier processing via wire
            if (this.queryString.includes('$CurrentRecord')) {
                const matches = this.queryString.match(/(\$[\w.]*)/g);
                matches.forEach(original => {
                    const config = {
                        objectQualifiedFieldApiName: original.replace('$CurrentRecord', this.objectApiName),
                        fieldApiName: original.replace('$CurrentRecord.', ''),
                        value: null // awaiting LDS
                    };
                    this._mergeMap.set(original, config);
                });
                // Allow LDS to finish field merging queryString, starting with objectInfo
                // Unfortunately since we can't control order of wires, we fake it with assignment of vars
                this._objectApiName = this.objectApiName;
                return;
            }
        }
        this._finalQueryString = this.queryString;
        this.validateQueryStringAndInitialize();
    }

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._messageService = this.template.querySelector('c-message-service');
        this._datatable = this.template.querySelector('c-datatable');
    }

    async validateQueryStringAndInitialize() {
        // Compile validation before we send to more expensive data and column building code
        const queryError = await tableService.checkQueryException(this._finalQueryString);
        if (queryError) {
            this._notifyError('Invalid SOQL String', queryError);
            return;
        }
        this.refreshTable();
    }

    async fetchTableCache() {
        this.showSpinner = true;
        try {
            return await tableService.fetchTableCache({ queryString: this._finalQueryString });
        } catch (error) {
            this._notifySingleError('fetchTableCache error', error);
        }
    }

    initializeTable(cache) {
        this._datatable.initializeTable(cache.objectApiName, cache.tableColumns, cache.tableData);
    }

    // Event Handlers

    handleRowSelection(event) {
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedRows', event.detail.selectedRows));
    }

    handleRefresh() {
        this.refreshTable();
    }

    // Private Functions

    _notifySingleError(title, error = '') {
        if (this._messageService) {
            this._messageService.notifySingleError(title, error);
        } else {
            this._notifyError(title, error);
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
}
