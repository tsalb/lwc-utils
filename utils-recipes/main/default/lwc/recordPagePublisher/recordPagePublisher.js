import { LightningElement, api } from 'lwc';

export default class RecordPagePublisher extends LightningElement {
  @api recordId;

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  handleIncrementPub() {
    this.messageService.publish({ key: 'incrementfrompub' });
  }
}
