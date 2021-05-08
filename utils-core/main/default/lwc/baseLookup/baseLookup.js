/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Justin Lyon
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
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
 *
 */
import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOneRecordById from '@salesforce/apex/LookupAuraService.getOneRecordById';
import getRecent from '@salesforce/apex/LookupAuraService.getRecent';
import getRecords from '@salesforce/apex/LookupAuraService.getRecords';

const ARROW_UP = 'ArrowUp';
const ARROW_DOWN = 'ArrowDown';
const ENTER = 'Enter';
const ESCAPE = 'Escape';
const ACTIONABLE_KEYS = [ARROW_UP, ARROW_DOWN, ENTER, ESCAPE];

export default class BaseLookup extends LightningElement {
  @api objectApiName;
  @api iconName;

  @api
  get value() {
    if (this.isCleared) {
      return null;
    }
    if (this.selected) {
      return this.selected;
    }
    return this._value;
  }
  set value(val) {
    this._value = val;
    if (val) {
      this.requestOneById();
    }
  }

  @api fieldLabel;
  @api title = 'Name';
  @api subtitle;
  @api readOnly = false;
  @api required = false;
  @api messageWhenInputError = 'This field is required.';

  inputValue = '';
  records = [];
  focused = false;
  selected = '';
  selectedName = '';
  record;
  error;
  activeId = '';
  isCleared = false;

  @api checkValidity() {
    return !this.required || (this.value && this.value.length > 14);
  }

  @api reportValidity() {
    const isValid = this.checkValidity();
    this.error = isValid ? {} : { message: this.messageWhenInputError };
    return isValid;
  }

  connectedCallback() {
    if (this.value) {
      this.requestOneById();
    } else {
      this.requestRecent();
    }
  }

  get isReadOnly() {
    return this.readOnly || this.record;
  }
  get showListbox() {
    return this.focused && this.records.length > 0 && !this.record;
  }
  get showClear() {
    return !this.readOnly && (this.record || (!this.record && this.inputValue.length > 0));
  }
  get hasError() {
    return this.error ? this.error.message : '';
  }
  get recordIds() {
    return this.records.map(r => r.Id);
  }

  get containerClasses() {
    const classes = ['slds-combobox_container'];

    if (this.record) {
      classes.push('slds-has-selection');
    }

    return classes.join(' ');
  }

  get inputClasses() {
    const classes = ['slds-input', 'slds-combobox__input'];

    if (this.record) {
      classes.push('slds-combobox__input-value');
    }

    return classes.join(' ');
  }

  get comboboxClasses() {
    const classes = ['slds-combobox', 'slds-dropdown-trigger', 'slds-dropdown-trigger_click'];

    if (this.showListbox) {
      classes.push('slds-is-open');
    }
    if (this.hasError) {
      classes.push('slds-has-error');
    }

    return classes.join(' ');
  }

  onKeyup(event) {
    if (this.readOnly) return;
    this.inputValue = event.target.value;
    this.error = null;

    const keyAction = {
      ArrowUp: () => {
        this.cycleActive(false);
      },
      ArrowDown: () => {
        this.cycleActive(true);
      },
      Enter: () => {
        this.selectItem();
      },
      Escape: () => {
        this.clearSelection();
      }
    };

    if (ACTIONABLE_KEYS.includes(event.code)) {
      keyAction[event.code]();
    } else {
      if (this.inputValue.length >= 2) {
        this.debounceSearch();
      } else if (this.inputValue.length === 0) {
        this.records = [];
        this.requestRecent();
      } else {
        this.error = {
          message: 'Minimum 2 characters'
        };
      }
    }
  }

  handleSelected(event) {
    event.stopPropagation();
    this.isCleared = false;
    this.selected = event.detail.selectedRecordId;
    this.record = this.records.find(record => record.Id === this.selected);
    this.inputValue = this.record[this.title];
    this.fireSelected();
  }

  search() {
    const searcher = this.getSearcher();
    this.error = null;

    getRecords({ searcher })
      .then(data => {
        const newData = JSON.parse(data);
        this.records = newData.flat().sort((a, b) => this.sortAlpha(a, b));

        if (this.records.length === 0) {
          this.error = {
            message: 'No records found, please refine your search.'
          };
        }
      })
      .catch(error => {
        console.error('Error searching records: ', error);
        this.error = error;
      });
  }

  debounceSearch() {
    window.clearTimeout(this.delaySearch);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.delaySearch = setTimeout(() => {
      this.search();
    }, 300);
  }

  requestOneById() {
    const searcher = this.getSearcher();
    this.error = null;

    getOneRecordById({ searcher, recordId: this.value })
      .then(data => {
        const records = JSON.parse(data);
        this.records = records;
        this.record = records[0];
        this.selected = this.record.Id;
        this.inputValue = this.record[this.title];
      })
      .catch(error => {
        console.error('Error getting record by Id', error);
        this.error = error;
      });
  }

  requestRecent() {
    const searcher = this.getSearcher();
    this.error = null;

    getRecent({ searcher })
      .then(data => {
        this.records = JSON.parse(data);
      })
      .catch(error => {
        console.error('Error requesting recents', error);
        this.error = error;
      });
  }

  clearSelection() {
    this.isCleared = true;
    this.selected = '';
    this.record = null;
    this.inputValue = '';
    this.error = null;
    this.requestRecent();
    this.fireSelected();
  }

  fireSelected() {
    const payload = {
      detail: {
        selectedRecordId: this.selected,
        selectedDisplayValue: this.inputValue
      }
    };
    this.dispatchEvent(new CustomEvent('selected', payload));
  }

  cycleActive(forwards) {
    const currentIndex = this.recordIds.indexOf(this.activeId);
    if (currentIndex === -1 || currentIndex === this.records.length) {
      this.activeId = this.recordIds[0];
    } else if (!forwards && currentIndex === 0) {
      this.activeId = this.recordIds[this.recordIds.length - 1];
    } else if (forwards) {
      this.activeId = this.recordIds[currentIndex + 1];
    } else {
      this.activeId = this.recordIds[currentIndex - 1];
    }
  }

  selectItem() {
    if (!this.records || this.records.length === 0) return;

    const listbox = this.template.querySelector('c-base-listbox');
    listbox.selectItem();
  }

  setFocus(event) {
    this.focused = event.type === 'focus';
    if (event.type === 'blur') {
      this.reportValidity();
    }
  }

  getSearcher() {
    const searcherFields = [this.title];
    if (this.subtitle) {
      searcherFields.push(this.subtitle);
    }
    return {
      searchTerm: this.inputValue,
      objectName: this.objectApiName,
      fields: searcherFields
    };
  }

  sortAlpha(a, b) {
    const aName = a[this.title].toLowerCase();
    const bName = b[this.title].toLowerCase();

    if (aName < bName) return -1;
    if (aName > bName) return 1;

    return 0;
  }

  fireToast(notification) {
    const toast = new ShowToastEvent(notification);
    this.dispatchEvent(toast);
  }
}
