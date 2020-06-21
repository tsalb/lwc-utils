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

import { LightningElement, api, wire } from 'lwc';
import { subscribe, unsubscribe, publish, MessageContext } from 'lightning/messageService';
import OPEN_CHANNEL from '@salesforce/messageChannel/OpenChannel__c';

// Toast
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/utils';

export default class MessageService extends LightningElement {
    @api boundary;
    subscription = null;
    @wire(MessageContext) messageContext;

    connectedCallback() {
        if (this.subscription) {
            return;
        }
        this.subscription = subscribe(this.messageContext, OPEN_CHANNEL, payload => {
            if (payload.hasOwnProperty('boundary') && payload.boundary !== this.boundary) {
                return;
            }
            this.dispatchEvent(new CustomEvent(payload.key, { detail: { value: payload.value } }));
        });
    }

    disconnectedCallback() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    @api
    dialogService(payload) {
        this._messageServicePublish({ key: 'opendialog', value: payload });
    }

    @api
    notifyClose() {
        this._messageServicePublish({ key: 'closedialog' });
    }

    @api
    publish(payload) {
        if (this.boundary) {
            this._messageServicePublishWithBoundary(payload);
        } else {
            this._messageServicePublish(payload);
        }
    }

    @api
    publishOpen(payload) {
        this._messageServicePublish(payload);
    }

    @api
    forceRefreshView() {
        eval("$A.get('e.force:refreshView').fire();");
    }

    @api
    notifySuccess(title, message = null) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: 'success'
            })
        );
    }

    @api
    notifyInfo(title, message = null) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: 'info'
            })
        );
    }

    @api
    notifySingleError(title, error = '') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: reduceErrors(error)[0],
                variant: 'error',
                mode: 'sticky'
            })
        );
    }

    // private

    _messageServicePublish(payload) {
        publish(this.messageContext, OPEN_CHANNEL, { key: payload.key, value: payload.value });
    }

    _messageServicePublishWithBoundary(payload) {
        publish(this.messageContext, OPEN_CHANNEL, { boundary: this.boundary, key: payload.key, value: payload.value });
    }
}
