import { LightningElement, api } from 'lwc';

export default class EventPublisher extends LightningElement {
  @api uniqueBoundary;
  @api eventKey;
  @api eventValue;

  // private
  _isRendered;
  _messageService;

  renderedCallback() {
    if (this._isRendered) {
      return;
    }
    this._isRendered = true;
    this._messageService = this.template.querySelector('c-message-service');
    if (this.eventKey) {
      this._messageService.publish({ key: this.eventKey, value: this.eventValue });
    }
  }
}
