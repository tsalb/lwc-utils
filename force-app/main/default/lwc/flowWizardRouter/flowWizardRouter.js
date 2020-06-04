import { LightningElement, api } from 'lwc';
import { DateTime } from 'c/luxon';
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

    flowCache = {};

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
            let newProps = {};

            if (this.isDateParserOne) {
                newProps = {
                    localTime: DateTime.local().toISO(),
                    options: [
                        { label: 'Years', value: 'years' },
                        { label: 'Months', value: 'months' },
                        { label: 'Days', value: 'days' }
                    ]
                };
            }

            // Currently, there is some odd behavior with using PREVIOUS and this,
            // So for now, we only move forward after messing with the cache
            if (this.isDateParserTwo) {
                const cfg = { [this.flowCache.luxonMode]: this.flowCache.luxonNumber };
                newProps = {
                    calculatedDateTime: DateTime.local()
                        .plus(cfg)
                        .toISO()
                };
            }

            // Assemble it back and trigger the property render cycle
            this.flowCache = { ...this.flowCache, ...newProps };
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
    }

    modeChanged(evt) {
        this.flowCache.luxonMode = evt.detail.value;
    }
}
