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

// TODO: Tackle later
/* eslint @lwc/lwc/no-api-reassignments: 0 */

export default class DialogAutoCloser extends LightningElement {
  @api messageTemplate;
  @api timer = 5;

  // Scopes refresh
  @api uniqueBoundary;
  @api isRefreshTable = false;

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  progress = 100;

  // private
  _originalTemplate;
  _originalTimer;
  _isRendered;
  _progressInterval;
  _timerInterval;

  connectedCallback() {
    this._originalTemplate = this.messageTemplate;
    this._originalTimer = this.timer;
    this.messageTemplate = this.messageTemplate ? this.messageTemplate.replace('{timer}', this.timer) : null;
  }

  renderedCallback() {
    if (this._isRendered) {
      return;
    }
    this._isRendered = true;
    this._startProgressInterval();
    this._startTimerInterval();
  }

  disconnectedCallback() {
    clearInterval(this._progressInterval);
    clearInterval(this._timerInterval);
  }

  _startProgressInterval() {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._progressInterval = setInterval(() => {
      if (this.timer === 0 || !this._timerInterval) {
        this._close();
      }
      // prettier-ignore
      this.progress = this.progress - (10 / this._originalTimer);
    }, 100); // 10 ticks per second gives a "smoother" bar
  }

  _startTimerInterval() {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._timerInterval = setInterval(() => {
      if (this.timer === 0 || !this._progressInterval) {
        this._close();
      }
      this.timer = this.timer - 1;
      if (this._originalTemplate && this.messageTemplate) {
        this.messageTemplate = this._originalTemplate.slice().replace('{timer}', this.timer);
      }
    }, 1000);
  }

  _close() {
    clearInterval(this._progressInterval);
    clearInterval(this._timerInterval);
    if (this.uniqueBoundary && this.isRefreshTable) {
      this.messageService.publish({ key: 'refreshsoqldatatable' });
    }
    this.dispatchEvent(new CustomEvent('closedialog'));
    this.messageService.notifyClose();
  }
}
