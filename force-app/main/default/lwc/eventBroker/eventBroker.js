import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { publish, MessageContext } from 'lightning/messageService';
import OPEN_CHANNEL from "@salesforce/messageChannel/OpenChannel__c";

export default class EventBroker extends LightningElement {
  @api scopedId;
  @wire(CurrentPageReference) pageRef;
  @wire(MessageContext) messageContext;

  /* Utilities */
  @api
  getPageRef() {
    return this.pageRef;
  }

  /* Aura broker to LWC */
  @api
  brokerMessageToLWC(payload) {
    publish(this.messageContext, OPEN_CHANNEL, { key: payload.key, value: payload.value });
  }

  /* LWC broker to Aura */
  @api
  forceRefreshView() {
    const finalPayload = {
      type: 'refreshView'
    }
    this._brokerEventToAura(finalPayload);
  }
  @api
  fireAppEvent(payload) {
    const finalPayload = {
      type: 'appEvent',
      key: payload.key,
      value: payload.value
    }
    this._brokerEventToAura(finalPayload);
  }
  @api
  fireRecordEvent(payload) {
    const finalPayload = {
      type: 'recordEvent',
      key: payload.key,
      value: payload.value,
      recordId: payload.recordId // if provided, overrides recordId on GC_MessageBrokerHandler_LwcWrapper
    }
    this._brokerEventToAura(finalPayload);
  }

  // PRIVATE
  _brokerEventToAura(finalPayload) {
    const boundary = { scopedId: this.scopedId };
    publish(this.messageContext, OPEN_CHANNEL, { key: 'brokerEventToAura', value: { ...finalPayload, ...boundary } });
  }
}