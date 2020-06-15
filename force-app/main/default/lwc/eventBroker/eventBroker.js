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
import { publish, MessageContext } from 'lightning/messageService';
import OPEN_CHANNEL from '@salesforce/messageChannel/OpenChannel__c';

export default class EventBroker extends LightningElement {
    @api scopedId;
    @wire(CurrentPageReference) pageRef;
    @wire(MessageContext) messageContext;

    /* Utilities */
    @api
    getPageRef() {
        return this.pageRef;
    }

    /* Aura broker to LWC */
    @api
    brokerMessageToLWC(payload) {
        publish(this.messageContext, OPEN_CHANNEL, { key: payload.key, value: payload.value });
    }

    /* LWC broker to Aura */
    @api
    forceRefreshView() {
        const finalPayload = {
            type: 'refreshView'
        };
        this._brokerEventToAura(finalPayload);
    }
    @api
    fireAppEvent(payload) {
        const finalPayload = {
            type: 'appEvent',
            key: payload.key,
            value: payload.value
        };
        this._brokerEventToAura(finalPayload);
    }
    @api
    fireRecordEvent(payload) {
        const finalPayload = {
            type: 'recordEvent',
            key: payload.key,
            value: payload.value,
            recordId: payload.recordId // if provided, overrides recordId on GC_MessageBrokerHandler_LwcWrapper
        };
        this._brokerEventToAura(finalPayload);
    }

    // PRIVATE
    _brokerEventToAura(finalPayload) {
        const boundary = { scopedId: this.scopedId };
        publish(this.messageContext, OPEN_CHANNEL, {
            key: 'brokerEventToAura',
            value: { ...finalPayload, ...boundary }
        });
    }
}
