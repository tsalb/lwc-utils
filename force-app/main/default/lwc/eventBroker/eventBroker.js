import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';

export default class EventBroker extends LightningElement {
  @wire(CurrentPageReference) pageRef;

  /* Utilities */
  @api
  getPageRef() {
    return this.pageRef;
  }

  /* Aura broker to LWC */
  @api
  brokerMessageToLWC(payload) {
    fireEvent(this.pageRef, payload.key, payload.value);
  }

  /* LWC broker to Aura */
  @api
  forceRefreshView() {
    const finalPayload = {
      type: 'refreshView'
    }
    this._brokerMessageToAura(finalPayload);
  }
  @api
  fireAppEvent(payload) {
    const finalPayload = {
      type: 'appEvent',
      key: payload.key,
      value: payload.value
    }
    this._brokerMessageToAura(finalPayload);
  }
  @api
  fireRecordEvent(payload) {
    const finalPayload = {
      type: 'recordEvent',
      key: payload.key,
      value: payload.value,
      recordId: payload.recordId // if provided, overrides recordId on GC_MessageBrokerHandler_LwcWrapper
    }
    this._brokerMessageToAura(finalPayload);
  }

  // PRIVATE
  _brokerMessageToAura(finalPayload) {
    //console.log(JSON.parse(JSON.stringify(finalPayload)));
    fireEvent(this.pageRef, 'brokerMessageToAuraEventService', finalPayload);
  }
}