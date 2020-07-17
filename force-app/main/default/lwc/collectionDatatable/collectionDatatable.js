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
import getDisplayTypeMap from '@salesforce/apex/DataTableService.getDisplayTypeMap';
import { generateUUID, reduceErrors, createFlattenedSetFromDelimitedString } from 'c/utils';

// Toast and Errors
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Flow specific imports
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

// Flatten data again, for when things are recalculated
import { flattenQueryResult } from 'c/tableServiceUtils';

export default class CollectionDatatable extends LightningElement {
    @api recordCollection;
    @api title;
    @api showRecordCount;
    @api checkboxType;
    @api
    get shownFields() {
        return this._shownFields;
    }
    set shownFields(value = '') {
        this._shownFields = createFlattenedSetFromDelimitedString(value, ',');
    }
    @api editableFields;
    @api sortableFields;
    @api sortedBy;
    @api sortedDirection;

    columnWidthsMode = 'auto';

    // Flow outputs
    @api editedRows;
    @api allRows;

    // private
    _isRendered;
    _messageService;
    _displayTypeMap = new Map();
    _singleRecordId;
    _objectApiName;
    _objectInfo;
    _objectFieldsMap = new Map();
    _referenceFieldsMap = new Map();

    // MessageService boundary, useful for when multiple instances are on same page
    get uniqueBoundary() {
        if (!this._uniqueBoundary) {
            this._uniqueBoundary = generateUUID();
        }
        return this._uniqueBoundary;
    }

    async connectedCallback() {
        if (!this.recordCollection || !this.recordCollection.length) {
            return;
        }
        // Use the serverside configured display map for column creation client-side
        this._displayTypeMap = new Map(Object.entries(await getDisplayTypeMap()));

        // Collections can be either from a getRecord (which will contain Ids) or Record (Single) collection.
        const recordIdRow = this.recordCollection.find(row => row.hasOwnProperty('Id'));

        // Should ever only be one or the other, unless I learn some new things about how flow works
        if (recordIdRow) {
            this.initializeFromWire(recordIdRow.Id);
        } else {
            // TODO - this should be a fallback if no objectApiName was given by the configuration
            // ALSO TODO - surface an object api name prop on this design file
            // this.initializeFromCollection()
        }
    }

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._messageService = this.template.querySelector('c-message-service');
    }

    initializeFromWire(recordId) {
        this._singleRecordId = recordId;
    }

    // initializeFromCollection(objectApiName) {
    //     this._objectApiName = objectApiName;
    // }

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
            console.log(this.recordCollection);

            // Creating columns means parsing LDS and matching that to design props or what's in the record collection
            this._objectFieldsMap = new Map(Object.entries(this._objectInfo.fields));
            console.log(this._objectFieldsMap);

            this._referenceFieldsMap = new Map(
                Array.from(this._objectFieldsMap.values())
                    .filter(field => field.reference && field.referenceToInfos.length)
                    .map(field => {
                        const referenceTo = field.referenceToInfos[0];
                        const flatNameField = `${field.relationshipName}_${referenceTo.nameFields[0]}`;
                        return [field.apiName, flatNameField];
                    })
            );
            console.log(this._referenceFieldsMap);

            const columns = [];
            this.shownFields.forEach(fieldName => {
                columns.push(this._createBaseColumnAttribute(fieldName));
            });
            this.template
                .querySelector('c-datatable')
                .initializeTable(this._objectApiName, columns, this.recordCollection);
        }
    }

    handleSave(event) {
        //this._messageService.publish({ key: 'resetlookup' });
        if (event.detail.editedRows && event.detail.editedRows.length) {
            const editedRowsClean = event.detail.editedRows.map(row => this._getCleanRow(row));
            console.log(editedRowsClean);
            this.dispatchEvent(new FlowAttributeChangeEvent('editedRows', editedRowsClean));
        }
        if (event.detail.allRows && event.detail.allRows.length) {
            const allRowsClean = event.detail.allRows.map(row => this._getCleanRow(row));
            console.log(allRowsClean);
            this.dispatchEvent(new FlowAttributeChangeEvent('allRows', allRowsClean));
        }
    }

    _getCleanRow(row) {
        for (let fieldName in row) {
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
                    // objectApiName: not sure how to do this one yet
                    href: { fieldName: fieldName },
                    target: '_parent',
                    displayValue: { fieldName: this._referenceFieldsMap.get(fieldName) },
                    referenceObjectApiName: this._objectFieldsMap.get(fieldName).referenceToInfos[0].apiName
                }
            };
            columnDefinition = { ...columnDefinition, ...lookupTypeAttributes };
        }
        if (columnDefinition.type === 'customPicklist') {
            // const picklistTypeAttributes = {
            //     typeAttributes: {
            //         columnName: hasConfig ? fieldConfig.apiName : fieldName,
            //         fieldApiName: hasConfig ? fieldConfig.apiName : fieldName,
            //         picklistRecordTypeId: 'oof not sure how to get this yet'
            //     }
            // };
            // columnDefinition = { ...columnDefinition, ...picklistTypeAttributes };
        }
        console.log(columnDefinition);
        return columnDefinition;
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
