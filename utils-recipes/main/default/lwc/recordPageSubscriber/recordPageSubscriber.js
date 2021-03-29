import { LightningElement, api } from 'lwc';

export default class RecordPageSubscriber extends LightningElement {
  @api recordId;

  currentCount = 0;

  handleIncrementSub() {
    // no event
    this.currentCount += 1;
  }
}
