({
  dispatchAction : function(component, action, params) {
    let _self = this;
    action.setCallback(this, function(response) {
      if (response.getState() === "SUCCESS") {
        let resp = response.getReturnValue();
        _self.flattenQueryResult(resp.tableData)
          .then($A.getCallback((result) => {
            let fullResp = {
              tableData: result,
              tableColumns: resp.tableColumns
            }
            params.callback(null, fullResp);
          }))
          .catch((error) => {
            params.callback(error);
          });
      } else {
        params.callback(response.getError());
      }
    });
    $A.enqueueAction(action);
  },
  flattenQueryResult : function(listOfObjects) {
    let _self = this;
    return new Promise($A.getCallback((resolve, reject) => {
      if ($A.util.isEmpty(listOfObjects)) {
        resolve(new Array());
      } else {
        for (let i = 0; i < listOfObjects.length; i++) {
          let obj = listOfObjects[i];
          for(let prop in obj) {
            if (!obj.hasOwnProperty(prop)) {
              continue;
            }
            if (typeof obj[prop] == 'object' && typeof obj[prop] != 'Array') {
              obj = Object.assign(obj, _self.flattenObject(prop,obj[prop]));
            } else if (typeof obj[prop] == 'Array') {
              for(let j = 0; j < obj[prop].length; j++) {
                obj[prop+'_'+j] = Object.assign(obj, _self.flattenObject(prop,obj[prop]));
              }
            }
          }
        }
        resolve(listOfObjects);
      }
    }));
  },
  flattenObject : function(propName, obj) {
    let _self = this;
    let flatObject = [];
    for (let prop in obj) {
      //if this property is an object, we need to flatten again
      let propIsNumber = isNaN(propName);
      let preAppend = propIsNumber ? propName+'_' : '';

      if (typeof obj[prop] == 'object') {
        flatObject[preAppend+prop] = Object.assign(flatObject, _self.flattenObject(preAppend+prop,obj[prop]));
      } else {
        flatObject[preAppend+prop] = obj[prop];
      }
    }
    return flatObject;
  },
})