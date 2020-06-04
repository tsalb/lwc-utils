({
    handleFireApplicationEvent: function(component, event) {
        let params = event.getParam('arguments');
        let appEvent = $A.get('e.c:ServiceAppEvent');

        appEvent.setParams({
            appEventKey: params.eventKey,
            appEventValue: params.eventValue
        });
        appEvent.fire();
    },
    handleFireRecordEvent: function(component, event) {
        let recordEventScope = component.get('v.recordEventScope');

        if ($A.util.isUndefinedOrNull(recordEventScope)) {
            alert('recordEventScope missing, cannot fire record event!');
        } else {
            let params = event.getParam('arguments');
            let recordEvent = $A.get('e.c:ServiceRecordEvent');

            recordEvent.setParams({
                recordEventKey: params.eventKey,
                recordEventValue: params.eventValue,
                recordEventScope: recordEventScope
            });
            recordEvent.fire();
        }
    },
    handleFireComponentEvent: function(component, event) {
        let params = event.getParam('arguments');
        let compEvent = component.getEvent('ServiceCompEvent');

        compEvent.setParams({
            compEventKey: params.eventKey,
            compEventValue: params.eventValue
        });
        compEvent.fire();
    }
});
