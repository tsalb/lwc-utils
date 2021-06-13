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
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

export default class BaseDatatableLookupCell extends LightningElement {
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

  // For when lookup id changes
  @wire(getRecord, { recordId: '$_selectedRecordId', fields: '$_titleField' })
  lookupRecord;

  configIconName;
  configTitle;
  configSubtitle;

  get editableCell() {
    return this.template.querySelector('c-base-datatable-editable-cell');
  }

  // private
  _isCleared = false;
  _titleField;
  _selectedRecordId;

  get cellDisplayValue() {
    if (this._isCleared) {
      return null;
    }
    if (this._selectedRecordId) {
      return this.lookupTitleField;
    }
    if (this.value && !this.displayValue) {
      this._selectedRecordId = this.value;
      return this.lookupTitleField;
    }
    return this.displayValue;
  }

  get lookupTitleField() {
    return getFieldValue(this.lookupRecord.data, this._titleField);
  }

  // Event Handlers

  handleLookupConfigLoad(event) {
    const payload = event.detail.value;
    if (payload.lookupConfigs && payload.lookupConfigs.length) {
      const lookupMap = new Map(payload.lookupConfigs.map(obj => [obj.Object_API_Name__c, obj]));
      const cellConfig = lookupMap.has(this.referenceObjectApiName)
        ? lookupMap.get(this.referenceObjectApiName)
        : lookupMap.get('All');
      if (cellConfig) {
        // Send these down to the open source component
        this.configIconName = cellConfig.Icon_Name__c;
        this.configTitle = cellConfig.Title_Field__c;
        this.configSubtitle = cellConfig.Subtitle_Field__c;
        // Configure lookup changes if edit mode is used
        this._titleField = `${this.referenceObjectApiName}.${this.configTitle}`;
      }
    }
  }

  handleSelected(event) {
    if (this.editableCell && this.editableCell.showMassEdit) {
      return;
    }
    this._selectedRecordId = event.detail.selectedRecordId;
    this._isCleared = !this._selectedRecordId;
  }

  handleReset() {
    this._isCleared = false;
    this._selectedRecordId = null;
    // Force template refresh
    // eslint-disable-next-line
    this.target = this.target;
  }

  // For mass edit
  handleSetDraftValue(event) {
    this._selectedRecordId = event.detail.draftValue;
    this._isCleared = !this._selectedRecordId;
  }
}
