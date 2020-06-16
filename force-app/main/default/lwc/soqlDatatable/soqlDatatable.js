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

import { LightningElement, api } from 'lwc';
import * as tableService from 'c/tableService';

// Flow specific imports
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

// Toast and Errors
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/utils';

export default class SoqlDatatable extends LightningElement {
    // Pass through inputs
    @api title;
    @api recordId;
    @api isRecordBind;
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
    _messageBroker;
    _finalQueryString;
    _datatable;
    _objectApiName;

    @api
    async refreshTable() {
        const cache = await this.fetchTableCache();
        this.initializeTable(cache);
    }

    async connectedCallback() {
        if (this.isRecordBind && !tableService.isRecordId(this.recordId)) {
            this._notifySingleError('Invalid recordId', 'Must be 15 or 18 digit Salesforce Object recordId');
            return;
        }
        if (this.queryString) {
            this._finalQueryString = this.isRecordBind
                ? this.queryString.replace('recordId', `'${this.recordId}'`)
                : this.queryString;

            const cache = await this.fetchTableCache();
            this.initializeTable(cache);
        }
    }

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._messageBroker = this.template.querySelector('c-message-broker');
        this._datatable = this.template.querySelector('c-datatable');
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

    _notifySingleError(title, error) {
        if (this._messageBroker) {
            this._messageBroker.notifySingleError(title, error);
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: title,
                    message: reduceErrors(error)[0],
                    variant: 'error',
                    mode: 'sticky'
                })
            );
        }
    }
}
