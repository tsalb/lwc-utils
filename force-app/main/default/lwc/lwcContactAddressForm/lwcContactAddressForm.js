import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LwcContactAddressForm extends LightningElement {
    @api boundary;
    @api contact;

    handleSuccess() {
        const messageService = this.template.querySelector('c-message-service');
        this.dispatchEvent(
            new ShowToastEvent({
                title: null,
                message: 'Updated Mailing Address Successfully.',
                variant: 'success'
            })
        );
        messageService.publish({ key: 'refreshcontacts' });
        messageService.notifyClose();
    }
}
