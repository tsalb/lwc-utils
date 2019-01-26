({
  subscribe : function(component, event) {
    let empApi = component.find("empApi");
    let channel = component.get("v.channel");
    let replayId = component.get("v.replayIdStream"); // Specify -1 to get new events from the tip of the stream, -2 to replay from the last saved event
    let isDebug = component.get("v.setDebugFlag");

    // Callback function to be passed in the subscribe call.
    // After an event is received, this callback prints the event
    // payload to the console.
    let callback = function (message) {
      if (isDebug) {
        console.log("Received [" + message.channel + " : " + message.data.event.replayId + "] payload=" + JSON.stringify(message.data.payload));
      }
      component.getEvent("onMessage")
        .setParams({ payload: message.data.payload })
        .fire();
    }.bind(this);

    // Error handler function that prints the error to the console.
    let errorHandler = function (message) {
      if (isDebug) {
        console.log("Received error ", message);
      }
    }.bind(this);

    // Register error listener and pass in the error handler function.
    empApi.onError(errorHandler);

    empApi.subscribe(channel, replayId, callback).then(function(sub) {
      component.set("v.sub", sub);
    });
  },
  unsubscribe : function(component, event) {
    let empApi = component.find("empApi");
    let channel = component.get("v.channel");
    let isDebug = component.get("v.setDebugFlag");

    // Callback function to be passed in the subscribe call.
    let callback = function (message) {
      if (isDebug) {
        console.log("Unsubscribed from channel " + channel);
      }
    }.bind(this);

    // Error handler function that prints the error to the console.
    let errorHandler = function (message) {
      if (isDebug) {
        console.log("Received error ", message);
      }
    }.bind(this);

   // Object that contains subscription attributes used to
   // unsubscribe.
    let sub = {
      "id": component.get("v.sub")["id"],
      "channel": component.get("v.sub")["channel"]
    };

    // Register error listener and pass in the error handler function.
    empApi.onError(errorHandler);

    // Unsubscribe from the channel using the sub object.
    empApi.unsubscribe(sub, callback);
  }
})