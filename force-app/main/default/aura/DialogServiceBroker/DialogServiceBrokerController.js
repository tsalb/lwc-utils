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
    handleDialogService: function(component, event, helper) {
        let payload = event.getParam('payload');
        let config = payload.config;
        let flowModalConfig;

        if (payload.method.startsWith('flow')) {
            flowModalConfig = {
                auraId: 'flow-wizard-container',
                headerLabel: config.flowHeaderLabel,
                component: 'c:FlowWrapper',
                componentParams: {
                    flowApiName: config.componentParams.flowApiName,
                    inputVariables: config.componentParams.inputVariables
                }
            };
        }
        switch (payload.method) {
            case 'bodyModal':
                helper.bodyModal(component, config);
                break;
            case 'bodyModalLarge':
                helper.bodyModalLarge(component, config);
                break;
            case 'flow':
                helper.bodyModal(component, flowModalConfig);
                break;
            case 'flowLarge':
                helper.bodyModalLarge(component, flowModalConfig);
                break;
            default:
            // nothing
        }
    },
    handleNotifyClose: function(component, event, helper) {
        helper
            .dialogService(component)
            .get('v.overlayPromise')
            .close();
    }
});
