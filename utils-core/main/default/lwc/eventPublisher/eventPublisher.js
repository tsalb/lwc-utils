import { LightningElement, api } from 'lwc';

export default class EventPublisher extends LightningElement {
  @api uniqueBoundary;
  @api eventKey;
  @api eventValue;

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  // private
  _isRendered;

  renderedCallback() {
    if (this._isRendered) {
      return;
    }
    this._isRendered = true;
    if (this.eventKey) {
      this.messageService.publish({ key: this.eventKey, value: this.eventValue });
    }
  }
}
