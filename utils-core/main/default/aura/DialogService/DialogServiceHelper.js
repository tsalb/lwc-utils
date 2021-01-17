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
  overlayLib: function (component) {
    return component.find('overlayLib');
  },
  notificationsLib: function (component) {
    return component.find('notificationsLib');
  },
  messageService: function (component) {
    return component.find('messageService');
  },
  createBody: function (component, params, ctrlCallback) {
    let componentType = params.body.split(':')[0];
    let componentParams = {};
    let singleton = component.find('singleton');

    // if we had some bodyParams, let's set the target modal body with their data
    if (!$A.util.isEmpty(params.bodyParams)) {
      Object.keys(params.bodyParams).forEach((v, i, a) => {
        componentParams[v] = params.bodyParams[v];
      });
    }
    switch (componentType) {
      case 'c': //custom component
        $A.createComponent(params.body, componentParams, (newModalBody, status, errorMessage) => {
          singleton.setIsCreatingModal(false);
          if (status === 'SUCCESS') {
            ctrlCallback(null, newModalBody);
          } else {
            ctrlCallback(errorMessage);
          }
        });
        break;
      default:
        $A.createComponent(
          'lightning:formattedText',
          {
            value: params.body,
            class: 'slds-align_absolute-center'
          },
          (formattedText, status, errorMessage) => {
            singleton.setIsCreatingModal(false);
            if (status === 'SUCCESS') {
              ctrlCallback(null, formattedText);
            } else {
              ctrlCallback(errorMessage);
            }
          }
        );
    }
  },
  createButton: function (params, ctrlCallback) {
    $A.createComponent(
      'lightning:button',
      {
        'aura:id': params.auraId + '-main-action',
        label: params.mainActionLabel,
        onclick: params.mainActionReference,
        variant: 'brand'
      },
      (newButton, status, errorMessage) => {
        if (status === 'SUCCESS') {
          ctrlCallback(null, newButton);
        } else {
          ctrlCallback(errorMessage);
        }
      }
    );
  },
  createEventFooter: function (ctrlCallback) {
    $A.createComponent('c:EventFooter', {}, (eventFooter, status, errorMessage) => {
      if (status === 'SUCCESS') {
        ctrlCallback(null, eventFooter);
      } else {
        ctrlCallback(errorMessage);
      }
    });
  },
  defineLargeModalAttribute: function (isLargeModalVal) {
    if ($A.util.isUndefinedOrNull(isLargeModalVal)) {
      return null;
    }
    if (!$A.util.getBooleanValue(isLargeModalVal)) {
      return null;
    }
    if ($A.util.getBooleanValue(isLargeModalVal)) {
      return 'slds-modal_large';
    }
  },
  defineShowCLoseButtonAttribute: function (showCloseButtonBooleanVal) {
    if ($A.util.isUndefinedOrNull(showCloseButtonBooleanVal)) {
      return true;
    }
    if (!$A.util.getBooleanValue(showCloseButtonBooleanVal)) {
      return false;
    }
    if ($A.util.getBooleanValue(showCloseButtonBooleanVal)) {
      return true;
    }
  }
});
