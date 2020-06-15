import { LightningElement, api } from 'lwc';

// Flow specific imports
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class SoqlDatatable extends LightningElement {
    // Pass through inputs
    @api title;
    @api recordId;
    @api isRecordBind;
    @api showRecordCount;
    @api showRefreshButton;
    @api queryString;
    @api checkboxType;
    @api editableFields;
    @api sortableFields;
    @api sortedBy;
    @api sortedDirection;

    // Pass through outputs for flow
    @api selectedRows;

    handleRowSelection(event) {
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedRows', event.detail.selectedRows));
    }
}
