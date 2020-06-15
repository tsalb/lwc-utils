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
    @api
    get href() {
        return this._href;
    }
    set href(value = '/') {
        this._href = `/${value}`;
    }
    @api value; // comes in from datatable as the value of the name field
    @api target = '_parent';
}
