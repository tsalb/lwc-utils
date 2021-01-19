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
  initUpdatePromiseChain: function (component, event, helper) {
    helper
      .initializeLightningDataService(component, event)
      .then(
        $A.getCallback(callback => {
          return helper.pollCheckWhenFullyLoaded(component, event, callback);
        })
      )
      .catch(error => {
        $A.reportError('Promise Error', error);
        helper.dialogService(component).showToast({
          message: error,
          variant: 'error',
          mode: 'pester'
        });
      });
  },
  handleRecordUpdated: function (component, event, helper) {
    let changeType = event.getParams().changeType;
    switch (changeType.toUpperCase()) {
      case 'ERROR':
        helper.dialogService(component).showToast({
          title: 'Error in LDS',
          message: component.get('v.simpleRecordError'),
          variant: 'error',
          mode: 'pester'
        });
        break;
      case 'LOADED':
        component.set('v.lightningDataServiceLoaded', true);
        break;
      case 'CHANGED':
        // destroy using aura:if
        component.set('v.transactionInProgress', false);
        // clear everything
        component.set('v.fieldUpdates', null);
        component.set('v.fieldApiNameToUpdateValueMap', null);
        component.set('v.recordId', null);
        component.set('v.fields', null);
        component.set('v.simpleRecord', null);
        component.set('v.simpleRecordError', null);
        component.set('v.lightningDataServiceLoaded', false);
        break;
    }
  }
});
