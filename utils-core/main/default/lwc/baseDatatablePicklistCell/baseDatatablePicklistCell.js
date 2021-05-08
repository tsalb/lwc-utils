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
import { getPicklistValues } from 'lightning/uiObjectInfoApi';

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

export default class BaseDatatablePicklistCell extends LightningElement {
  // Properties for this specific LWC
  // After a lot of random debugging, it appears that recordTypeId is a reserved typeAttribute
  // which is not passed down correctly if used, so the workaround is to use a custom prop name
  @api
  get picklistRecordTypeId() {
    return this._picklistRecordTypeId || MASTER_RECORD_TYPE_ID;
  }
  set picklistRecordTypeId(value) {
    this._picklistRecordTypeId = value || MASTER_RECORD_TYPE_ID;
  }

  get fieldDescribe() {
    return `${this.objectApiName}.${this.fieldApiName}`;
  }

  // Required properties for datatable-edit-cell
  @api value; // comes in from datatable as the picklist api value
  @api tableBoundary;
  @api rowKeyAttribute;
  @api rowKeyValue;
  @api isEditable;
  @api objectApiName;
  @api columnName;
  @api fieldApiName;

  get cellDisplayValue() {
    if (this._isCleared) {
      return null;
    }
    if (!this._valueToLabelMap || this._valueToLabelMap.size === 0) {
      return this.value;
    }
    // Supports if database has a value not currently in the picklist options
    if (!this._valueToLabelMap.has(this.value)) {
      return this.value;
    }
    if (this._valueToLabelMap.has(this.value)) {
      return this._valueToLabelMap.get(this.value);
    }
    if (this._selectedValue) {
      return this._valueToLabelMap.get(this._selectedValue);
    }
    return this.value;
  }

  get editableCell() {
    return this.template.querySelector('c-base-datatable-editable-cell');
  }

  // private
  _isCleared = false;
  _errors = [];
  _valueToLabelMap = new Map();
  _picklistRecordTypeId;
  _selectedValue;

  // Duplicate this wire at the container level to reconcile label / api name mismatches
  @wire(getPicklistValues, { recordTypeId: '$picklistRecordTypeId', fieldApiName: '$fieldDescribe' })
  wiredPicklistValues({ error, data }) {
    if (error) {
      this._errors.push(error);
      console.error('Error', error);
    } else if (data) {
      this._valueToLabelMap = new Map(data.values.map(({ label, value }) => [value, label]));
    }
  }

  // Event Handlers

  handlePicklistConfigLoad(event) {
    const payload = event.detail.value;
    if (payload.recordTypeIdMap) {
      const rtMap = new Map(Object.entries(payload.recordTypeIdMap));
      // TODO make recordId always included, when available, to customPicklist datatype. For now, this is OK.
      this._picklistRecordTypeId = rtMap.get(this.rowKeyValue);
    }
  }

  handleSelected(event) {
    if (this.editableCell && this.editableCell.showMassEdit) {
      return;
    }
    this._selectedValue = event.detail.selectedValue;
    this._isCleared = !this._selectedValue;
  }

  handleReset() {
    this._isCleared = false;
    this._selectedValue = null;
    // Force template refresh
    // eslint-disable-next-line
    this.tableBoundary = this.tableBoundary;
  }

  // For mass edit
  handleSetDraftValue(event) {
    this._selectedValue = event.detail.draftValue;
    this._isCleared = !this._selectedValue;
  }
}
