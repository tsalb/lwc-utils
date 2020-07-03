import { LightningElement, api } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class DatatableDeleteRowForm extends LightningElement {
    @api uniqueBoundary;
    @api row;
    showSpinner = false;

    // calculated
    get messageTemplate() {
        return `Are you sure you want to delete "${this.row.Name}"?`;
    }

    // private
    _isRendered;
    _messageService;

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._messageService = this.template.querySelector('c-message-service');
        console.log(JSON.parse(JSON.stringify(this.row)));
    }

    handleCancel() {
        this._messageService.notifyClose();
    }

    async handleConfirm() {
        this.showSpinner = true;
        try {
            await deleteRecord(this.row.Id);
            this._messageService.notifySuccess(`Succesfully Deleted "${this.row.Name}".`);
            this._refreshViewAndClose();
        } catch (error) {
            console.log(error);
            this._messageService.notifySingleError('Error Deleting Row', error);
        } finally {
            this.showSpinner = false;
        }
    }

    _refreshViewAndClose() {
        if (this.uniqueBoundary) {
            this._messageService.publish({ key: 'refreshsoqldatatable' });
        } else {
            this._messageService.forceRefreshView();
        }
        this._messageService.notifyClose();
    }
}
