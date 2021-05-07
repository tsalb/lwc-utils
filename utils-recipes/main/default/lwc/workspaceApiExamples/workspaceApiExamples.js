import { LightningElement } from 'lwc';
import { fetchTableCache } from 'c/tableService';
import { NavigationMixin } from 'lightning/navigation';

export default class WorkspaceApiExamples extends NavigationMixin(LightningElement) {
  // private
  _firstAccountId;
  _firstContactId;
  _firstContactAccountId;

  // for workspace service "callbacks"
  _tabId;

  isInputEmpty = true;

  get messageService() {
    return this.template.querySelector('c-message-service');
  }

  get tabTitleInput() {
    return this.template.querySelector('.tab-title-input');
  }

  get isAccountIdNull() {
    return !this._firstAccountId;
  }

  get isContactIdNull() {
    return !this._firstContactId;
  }

  async connectedCallback() {
    const accData = await fetchTableCache({
      queryString: `SELECT Id FROM Account ORDER BY Id ASC LIMIT 1`
    });
    const conData = await fetchTableCache({
      queryString: `SELECT Id, AccountId FROM Contact ORDER BY Id DESC LIMIT 1`
    });
    if (accData?.tableData?.length) {
      this._firstAccountId = accData.tableData[0].Id;
    }
    if (conData?.tableData?.length) {
      this._firstContactId = conData.tableData[0].Id;
      this._firstContactAccountId = conData.tableData[0].AccountId;
    }
  }

  // event handlers

  handleOpenAccount() {
    const workspaceApiPayload = {
      method: 'openTab',
      config: {
        focus: false,
        recordId: this._firstAccountId
      }
    };
    // Since this uses Lightning Message Channel, it's not possible to get a callback through LMS directly
    this.messageService.workspaceApi(workspaceApiPayload);

    // However, we can do something tricky like this:

    // eslint-disable-next-line @lwc/lwc/no-async-operation
    let checkTabIdInterval = setInterval(checkTabId.bind(this), 500);

    // Don't use fat arrow, avoids no-use-before-define eslint error
    function checkTabId() {
      if (this._tabId) {
        clearInterval(checkTabIdInterval);
        // only to illustrate that this can come via LMS event from message-service on template
        console.log(this._tabId);
        // clear it out for the next usage
        this._tabId = null;
      }
    }
  }

  async handleOpenContact() {
    // Since callbacks aren't easy, this makes multi-step operations challenging from LWC
    const parentTabPayload = {
      method: 'openTab',
      config: {
        focus: false,
        recordId: this._firstContactAccountId
      }
    };
    this.messageService.workspaceApi(parentTabPayload);

    // eslint-disable-next-line @lwc/lwc/no-async-operation
    let checkTabIdInterval = setInterval(checkTabId.bind(this), 500);

    // Don't use fat arrow, avoids no-use-before-define eslint error
    function checkTabId() {
      if (this._tabId) {
        clearInterval(checkTabIdInterval);
        const subTabPayload = {
          method: 'openSubtab',
          config: {
            focus: true,
            parentTabId: this._tabId,
            recordId: this._firstContactId
          }
        };
        this.messageService.workspaceApi(subTabPayload);
        this._tabId = null;
      }
    }
  }

  handleOpenTabResolve(event) {
    const payload = event.detail.value;
    if (payload.error) {
      console.error(payload.error);
    } else if (payload.tabId) {
      this._tabId = payload.tabId;
    }
  }

  handleOpenSubtabResolve(event) {
    const payload = event.detail.value;
    if (payload.error) {
      console.error(payload.error);
    } else if (payload.tabId) {
      console.log(payload.tabId);
    }
  }

  handleInputChange(event) {
    this.isInputEmpty = !event.detail.value;
  }

  handleCloseTab() {
    const workspaceApiPayload = {
      method: 'closeTabByTitle',
      config: {
        title: this.tabTitleInput.value
      }
    };
    this.messageService.workspaceApi(workspaceApiPayload);
  }
}
