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

export default class BaseListboxItem extends LightningElement {
  @api record;
  @api title;
  @api subtitle;
  @api iconName;
  @api activeId;

  @api
  selectItem(currentId) {
    if (this.isActive || currentId === this.record.Id) this.clickRecord();
  }

  get label() {
    return this.record[this.title];
  }
  get subLabel() {
    return this.record[this.subtitle];
  }
  get isActive() {
    return this.activeId === this.record.Id;
  }

  get itemClasses() {
    const classes = [
      'slds-media',
      'slds-listbox__option',
      'slds-listbox__option_entity',
      'slds-listbox__option_has-meta'
    ];

    if (this.isActive) {
      classes.push('slds-has-focus');
    }

    return classes.join(' ');
  }

  clickRecord() {
    const payload = {
      detail: {
        selectedRecordId: this.record.Id
      },
      bubbles: true,
      composed: true
    };
    this.dispatchEvent(new CustomEvent('selected', payload));
  }
}
