/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2019, james@sparkworks.io
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
    dialogService: function(component) {
        return component.find('dialogService');
    },
    initializeLightningDataService: function(component, event) {
        return new Promise(
            $A.getCallback((resolve, reject) => {
                let params = event.getParam('arguments');
                let fieldApiNameToUpdateValueMap = new Map();
                let recordId = params.configObject['recordId'];
                let fieldUpdates = params.configObject['fieldUpdates'];

                if (!$A.util.isEmpty(fieldUpdates)) {
                    Object.keys(fieldUpdates).forEach(function(v, i, a) {
                        fieldApiNameToUpdateValueMap.set(v, fieldUpdates[v]);
                    });
                }

                component.set('v.recordId', recordId);
                component.set('v.fieldApiNameToUpdateValueMap', fieldApiNameToUpdateValueMap);
                component.set('v.fields', Array.from(fieldApiNameToUpdateValueMap.keys()));

                // init using aura:if
                component.set('v.transactionInProgress', true);

                // pass the callback down the chain
                resolve(params.callback);
            })
        );
    },
    pollCheckWhenFullyLoaded: function(component, event, callback) {
        let _self = this;
        if ($A.util.getBooleanValue(component.get('v.lightningDataServiceLoaded'))) {
            _self.updateWithLightningDataService(component, event, callback);
        } else {
            window.setTimeout(
                $A.getCallback(() => {
                    _self.pollCheckWhenFullyLoaded(component, event, callback);
                }),
                500
            );
        }
    },
    updateWithLightningDataService: function(component, event, callback) {
        let _self = this;
        let fieldApiNameToUpdateValueMap = component.get('v.fieldApiNameToUpdateValueMap');
        let simpleRecord = component.get('v.simpleRecord');

        for (let apiName of fieldApiNameToUpdateValueMap.keys()) {
            let updateValue = fieldApiNameToUpdateValueMap.get(apiName);
            simpleRecord[apiName] = $A.util.isEmpty(updateValue) || updateValue === 'null' ? null : updateValue;
        }
        component.find('lds').saveRecord(
            $A.getCallback(saveResult => {
                callback(saveResult);
            })
        );
    }
});
