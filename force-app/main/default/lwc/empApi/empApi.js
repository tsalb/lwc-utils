import { LightningElement, api } from 'lwc';
import { subscribe, unsubscribe, onError, isEmpEnabled } from 'lightning/empApi';

export default class EmpApi extends LightningElement {
  @api channel;

  // Use this manually control when to connect.
  // Using this as a service component in any LWC template has 
  // odd behavior if this renders first (Child to parent initialization)
  @api
  get connect() {
    return this._connect;
  }
  set connect(value) {
    this._connect = value;
    if (this._connect && isEmpEnabled && this.channel) {
      this.subscribe();
    }
  }

  // private
  _connect;
  _subscription = {};

  disconnectedCallback() {
    if (isEmpEnabled) {
      this.unsubscribe();
    }
  }

  // Handles subscribe button click
  subscribe() {
    // Callback invoked whenever a new event message is received
    const messageCallback = (response) => {
      // Response contains the payload of the new message received
      this.notifyMessage(response);
    };
    // Invoke subscribe method of empApi. Pass reference to messageCallback
    subscribe(this.channel, -1, messageCallback).then(response => {
      // Response contains the subscription information on successful subscribe call
      console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
      this._subscription = response;
    });
  }

  // Handles unsubscribe button click
  unsubscribe() {
    // Invoke unsubscribe method of empApi
    unsubscribe(this._subscription, response => {
      console.log('unsubscribe() response: ', JSON.stringify(response));
      // Response is true for successful unsubscribe
    });
  }

  registerErrorListener() {
    // Invoke onError empApi method
    onError(error => {
      console.log('Received error from server: ', JSON.stringify(error));
      // Error contains the server-side error
    });
  }

  notifyMessage(response) {
    // Standardize it like the rest of salesforce
    this.dispatchEvent(
      new CustomEvent('message', {
        detail: {
          payload: response.data.payload,
          channel: response.channel
        }
      })
    );
  }

}