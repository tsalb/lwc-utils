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
import { CurrentPageReference } from 'lightning/navigation';
import { subscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import OPEN_CHANNEL from '@salesforce/messageChannel/OpenChannel__c';

export default class MessageBrokerHandler extends LightningElement {
    @api scopedId;
    @wire(CurrentPageReference) pageRef;
    @wire(MessageContext) messageContext;

    _subscription;

    connectedCallback() {
        this._subscription = subscribe(
            this.messageContext,
            OPEN_CHANNEL,
            message => {
                let payload = {};
                // messageChannel payload has immutable props, undo them here
                if (message.value) {
                    payload = JSON.parse(JSON.stringify(message.value));
                }
                // List of acceptable keys to be parsed in this component
                if (message.key === 'dialogService') {
                    this.dialogServiceEmitter(payload);
                }
                if (message.key === 'notifyClose') {
                    this.notifyCloseEmitter();
                }
            },
            { scope: APPLICATION_SCOPE }
        );
    }

    dialogServiceEmitter(payload) {
        // There seems to be a bug in the pageRef scoping in lightning console app for Spring 19
        // Will double check again when Summer 19 is GA, after the rounds of post GA hotfix.
        if (
            !payload.scopedId || // for app pages, this is null
            payload.scopedId === this.scopedId // for record flexipages
        ) {
            this.dispatchEvent(new CustomEvent('message', { detail: { payload } }));
        }
    }

    notifyCloseEmitter() {
        this.dispatchEvent(new CustomEvent('notifyclose'));
    }
}
