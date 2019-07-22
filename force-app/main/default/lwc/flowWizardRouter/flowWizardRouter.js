import { LightningElement, api, track } from 'lwc';
import { DateTime } from 'c/luxon';

// Known templates
import { default as dateParserMenu } from './templates/dateParserMenu.html';

export default class FlowWizardRouter extends LightningElement {
  @api wizardTemplate;
  @api screenName;
  @api recordId;
  @api flowCacheJson;

  // Non tracked
  @track localTime;
  @track utcTime;

  connectedCallback() {
    this.localTime = DateTime.local().toISO();
  }

  render() { 
    switch (this.wizardTemplate) {
      case 'dateParserMenu':
        return dateParserMenu;
      default:
        return null;
    }
  }

  @api
  notifyCacheChange() {
    window.clearTimeout(this.notifyDelayTimeout);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.notifyDelayTimeout = setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('cachechange', {
          detail: {
            flowCacheJson: this.flowCacheJson
          }
        })
      );
    }, 350);
  }
}