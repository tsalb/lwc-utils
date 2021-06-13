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

const LOOKUP_DISPLAY_NAME = 'base-lookup-display';
const LOOKUP_EDIT_NAME = 'base-lookup-edit';
const PICKLIST_DISPLAY_NAME = 'base-picklist-display';
const PICKLIST_EDIT_NAME = 'base-picklist-edit';
const CUSTOM_CELL_DISPLAY_NAMES = [LOOKUP_DISPLAY_NAME, PICKLIST_DISPLAY_NAME];

export default class BaseDatatableEditableCell extends LightningElement {
  @api tableBoundary;
  @api originalValue;
  @api displayCellValueProp;
  @api editCellValueProp;
  @api isEditable;

  @api rowKeyAttribute;
  @api rowKeyValue;
  @api objectApiName;
  @api columnName;
  @api fieldApiName; // for Contact Name, this is an array
  @api isCompoundName;

  @api changeEventName = 'change';

  draftValue;
  isEditMode;
  showEditIcon;
  selectedRows;

  // private
  _isRendered = false;
  _isCleared = false;
  _displayElement;
  _editElement;

  @api
  get showMassEdit() {
    return (
      this.selectedRows &&
      this.selectedRows.length > 1 &&
      this.selectedRows.filter(row => row[this.rowKeyAttribute] === this.rowKeyValue).length === 1
    );
  }

  get isViewMode() {
    return !this.isEditMode;
  }

  get checkboxLabel() {
    return `Update ${this.selectedRows.length} selected items`;
  }

  get cellDisplayValue() {
    if (this._isCleared) {
      return null;
    }
    if (this.draftValue) {
      return this.draftValue;
    }
    return this.originalValue;
  }

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  get containerSection() {
    return this.template.querySelector('section');
  }

  renderedCallback() {
    if (this._isRendered) {
      return;
    }
    this._isRendered = true;
    // lightning-datatable doesn't have events for when cells are done rendering so we fake it here.
    // Unfortunately it also means that this event will only fire if a cell data type requires custom data types.
    // This should be debounced by parent listeners to know when the table is fully rendered.
    this.dispatchEvent(
      new CustomEvent('editablecellrendered', {
        bubbles: true,
        composed: true
      })
    );
  }

  // Vanilla editing

  toggleShowEditIcon(event) {
    if (this.isEditMode || !this.isEditable) {
      event.preventDefault();
      return;
    }
    const isEnter = event.type === 'mouseenter';
    this.showEditIcon = isEnter;
    if (isEnter) {
      event.target.classList.add('hover-bg');
    } else {
      event.target.classList.remove('hover-bg');
    }
  }

  enableEditMode() {
    this.isEditMode = true;
    this.listenForClickOutside();
  }

  // Mass editing

  handleMassEditCancel() {
    this.forceClosePopover();
  }

