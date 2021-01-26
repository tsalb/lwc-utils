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
import { subscribe, unsubscribe, onError, isEmpEnabled } from 'lightning/empApi';

export default class EmpApi extends LightningElement {
  @api channel;

  // Use this manually control when to connect.
  // Using this as a service component in any LWC template has
  // odd behavior if this renders first (Child to parent initialization)
  @api
  get connect() {
    return this._connect;
  }
  set connect(value) {
    this._connect = value;
    if (this._connect && isEmpEnabled && this.channel) {
      this.subscribe();
    }
  }

  // private
  _connect;
  _subscription = {};

  disconnectedCallback() {
    if (isEmpEnabled) {
      this.unsubscribe();
    }
  }

  // Handles subscribe button click
  subscribe() {
    // Callback invoked whenever a new event message is received
    const messageCallback = response => {
      // Response contains the payload of the new message received
      this.notifyMessage(response);
    };
    // Invoke subscribe method of empApi. Pass reference to messageCallback
    subscribe(this.channel, -1, messageCallback).then(response => {
      // Response contains the subscription information on successful subscribe call
      //console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
      this._subscription = response;
    });
  }

  // Handles unsubscribe button click
  unsubscribe() {
    // Invoke unsubscribe method of empApi
    unsubscribe(this._subscription, response => {
      console.info('unsubscribe() response: ', JSON.stringify(response));
    });
  }

  registerErrorListener() {
    // Invoke onError empApi method
    onError(error => {
      console.error('Received error from server: ', JSON.stringify(error));
    });
  }

  notifyMessage(response) {
    // Standardize it like the rest of salesforce
    this.dispatchEvent(
      new CustomEvent('message', {
        detail: {
          payload: response.data.payload,
          channel: response.channel
        }
      })
    );
  }
}
