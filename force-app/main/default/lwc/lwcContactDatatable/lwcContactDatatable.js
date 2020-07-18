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

import { LightningElement, api, wire } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import wireContactsByAccountId from '@salesforce/apex/DataServiceCtrl.wireContactsByAccountId';
import getContactsByAccountId from '@salesforce/apex/DataServiceCtrl.getContactsByAccountId';

const TABLE_COLUMNS = [
    { label: 'Name', fieldName: 'Name', type: 'text', initialWidth: 110 },
    { label: 'Email', fieldName: 'Email', type: 'email', initialWidth: 170 },
    { label: 'Phone', fieldName: 'Phone', type: 'phone', initialWidth: 130 },
    { label: 'Street', fieldName: 'MailingStreet', type: 'text' },
    { label: 'City', fieldName: 'MailingCity', type: 'text' },
    { label: 'State', fieldName: 'MailingState', type: 'text' },
    { label: 'Zip', fieldName: 'MailingPostalCode', type: 'text' },
    { label: 'Country', fieldName: 'MailingCountry', type: 'text' },
    {
        type: 'button',
        initialWidth: 135,
        typeAttributes: { label: 'Clear Address', name: 'clear_address', title: 'Click to clear out Mailing Address' }
    },
    {
        type: 'button',
        initialWidth: 155,
        typeAttributes: {
            label: 'Update Address',
            name: 'update_address',
            title: 'Click to open modal to update Mailing Address'
        }
    }
];

export default class LwcContactDatatable extends LightningElement {
    @api
    get recordId() {
        return this._recordId;
    }
    set recordId(value) {
        this._accountId = value;
        this._recordId = value;
    }
    columns = TABLE_COLUMNS;

    @wire(wireContactsByAccountId, { accountId: '$_accountId' })
    contacts;

    // private
    _isRendered;
    _messageService;
    _accountId; // app flexipages
    _recordId; // record flexipage

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._messageService = this.template.querySelector('c-message-service');
    }

    // Event handlers

    handleClearTable() {
        this.contacts = [];
    }

    handleAccountSelected(event) {
        const payload = event.detail.value;
        this._accountId = payload.accountId;
    }

    handleRefreshContacts() {
        this.reloadTable();
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'clear_address': {
                this.clearMailingAddress(row);
                break;
            }
            case 'update_address': {
                const dialogServicePayload = {
                    method: 'bodyModal',
                    config: {
                        auraId: 'update-address-single-row',
                        headerLabel: 'Update Address',
                        component: 'c:lwcContactAddressForm',
                        componentParams: {
                            boundary: this._recordId, // null for app page is fine
                            contact: row
                        }
                    }
                };
                this._messageService.dialogService(dialogServicePayload);
                break;
            }
            default:
        }
    }

    async clearMailingAddress(row) {
        let recordObject = {
            fields: {
                Id: row.Id,
                MailingStreet: null,
                MailingCity: null,
                MailingState: null,
                MailingPostalCode: null,
                MailingCountry: null
            }
        };
        try {
            await updateRecord(recordObject);
        } catch (error) {
            this._messageService.notifySingleError('Error Clearing Mailing Address', error);
        } finally {
            this.reloadTable();
        }
    }

    async reloadTable() {
        try {
            this.contacts.data = await getContactsByAccountId({ accountId: this._accountId });
        } catch (error) {
            this._messageService.notifySingleError('Error Reloading Table', error);
        }
    }
}
