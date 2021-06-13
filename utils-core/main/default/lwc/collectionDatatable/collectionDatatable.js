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
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { generateUUID, reduceErrors, createFlattenedSetFromDelimitedString } from 'c/baseUtils';

// Background services from apex
import getDisplayTypeMap from '@salesforce/apex/DataTableService.getDisplayTypeMap';
import getRecordTypeIdMap from '@salesforce/apex/DataTableService.getRecordTypeIdMap';

// Toast and Errors
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Flow specific imports
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

// Flatten data again, for when things are recalculated
import { flattenQueryResult } from 'c/tableServiceUtils';

// TODO: Tackle later
/* eslint @lwc/lwc/no-api-reassignments: 0 */

export default class CollectionDatatable extends LightningElement {
  @api recordCollection;
  @api title;
  @api showRecordCount = false;
  @api showSearch = false;
  @api checkboxType;
  @api
  get shownFields() {
    return this._shownFields;
  }
  set shownFields(value = '') {
    this._shownFields = createFlattenedSetFromDelimitedString(value, ',');
  }
  @api columnLabels;
  @api editableFields;
  @api sortableFields;
  @api sortedBy;
  @api sortedDirection;
  @api customHeight;

  // Flow outputs
  @api selectedRows = [];
  @api firstSelectedRow = {};
  @api editedRows = [];
  @api allRows = [];

  // LWC loadStyle hack - to help with picklist and lookup menu overflows
  // https://salesforce.stackexchange.com/a/270624
  @api useLoadStyleHackForOverflow;

  // MessageService boundary, useful for when multiple instances are on same page
  get uniqueBoundary() {
    if (!this._uniqueBoundary) {
      this._uniqueBoundary = generateUUID();
    }
    return this._uniqueBoundary;
  }

  get composedActionSlot() {
    return this.template.querySelector('slot[name=composedActions]');
  }

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  showComposedActions = true;

  // private
  _isRendered;
  _displayTypeMap = new Map();
  _initializationType;
  _hasCustomPicklist;
  _recordTypeIdMap = new Map();
  _singleRecordId;
  _objectApiName;
  _objectInfo;
  _objectFieldsMap = new Map();
  _referenceFieldsMap = new Map();

  async connectedCallback() {
    if (!this.recordCollection || !this.recordCollection.length) {
      return;
    }
    // Use the serverside configured display map for column creation client-side
    this._displayTypeMap = new Map(Object.entries(await getDisplayTypeMap()));

    // Collections can be either from a Get Record element or un-inserted Record Collection.
    const recordIdRow = this.recordCollection.find(row => Object.prototype.hasOwnProperty.call(row, 'Id'));
    if (recordIdRow) {
      this.initializeFromRecordId(recordIdRow.Id);
    } else {
      this.initializeFromCollection();
    }
  }

  renderedCallback() {
    if (this._isRendered) {
      return;
    }
    this._isRendered = true;
    this.showComposedActions = this.composedActionSlot && this.composedActionSlot.assignedElements().length !== 0;
  }

  async initializeFromRecordId(recordId) {
    this._initializationType = 'recordId';
    // Start the wire now
    this._singleRecordId = recordId;
  }

  initializeFromCollection() {
    this._initializationType = 'collection';
    // Salesforce Dependency to extend the flow apis to non-CPE backed screen components:
    // More detail here https://github.com/tsalb/lwc-utils/issues/93#issuecomment-860267785
  }

  @wire(getRecord, { recordId: '$_singleRecordId', layoutTypes: 'Compact' })
  wiredSingleRecord({ error, data }) {
    if (error) {
      this._notifySingleError('getRecord error', error);
    } else if (data) {
      this._objectApiName = data.apiName;
    }
  }

  @wire(getObjectInfo, { objectApiName: '$_objectApiName' })
  wiredObjectInfo({ error, data }) {
    if (error) {
      this._notifySingleError('getObjectInfo error', error);
    } else if (data) {
      this._objectInfo = data;

      // Flatten here, we want to recover any possible customLookup name values
      this.recordCollection = flattenQueryResult(this.recordCollection);
      //console.log(this.recordCollection);

      // Creating columns means parsing LDS and matching that to design props or what's in the record collection
      this._objectFieldsMap = new Map(Object.entries(this._objectInfo.fields));
      //console.log(this._objectFieldsMap);

      this._referenceFieldsMap = new Map(
        Array.from(this._objectFieldsMap.values())
          .filter(field => field.reference && field.referenceToInfos.length)
          .map(field => {
            const referenceTo = field.referenceToInfos[0];
            const flatNameField = `${field.relationshipName}_${referenceTo.nameFields[0]}`;
            return [field.apiName, flatNameField];
          })
      );
      //console.log(this._referenceFieldsMap);

      // Columns need special flags set within them for custom data types
      const columns = [];
      this.shownFields.forEach(fieldName => {
        columns.push(this._createBaseColumnAttribute(fieldName));
      });

      // We initialize the table first and let its editable cell events do the rest
      this.template
        .querySelector('c-base-datatable')
        .initializeTable(this._objectApiName, columns, this.recordCollection);
    }
  }

