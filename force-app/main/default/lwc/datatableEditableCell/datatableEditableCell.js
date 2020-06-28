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

// HACK ALERT START
// Currently, there is no way to style inside a base component without this.
// We do this to fill the utility icon SVGs with a color rather than the base utility grey.
import css_overrides from '@salesforce/resourceUrl/css_overrides';
import { loadStyle } from 'lightning/platformResourceLoader';
// HACK ALERT END

export default class DatatableEditableCell extends LightningElement {
    @api originalValue;
    @api valueCellProp;
    @api editCellProp;
    @api isEditable;

    @api rowKeyAttribute;
    @api rowKeyValue;
    @api objectApiName;
    @api columnName;
    @api fieldApiName; // for Contact Name, this is an array
    @api isCompoundName;

    draftValue;
    isEditMode;
    showEditIcon;
    selectedRows;

    _valueElement;
    _editElement;

    // private
    _isRendered;
    _sectionContainer;
    _valueOnEdit;

    get showMassEdit() {
        return (
            this.selectedRows &&
            this.selectedRows.length > 1 &&
            this.selectedRows.filter(row => row[this.rowKeyAttribute] === this.rowKeyValue).length === 1
        );
    }

    get checkboxLabel() {
        return `Update ${this.selectedRows.length} selected items`;
    }

    get cellDisplayValue() {
        return this.draftValue ? this.draftValue : this.originalValue;
    }

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._messageService = this.template.querySelector('c-message-service');

        // override base slds styles
        loadStyle(this, css_overrides + '/datatableEditableCell.css');
        this._sectionContainer = this.template.querySelector('section');
    }

    // Vanilla editing

    toggleShowEditIcon(event) {
        if (this.isEditMode || !this.isEditable) {
            event.preventDefault();
            return;
        }
        this.showEditIcon = event.type === 'mouseenter';
    }

    enableEditMode() {
        this.isEditMode = true;
        this.listenForClickOutside();
        // // Not perfect, but wait a bit for template to render then focus it
        // window.clearTimeout(this.focusDelayTimeout);
        // // eslint-disable-next-line @lwc/lwc/no-async-operation
        // this.focusDelayTimeout = setTimeout(() => {
        //     this.template.querySelector('lightning-combobox').focus();
        // }, 100);
    }

    // Mass editing

    handleMassEditCancel() {
        this.forceClosePopover();
    }

    handleMassEditApply() {
        const currentInputValue = this._editElement.value;
        const isAppliedToMultipleRows = this.template.querySelector('.mass-input-checkbox').checked;

        if (isAppliedToMultipleRows) {
            let rowIdentifierToValues = {};
            this.selectedRows.forEach(row => {
                const identifier = `${row[this.rowKeyAttribute]}_${this.objectApiName}_${this.fieldApiName}`;
                Object.defineProperty(rowIdentifierToValues, identifier, {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: currentInputValue
                });
            });
            console.log(rowIdentifierToValues);
            this._messageService.publish({
                key: 'setdraftvalue',
                value: { rowIdentifierToValues: rowIdentifierToValues }
            });
        } else {
            this.draftValue = selectedValue;
            this.forceClosePopover();
        }
    }

    forceClosePopover() {
        this.listenForClickOutside(true);
    }

    // Dynamically attached events

    listenForClickOutside(isForceClose) {
        let clicksInside = 0;

        const thisClick = () => {
            clicksInside++;
        };

        const documentClick = () => {
            clicksInside--;
            // click was finally outside of _sectionContainer, i.e. document click
            if (clicksInside < 0) {
                removeAndCloseMenu();
            }
        };

        const removeAndCloseMenu = () => {
            this.isEditMode = false;
            this.showEditIcon = false;
            this.notifyCellChanged();
            this._sectionContainer.removeEventListener('click', thisClick);
            document.removeEventListener('click', documentClick);
            clicksInside = 0; // reset counter
        };

        if (isForceClose) {
            removeAndCloseMenu();
        } else {
            this._sectionContainer.addEventListener('click', thisClick);
            document.addEventListener('click', documentClick);
        }
    }

    // Event Handlers

    handleValueCellSlotChange(event) {
        this._valueElement = event.target.assignedElements()[0];
        this._valueElement[this.valueCellProp] = this.cellDisplayValue;
    }

    handleEditCellSlotChange(event) {
        this._editElement = event.target.assignedElements()[0];
        this._editElement[this.editCellProp] = this.cellDisplayValue;
        if (!this.showMassEdit) {
            this._editElement.addEventListener('change', this.handleEditCellInputChange.bind(this));
        }
    }

    handleCancelDraftValue() {
        if (!this.isEditable) {
            return;
        }
        this.draftValue = null;
        this._valueElement[this.valueCellProp] = this.cellDisplayValue;
    }

    handleRowSelected(event) {
        if (!this.isEditable) {
            return;
        }
        const payload = event.detail.value;
        this.selectedRows = payload.selectedRows;
    }

    handleSetDraftValue(event) {
        if (!this.isEditable) {
            return;
        }
        const payload = JSON.parse(JSON.stringify(event.detail.value)); // un-proxify for ease of debugging
        if (payload.rowKeysToNull && payload.rowKeysToNull.includes(this.rowKeyValue)) {
            this.draftValue = null;
            this._valueElement[this.valueCellProp] = this.cellDisplayValue;
        }
        if (payload.rowIdentifierToValues) {
            console.log(this.fieldApiName);
            const identifierMap = new Map(Object.entries(payload.rowIdentifierToValues));
            const currentCellIdentifier = `${this.rowKeyValue}_${this.objectApiName}_${this.fieldApiName}`;
            if (identifierMap.has(currentCellIdentifier)) {
                const incomingDraftValue = identifierMap.get(currentCellIdentifier);
                this.draftValue = incomingDraftValue;
                this._valueElement[this.valueCellProp] = incomingDraftValue;
                this.forceClosePopover();
            }
        }
    }

    // Cell Event Handlers

    handleEditCellInputChange(event) {
        this.draftValue = event.target.value;
    }

    // Public Events

    notifyCellChanged() {
        // When user doesn't click apply
        if (this.showMassEdit && !this.draftValue) {
            return;
        }
        // Match UX of vanilla datatable when no changes made
        if (!this.draftValue) {
            return;
        }
        let rowData = {
            [this.rowKeyAttribute]: this.rowKeyValue
        };
        let columnData = {};

        // A little messy, cleanup later
        if (this.isCompoundName) {
            // https://stackoverflow.com/questions/29825464/javascript-split-split-string-by-last-dot
            const nameParts = this.draftValue.split(/\ (?=[^\ ]+$)/);
            columnData = {
                FirstName: nameParts[0],
                LastName: nameParts[1]
            };
        } else {
            columnData = {
                [this.columnName]: this.draftValue
            };
        }
        this.dispatchEvent(
            new CustomEvent('cellchange', {
                detail: {
                    draftValues: [{ ...rowData, ...columnData }]
                },
                bubbles: true,
                composed: true
            })
        );
    }

    // Class Expressions

    get calculateLayoutClass() {
        let css = 'slds-p-horizontal_xx-small ';
        if (this.draftValue) {
            css += 'slds-is-edited';
        }
        return css;
    }
}
