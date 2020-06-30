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

/**
 * Usage - these are how custom data types are configured by column attributes
 *
 * {
 *     label: 'Account Name',
 *     type: 'customName,
 *     fieldName: 'Name',
 *     typeAttributes: {
 *         // only way to pass row related data down
 *         href: { fieldName: 'Account_Id' },
 *         target: '_parent'
 *      },
 * }
 *
 */

import { LightningElement, api } from 'lwc';

export default class DatatableNameCell extends LightningElement {
    // Properties specific to this cell type
    @api
    get href() {
        return this._href;
    }
    set href(value = '/') {
        this._href = `/${value}`;
    }
    @api target = '_parent';

    // Required properties for datatable-edit-cell
    @api value; // comes in from datatable as the value of the name field
    @api tableBoundary;
    @api rowKeyAttribute;
    @api rowKeyValue;
    @api isEditable;
    @api objectApiName;
    @api columnName;
    @api fieldApiName;
    @api isCompoundName;
}
