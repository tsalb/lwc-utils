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
  doInit: function (component, event, helper) {
    const customBoundary = component.get('v.customBoundary');
    if (!!customBoundary) {
      const messageService = helper.messageService(component);
      const recordId = component.get('v.recordId');
      const isRecordIdRequested = customBoundary === '$recordId';
      // When recordId context is not available but was requested, leave messageService to its defaults
      if (!recordId && isRecordIdRequested) {
        return;
      }
      const finalBoundary = recordId && isRecordIdRequested ? recordId : customBoundary;
      messageService.set('v.useRecordIdAsBoundary', recordId && isRecordIdRequested);
      messageService.set('v.boundary', finalBoundary);
    }
  },
  handleDialogService: function (component, event, helper) {
    const payload = event.getParam('value');
    const singleton = helper.singleton(component);

    if (singleton.getIsCreatingModal()) {
      return;
    }
    // DialogServiceHelper.js will turn this off
    singleton.setIsCreatingModal(true);

    helper.executeDialogService(component, payload);
  },
  handleWorkspaceApi: function (component, event, helper) {
    const payload = event.getParam('value');
    const singleton = helper.singleton(component);

    if (singleton.getIsMessaging()) {
      return;
    }
    singleton.setIsMessaging(true);

    helper.executeWorkspaceApi(component, payload);
  },
  handleRecordEdit: function (component, event, helper) {
    const payload = event.getParam('value');
    const singleton = helper.singleton(component);

    if (singleton.getIsMessaging()) {
      return;
    }
    singleton.setIsMessaging(true);

    helper.fireRecordEdit(component, payload);
  },
  handleRecordCreate: function (component, event, helper) {
    const payload = event.getParam('value');
    const singleton = helper.singleton(component);

    if (singleton.getIsMessaging()) {
      return;
    }
    singleton.setIsMessaging(true);

    helper.fireRecordCreate(component, payload);
  }
});
