import { LightningElement, api } from 'lwc';

export default class DialogAutoCloser extends LightningElement {
    @api messageTemplate = 'Auto closing in {timer} seconds';
    @api timer = 5;

    progress = 100;

    // private
    _originalTemplate;
    _originalTimer;
    _isRendered;
    _progressInterval;
    _timerInterval;

    connectedCallback() {
        this._originalTemplate = this.messageTemplate;
        this._originalTimer = this.timer;
        this.messageTemplate = this.messageTemplate.replace('{timer}', this.timer);
    }

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._startProgressInterval();
        this._startTimerInterval();
    }

    disconnectedCallback() {
        clearInterval(this._progressInterval);
        clearInterval(this._timerInterval);
    }

    _startProgressInterval() {
        this._progressInterval = setInterval(() => {
            if (this.timer === 0 || !this._timerInterval) {
                this._close();
            }
            // prettier-ignore
            this.progress = this.progress - (10 / this._originalTimer);
        }, 100); // 10 ticks per second gives a "smoother" bar
    }

    _startTimerInterval() {
        this._timerInterval = setInterval(() => {
            if (this.timer === 0 || !this._progressInterval) {
                this._close();
            }
            this.timer = this.timer - 1;
            this.messageTemplate = this._originalTemplate.slice().replace('{timer}', this.timer);
        }, 1000);
    }

    _close() {
        clearInterval(this._progressInterval);
        clearInterval(this._timerInterval);
        this.template.querySelector('c-message-service').notifyClose();
    }
}
