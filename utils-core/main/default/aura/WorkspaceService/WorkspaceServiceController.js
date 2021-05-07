/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2021, james@sparkworks.io
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * - Neither the name of the copyright holder nor the names of its
 *   contributors may be used to endorse or promote products derived from
 *   this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

({
  handleOpenTab: function (component, event, helper) {
    const params = event.getParam('arguments');
    const messageService = helper.messageService(component);
    const singleton = helper.singleton(component);
    const workspace = helper.workspaceApi(component);

    workspace
      .openTab(params.config)
      .then(tabId => {
        const successPayload = {
          tabId: tabId
        };
        messageService.publish({ key: 'opentabresolve', value: successPayload });
      })
      .catch(err => {
        console.error(err);
        const errorPayload = {
          error: err
        };
        messageService.publish({ key: 'opentabresolve', value: errorPayload });
      });

    singleton.setIsMessaging(false);
  },
  handleOpenSubtab: function (component, event, helper) {
    const params = event.getParam('arguments');
    const messageService = helper.messageService(component);
    const singleton = helper.singleton(component);
    const workspace = helper.workspaceApi(component);

    // Try to open subtab from current tab
    if (!params.config.parentTabId) {
      workspace.getEnclosingTabId().then(result => {
        params.config.parentTabId = result;
      });
    }
    workspace
      .openSubtab(params.config)
      .then(tabId => {
        const successPayload = {
          tabId: tabId
        };
        messageService.publish({ key: 'opensubtabresolve', value: successPayload });
      })
      .catch(err => {
        console.error(err);
        const errorPayload = {
          error: err
        };
        messageService.publish({ key: 'opensubtabresolve', value: errorPayload });
      });

    singleton.setIsMessaging(false);
  },
  handleCloseTabByTitle: function (component, event, helper) {
    const params = event.getParam('arguments');
    const singleton = helper.singleton(component);
    const workspace = helper.workspaceApi(component);

    workspace.getAllTabInfo().then(allTabInfo => {
      for (let tab of allTabInfo) {
        if (tab.title === params.config.title) {
          workspace.closeTab({ tabId: tab.tabId });
        }
      }
    });
    singleton.setIsMessaging(false);
  }
});