  handleMassEditApply() {
    const currentInputValue = this._editElement[this.editCellValueProp];
    const isAppliedToMultipleRows = this.template.querySelector('.mass-input-checkbox').checked;

    //console.log(currentInputValue);

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

      //console.log(rowIdentifierToValues);

      // Publishes to all instances of itself
      this.messageService.publish({
        key: 'setdraftvalue',
        value: { rowIdentifierToValues: rowIdentifierToValues }
      });
    } else {
      if (CUSTOM_CELL_DISPLAY_NAMES.includes(this._displayElement.name)) {
        this.dispatchEvent(new CustomEvent('customcellsetdraftvalue', { detail: { draftValue: currentInputValue } }));
      }
      this.draftValue = currentInputValue;
      this._isCleared = !this.draftValue;
      this.forceClosePopover();
    }
  }

  forceClosePopover() {
    this.listenForClickOutside(true);
  }

  // Events - Dynamically Attached

  listenForClickOutside(isForceClose) {
    let clicksInside = 0;

    const thisClick = () => {
      clicksInside++;
    };

    const documentClick = () => {
      clicksInside--;
      // click was finally outside of containerSection, i.e. document click
      if (clicksInside < 0) {
        // eslint-disable-next-line no-use-before-define
        removeAndCloseMenu();
      }
    };

    const removeAndCloseMenu = () => {
      this.isEditMode = false;
      this.showEditIcon = false;
      this.notifyCellChanged();
      this.containerSection.removeEventListener('click', thisClick);
      document.removeEventListener('click', documentClick);
      clicksInside = 0; // reset counter
    };

    if (isForceClose) {
      removeAndCloseMenu();
    } else {
      this.containerSection.addEventListener('click', thisClick);
      document.addEventListener('click', documentClick);
    }
  }

  // Event Handlers - Slot changes

  handleDisplayCellSlotChange(event) {
    if (event.target && event.target.assignedElements().length === 1) {
      this._displayElement = event.target.assignedElements()[0];
      this._displayElement.classList.add('slds-truncate');
      if (this.displayCellValueProp) {
        this._displayElement[this.displayCellValueProp] = this.cellDisplayValue;
      }
    }
  }

  handleEditCellSlotChange(event) {
    if (event.target && event.target.assignedElements().length === 1) {
      this._editElement = event.target.assignedElements()[0];
      if (this._editElement.name === PICKLIST_EDIT_NAME) {
        this._editElement.focus();
      }
      if (this.editCellValueProp) {
        this._editElement[this.editCellValueProp] = this.cellDisplayValue;
      }
      if (!this.showMassEdit) {
        this._editElement.addEventListener(this.changeEventName, this.handleEditCellInputChange);
      }
    }
  }

  // Event Handlers - Editing

  handleCancelDraftValue() {
    if (!this.isEditable) {
      return;
    }
    this.draftValue = null;
    this._isCleared = false;
    if (this.displayCellValueProp) {
      this._displayElement[this.displayCellValueProp] = this.cellDisplayValue;
    }
    if (CUSTOM_CELL_DISPLAY_NAMES.includes(this._displayElement.name)) {
      this.dispatchEvent(new CustomEvent('customcellreset'));
    }
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
    const payload = event.detail.value;
    //console.log(JSON.parse(JSON.stringify(payload)));
    if (payload.rowKeysToNull && payload.rowKeysToNull.includes(this.rowKeyValue)) {
      this.draftValue = null;
      this._isCleared = false;
      if (this.displayCellValueProp) {
        this._displayElement[this.displayCellValueProp] = this.cellDisplayValue;
      }
    }
    if (payload.rowIdentifierToValues) {
      const identifierMap = new Map(Object.entries(payload.rowIdentifierToValues));
      const currentCellIdentifier = `${this.rowKeyValue}_${this.objectApiName}_${this.fieldApiName}`;
      if (identifierMap.has(currentCellIdentifier)) {
        const incomingDraftValue = identifierMap.get(currentCellIdentifier);
        if (CUSTOM_CELL_DISPLAY_NAMES.includes(this._displayElement.name)) {
          this.dispatchEvent(
            new CustomEvent('customcellsetdraftvalue', { detail: { draftValue: incomingDraftValue } })
          );
        } else {
          this._displayElement[this.displayCellValueProp] = incomingDraftValue;
        }
        this.draftValue = incomingDraftValue;
        this._isCleared = !this.draftValue;
        this.forceClosePopover();
      }
    }
  }

  handleEditCellInputChange = event => {
    this.draftValue = this._getEventValue(event);
    this._isCleared = !this.draftValue;
    // These align the value selection behavior to native list views
    if (
      this._displayElement.name === PICKLIST_DISPLAY_NAME ||
      (this._displayElement.name === LOOKUP_DISPLAY_NAME && !this._isCleared)
    ) {
      this.forceClosePopover();
    }
  };

  // Public Events

  notifyCellChanged() {
    // When user doesn't click apply
    if (this.showMassEdit && !this.draftValue && !this._isCleared) {
      return;
    }
    // Match UX of vanilla datatable when no changes made
    if (!this.draftValue && !this._isCleared) {
      return;
    }
    let rowData = {
      [this.rowKeyAttribute]: this.rowKeyValue
    };
    let columnData = {};

    // A little messy, cleanup later
    if (this.isCompoundName) {
      // https://stackoverflow.com/questions/29825464/javascript-split-split-string-by-last-dot
      // eslint-disable-next-line no-useless-escape
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
    let css = 'slds-p-horizontal_x-small slds-has-flexi-truncate ';
    if (this.draftValue || this._isCleared) {
      css += 'slds-is-edited';
    }
    return css;
  }

  get calculateEditIconClass() {
    let css = 'slds-p-left_small slds-button__icon_hint ';
    if (this.showEditIcon) {
      css += 'slds-visible';
    } else {
      css += 'slds-hidden';
    }
    return css;
  }

  // Private functions

  _getEventValue(event) {
    // custom data types
    if (this._editElement.name === LOOKUP_EDIT_NAME) {
      return event.detail.selectedRecordId;
    }
    if (this._editElement.name === PICKLIST_EDIT_NAME) {
      return event.detail.selectedValue;
    }
    // fallbacks
    if (event.detail && typeof event.detail === 'string') {
      return event.detail;
    }
    if (event.target.value && typeof event.target.value === 'string') {
      return event.target.value;
    }
    // Shouldn't ever get here, but if it does
    return event.target.value;
  }
}
