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

import { LightningElement, api } from 'lwc';

export default class DatatableLookupCell extends LightningElement {
    // LWC specific attributes
    @api
    get href() {
        if (!this.value || this._isCleared) {
            return null;
        }
        if (this._href) {
            return this._href;
        }
        if (this._selectedRecordId) {
            return `/${this._selectedRecordId}`;
        }
        if (this.value.startsWith('/')) {
            return this.value;
        }
        return `/${this.value}`;
    }
    set href(value) {
        this._href = value && value.startsWith('/') ? value : `/${value}`;
    }
    @api target = '_parent';
    @api displayValue;
    @api referenceObjectApiName;

    // Required properties for datatable-edit-cell
    @api value; // comes in from datatable as the value of the name field
    @api tableBoundary;
    @api rowKeyAttribute;
    @api rowKeyValue;
    @api isEditable;
    @api objectApiName;
    @api columnName;
    @api fieldApiName;

    configIconName;
    configTitle;
    configSubtitle;

    // private
    _isCleared = false;
    _selectedRecordId;
    _selectedDisplayValue;

    get cellDisplayValue() {
        if (this._isCleared) {
            return null;
        }
        if (this._selectedDisplayValue) {
            return this._selectedDisplayValue;
        }
        return this.displayValue;
    }

    handleLookupConfigLoad(event) {
        const payload = event.detail.value;
        if (payload.lookupConfigs && payload.lookupConfigs.length) {
            const lookupMap = new Map(payload.lookupConfigs.map(obj => [obj.Object_API_Name__c, obj]));
            const cellConfig = lookupMap.has(this.referenceObjectApiName)
                ? lookupMap.get(this.referenceObjectApiName)
                : lookupMap.get('All');
            // Send these down to the open source component
            this.configIconName = cellConfig.Icon_Name__c;
            this.configTitle = cellConfig.Title_Field__c;
            this.configSubtitle = cellConfig.Subtitle_Field__c;
        }
    }

    // It's easier for the lookup custom data type to have logic here, unlike the picklist custom data type
    handleReset() {
        this._isCleared = false;
        this._selectedRecordId = null;
        this._selectedDisplayValue = null;
    }

    handleSelected(event) {
        this._selectedRecordId = event.detail.selectedRecordId;
        this._selectedDisplayValue = event.detail.selectedDisplayValue;
        this._isCleared = !this._selectedRecordId && !this._selectedDisplayValue;
    }
}
