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
import { deleteRecord } from 'lightning/uiRecordApi';

export default class BaseDatatableDeleteRowForm extends LightningElement {
  @api uniqueBoundary;
  @api row;
  showSpinner = false;

  // calculated
  get messageTemplate() {
    return `Are you sure you want to delete "${this.row.Name}"?`;
  }

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  handleCancel() {
    this.messageService.notifyClose();
  }

  async handleConfirm() {
    this.showSpinner = true;
    try {
      await deleteRecord(this.row.Id);
      this.messageService.notifySuccess(`Successfully Deleted "${this.row.Name}".`);
      this._refreshViewAndClose();
    } catch (error) {
      //console.log(error);
      this.messageService.notifySingleError('Error Deleting Row', error);
    } finally {
      this.showSpinner = false;
    }
  }

  _refreshViewAndClose() {
    if (this.uniqueBoundary) {
      this.messageService.publish({ key: 'refreshsoqldatatable' });
    } else {
      this.messageService.forceRefreshView();
    }
    this.messageService.notifyClose();
  }
}
