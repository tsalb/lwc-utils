/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, james@sparkworks.io
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
  messageService: function (component) {
    return component.find('messageService');
  },
  dialogService: function (component) {
    return component.find('dialogService');
  },
  workspaceService: function (component) {
    return component.find('workspaceService');
  },
  singleton: function (component) {
    return component.find('singleton');
  },
  executeDialogService: function (component, payload) {
    let flowModalConfig;
    if (payload.method.startsWith('flow')) {
      flowModalConfig = {
        auraId: 'flow-wizard-container',
        headerLabel: payload.config.flowHeaderLabel,
        component: 'c:FlowWrapper',
        componentParams: {
          flowApiName: payload.config.componentParams.flowApiName,
          inputVariables: payload.config.componentParams.inputVariables
        }
      };
    }
    switch (payload.method) {
      case 'modal':
        this.modal(component, payload.config);
        break;
      case 'bodyModal':
        this.bodyModal(component, payload.config);
        break;
      case 'bodyModalLarge':
        this.bodyModalLarge(component, payload.config);
        break;
      case 'flow':
        this.bodyModal(component, flowModalConfig);
        break;
      case 'flowLarge':
        this.bodyModalLarge(component, flowModalConfig);
        break;
      default:
      // nothing
    }
  },
  modal: function (component, config) {
    this.dialogService(component).modal(
      config.auraId,
      config.headerLabel,
      config.component,
      config.componentParams,
      config.mainActionReference, // mainActionReference only works for aura components
      config.mainActionLabel
    );
  },
  bodyModal: function (component, config) {
    this.dialogService(component).bodyModal(
      config.auraId,
      config.headerLabel,
      config.component,
      config.componentParams
    );
  },
  bodyModalLarge: function (component, config) {
    this.dialogService(component).bodyModalLarge(
      config.auraId,
      config.headerLabel,
      config.component,
      config.componentParams
    );
  },
  executeWorkspaceApi: function (component, payload) {
    switch (payload.method) {
      case 'openTab':
        this.workspaceService(component).openTab(payload.config);
        break;
      case 'openSubtab':
        this.workspaceService(component).openSubtab(payload.config);
        break;
      case 'closeTabByTitle':
        this.workspaceService(component).closeTabByTitle(payload.config);
        break;
      default:
      // nothing
    }
  },
  fireRecordEdit: function (component, payload) {
    $A.get('e.force:editRecord').setParams({ recordId: payload.recordId }).fire();
    this.singleton(component).setIsMessaging(false);
  },
  fireRecordCreate: function (component, payload) {
    $A.get('e.force:createRecord')
      .setParams({
        entityApiName: payload.entityApiName,
        recordTypeId: payload.recordTypeId,
        defaultFieldValues: payload.defaultFieldValues
      })
      .fire();
    this.singleton(component).setIsMessaging(false);
  }
});
