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
    handleLwcToAuraEvent: function(component, event, helper) {
        let eventService = component.find('eventService');
        let payload = event.getParam('finalPayload');

        console.log(JSON.parse(JSON.stringify(payload)));

        switch (payload.type) {
            case 'refreshView':
                if (component.get('v.allowRecursion')) {
                    component.set('v.allowRecursion', false);
                    // Refresh for both, attempt to "Unify"
                    component.find('eventBroker').brokerMessageToLWC({ key: 'forceRefreshView' });
                    $A.get('e.force:refreshView').fire();
                }
                // This must remain outside the lifecycle check above
                window.setTimeout(
                    $A.getCallback(function() {
                        component.set('v.allowRecursion', true);
                    }),
                    500
                );
                break;
            case 'appEvent':
                eventService.fireAppEvent(payload.key, payload.value);
                break;
            case 'recordEvent':
                // Re-configure the recordId on this component if overridden by message broker
                if (payload.recordId) {
                    component.set('v.recordId', payload.recordId);
                }
                eventService.fireRecordEvent(payload.key, payload.value);
                break;
            case 'notifyClose':
                // Close from the promise directly since from LWC the notifyClose() doesn"t seem to work, even on the source overlayLib
                let overlayPromise = component.find('dialogService').get('v.overlayPromise');
                overlayPromise.close();
                break;
            default:
        }
    },
    handleForceRefreshViewForLWC: function(component, event, helper) {
        if (component.get('v.allowRecursion')) {
            component.set('v.allowRecursion', false);
            // Refresh for both, attempt to "Unify"
            component.find('eventBroker').brokerMessageToLWC({ key: 'forceRefreshView' });
            $A.get('e.force:refreshView').fire();
        }
        // This must remain outside the lifecycle check above
        window.setTimeout(
            $A.getCallback(function() {
                component.set('v.allowRecursion', true);
            }),
            500
        );
    },
    handleRecordEventToLWC: function(component, event, helper) {
        event.stopPropagation();
        let params = event.getParams();

        console.log(JSON.parse(JSON.stringify(params)));

        if (params.recordEventScopeId !== component.get('v.recordId')) {
            return;
        }

        switch (params.recordEventKey) {
            // Allowed list of record events which can pass through to LWC
            case 'ACCOUNT_SELECTED':
                //component.find("eventBroker").brokerMessageToLWC({key: params.recordEventKey, value: params.recordEventValue});
                break;
        }
    },
    handleAppEventToLWC: function(component, event, helper) {
        event.stopPropagation();
        let params = event.getParams();

        console.log(JSON.parse(JSON.stringify(params)));

        switch (params.appEventKey) {
            // Allowed list of app events which can pass through to LWC
            case 'ACCOUNT_SELECTED':
                //component.find("eventBroker").brokerMessageToLWC({key: params.appEventKey, value: params.appEventValue});
                break;
        }
    }
});
