import { LightningElement, track, api } from 'lwc';
import { DateTime } from 'c/luxon';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

// Known templates
import { default as dateParserMenu } from './templates/dateParserMenu.html';
import { default as defaultTemplate } from './templates/default.html';

export default class FlowWizardRouter extends LightningElement {
    @api templateName;
    @api templateStep;
    @api
    get flowCacheJSON() {
        return JSON.stringify(this.flowCache);
    }
    set flowCacheJSON(value) {
        this.flowCache = JSON.parse(value);
    }

    @track flowCache = {};

    // private
    _isRendered;

    render() {
        switch (this.templateName) {
            case 'dateParserMenu':
                return dateParserMenu;
            default:
                return defaultTemplate;
        }
    }

    renderedCallback() {
        if (!this._isRendered) {
            this._isRendered = true;

            if (this.isDateParserOne) {
                this.flowCache.localTime = DateTime.local().toISO();
                this.flowCache.options = [
                    { label: 'Years', value: 'years' },
                    { label: 'Months', value: 'months' },
                    { label: 'Days', value: 'days' }
                ];
            }

            // Currently, there is some odd behavior with using PREVIOUS and this,
            // So for now, we only move forward after messing with the cache
            if (this.isDateParserTwo) {
                const cfg = { [this.flowCache.luxonMode]: this.flowCache.luxonNumber };
                this.flowCache.calculatedDateTime = DateTime.local()
                    .plus(cfg)
                    .toISO();
            }
        }
    }

    // Date Parser
    get isDateParser() {
        return this.templateName === 'dateParserMenu';
    }

    get isDateParserOne() {
        return this.isDateParser && this.templateStep === 1;
    }

    get isDateParserTwo() {
        return this.isDateParser && this.templateStep === 2;
    }

    numberChanged(evt) {
        this.flowCache.luxonNumber = Number(evt.detail.value);
        this.notifyFlow();
    }

    modeChanged(evt) {
        this.flowCache.luxonMode = evt.detail.value;
        this.notifyFlow();
    }

    notifyFlow() {
        // The prop name needs to be the LWC one, not the variable name in flow itself
        // Also, manual variable assignment MUST be used for this to persist across screens
        this.dispatchEvent(new FlowAttributeChangeEvent('flowCacheJSON', JSON.stringify(this.flowCache)));
    }
}
