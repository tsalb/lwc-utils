({
  handleCacheChange : function(component, event, helper) {
    let payload = event.getParams();
    console.log(JSON.parse(payload.flowCacheJson));
    component.set("v.flowCacheJSON", payload.flowCacheJson); // payload is lowercase due to LWC conventions
  }
})