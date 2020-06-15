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
    doInit: function(component, event, helper) {
        component.set('v.isEmpApiConnected', true);
    },
    handleContactDmlEvent: function(component, event, helper) {
        let params = event.getParams();
        console.log(params.channel);
        component.set('v.payloadJSON', JSON.stringify(params.payload));
        component.set('v.showSection', true);
    },
    handleOpenPopover: function(component, event, helper) {
        let popover = component.get('v.popover');
        let timer = component.get('v.timer');
        window.clearTimeout(timer);
        if (!popover) {
            timer = window.setTimeout(
                $A.getCallback(() => {
                    helper.dialogService(component).showPopover(
                        'c:PopoverBody',
                        {
                            value: component.get('v.payloadJSON')
                        },
                        '.platform-event-span',
                        'cPlatformEventListener,slds-popover_large,popoverclass,slds-nubbin_left',
                        $A.getCallback(result => {
                            component.find('eventService').fireAppEvent('SET_ABORT_CLOSE', false);
                            component.set('v.popover', result.popover);
                        })
                    );
                }),
                350
            );
        }
        component.set('v.timer', timer);
    },
    handleClosePopover: function(component, event, helper) {
        let timer = component.get('v.timer');
        window.clearTimeout(timer);
        timer = window.setTimeout(
            $A.getCallback(() => {
                if (!component.get('v.abortClose')) {
                    component.get('v.popover').close();
                    component.set('v.popover', null);
                }
            }),
            500
        );
        component.set('v.timer', timer);
    },
    handleApplicationEvent: function(component, event, helper) {
        let params = event.getParams();
        switch (params.appEventKey) {
            case 'SET_ABORT_CLOSE':
                let value = $A.util.getBooleanValue(params.appEventValue);
                component.set('v.abortClose', value);
                break;
            case 'CLOSE_POPOVER':
                component.get('v.popover').close();
                component.set('v.popover', null);
                break;
        }
    }
});