  // Event Handlers

  handleSave(event) {
    if (event.detail.editedRows && event.detail.editedRows.length) {
      const editedRowsClean = event.detail.editedRows.map(row => this._getCleanRow(row));
      //console.log(editedRowsClean);
      this.dispatchEvent(new FlowAttributeChangeEvent('editedRows', editedRowsClean));
    }
    if (event.detail.allRows && event.detail.allRows.length) {
      const allRowsClean = event.detail.allRows.map(row => this._getCleanRow(row));
      //console.log(allRowsClean);
      this.dispatchEvent(new FlowAttributeChangeEvent('allRows', allRowsClean));
    }
  }

  handleRowSelection(event) {
    if (event.detail.selectedRows && event.detail.selectedRows.length) {
      this.selectedRows = event.detail.selectedRows.map(row => this._getCleanRow(row));
      this.firstSelectedRow = this._getCleanRow(event.detail.selectedRows[0]);
      this.dispatchEvent(new FlowAttributeChangeEvent('selectedRows', this.selectedRows));
      this.dispatchEvent(new FlowAttributeChangeEvent('firstSelectedRow', this.firstSelectedRow));
    }
  }

  handlePicklistConfigLoad() {
    if (this._initializationType === 'recordId' && this._hasCustomPicklist) {
      this._initializeRecordTypeIds();
    }
  }

  // Private functions

  _getCleanRow(row) {
    for (let fieldName in row) {
      if (typeof row[fieldName] === 'object') {
        continue;
      }
      if (!this._objectFieldsMap.has(fieldName)) {
        delete row[fieldName];
      }
    }
    return row;
  }

  _createBaseColumnAttribute(fieldName) {
    const fieldConfig = this._objectFieldsMap.get(fieldName);
    const hasConfig = !!fieldConfig;
    let columnDefinition = {
      label: hasConfig ? fieldConfig.label : fieldName.split('_').join(' '),
      fieldName: hasConfig ? fieldConfig.apiName : fieldName,
      type: hasConfig ? this._displayTypeMap.get(fieldConfig.dataType.toUpperCase()) : 'text'
    };
    // A little more processing is needed for custom data types
    if (columnDefinition.type === 'customLookup' && this._referenceFieldsMap.has(fieldName)) {
      const lookupTypeAttributes = {
        typeAttributes: {
          columnName: hasConfig ? fieldConfig.apiName : fieldName,
          fieldApiName: hasConfig ? fieldConfig.apiName : fieldName,
          objectApiName: this._objectApiName,
          href: { fieldName: fieldName },
          target: '_parent',
          displayValue: { fieldName: this._referenceFieldsMap.get(fieldName) },
          referenceObjectApiName: this._objectFieldsMap.get(fieldName).referenceToInfos[0].apiName
        }
      };
      columnDefinition = { ...columnDefinition, ...lookupTypeAttributes };
    }
    if (columnDefinition.type === 'customPicklist') {
      this._hasCustomPicklist = true;
      const picklistTypeAttributes = {
        typeAttributes: {
          columnName: hasConfig ? fieldConfig.apiName : fieldName,
          fieldApiName: hasConfig ? fieldConfig.apiName : fieldName,
          objectApiName: this._objectApiName
        }
      };
      columnDefinition = { ...columnDefinition, ...picklistTypeAttributes };
    }
    //console.log(columnDefinition);
    return columnDefinition;
  }

  async _initializeRecordTypeIds() {
    // JS Maps don't travel well over messageService, so we send it in its original form
    const recordTypeIdMap = await getRecordTypeIdMap({ recordIds: this.recordCollection.map(row => row.Id) });

    // Store it here for future roadmap if necessary
    this._recordTypeIdMap = new Map(Object.entries(recordTypeIdMap));

    // Size check is easier on the converted type
    if (this._recordTypeIdMap.size) {
      // Picklist columns should have been initialized now.
      // If this breaks, we need datatable.js to initiate this instead
      this.messageService.publish({
        key: 'picklistconfigload',
        value: { recordTypeIdMap: recordTypeIdMap }
      });
    }
  }

  _notifySingleError(title, error) {
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
