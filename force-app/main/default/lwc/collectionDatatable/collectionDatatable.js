import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getDisplayTypeMap from '@salesforce/apex/DataTableService.getDisplayTypeMap';

// Toast and Errors
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors, createSetFromDelimitedString } from 'c/utils';

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
        this._shownFields = createSetFromDelimitedString(value, ',');
    }
    @api editableFields;
    @api sortableFields;
    @api sortedBy;
    @api sortedDirection;

    columnWidthsMode;

    // private
    _displayTypeMap;
    _singleRecordId;
    _objectApiName;
    _objectInfo;
    _objectFieldsMap;
    _finalColumns;

    get isUsingShownFields() {
        return this.shownFields && this.shownFields.size;
    }

    // Supports the wire functions, which is where the real parsing happens
    async connectedCallback() {
        this._displayTypeMap = new Map(Object.entries(await getDisplayTypeMap()));
        if (this.recordCollection && this.recordCollection.length) {
            this._singleRecordId = this.recordCollection.find(row => row.hasOwnProperty('Id')).Id;
        }
    }

    // Extracts the correct apiName
    @wire(getRecord, { recordId: '$_singleRecordId', layoutTypes: 'Compact' })
    wiredSingleRecord({ error, data }) {
        if (error) {
            this._notifySingleError('getRecord error', error);
        } else if (data) {
            this._objectApiName = data.apiName;
        }
    }

    // Provides data about fields for this object type
    @wire(getObjectInfo, { objectApiName: '$_objectApiName' })
    wiredObjectInfo({ error, data }) {
        if (error) {
            this._notifySingleError('getObjectInfo error', error);
        } else if (data) {
            this._objectInfo = data;
            // Creating columns means parsing LDS and matching that to design props or what's in the record collection
            this._objectFieldsMap = new Map(Object.entries(this._objectInfo.fields));
            const collectionFields = this._createSetFromUniqueCollectionFields(this.recordCollection);
            const columns = this._createColumns(collectionFields, this.shownFields);
            // Then we can access a public api on the base datatable component
            this.template
                .querySelector('c-datatable')
                .initializeTable(this._objectApiName, columns, this.recordCollection);
        }
    }

    _createSetFromUniqueCollectionFields(collection) {
        const uniqueFields = new Set();
        collection.forEach(row => {
            Object.keys(row).forEach(fieldName => {
                // Prevents flattened fields of SOQL datatable from entering these keys
                if (this._objectFieldsMap.has(fieldName)) {
                    uniqueFields.add(fieldName);
                }
            });
        });
        return uniqueFields;
    }

    _createColumns(collectionFields, fieldsToShow) {
        const finalColumns = [];
        this.columnWidthsMode = this.isUsingShownFields ? 'auto' : 'fixed';
        if (this.isUsingShownFields) {
            fieldsToShow.forEach(fieldName => {
                finalColumns.push(this._createColumnAttribute(fieldName));
            });
        } else {
            collectionFields.forEach(fieldName => {
                finalColumns.push(this._createColumnAttribute(fieldName));
            });
        }
        return finalColumns;
    }

    _createColumnAttribute(fieldName) {
        const fieldConfig = this._objectFieldsMap.get(fieldName);
        return {
            label: fieldConfig.label,
            fieldName: fieldConfig.apiName,
            type: this._displayTypeMap.get(fieldConfig.dataType.toUpperCase()),
            initialWidth: 200
        };
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
