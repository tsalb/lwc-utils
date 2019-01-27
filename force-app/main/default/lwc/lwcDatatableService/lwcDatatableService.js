import { LightningElement, api, track, wire } from 'lwc';
import wireTableCache from '@salesforce/apex/DataTableService.wireTableCache';

export default class LwcDatatableService extends LightningElement {
  @api 
  get requestConfig() {
    return this.request;
  }
  set requestConfig(value) {
    // @wire can't tell a difference in change if the object isn't stringified?
    this.request = JSON.stringify(value);
    // For example the below wouldn't trigger a real change, we are stuck with a cached response
    //this.request = value
  }
  
  @track request;

  @wire(wireTableCache, { tableRequest: '$request' })
  wiredCache({ error, data }) {
    if (data) {
      let response = {
        tableData: this.flattenQueryResult(data.tableData),
        tableColumns: data.tableColumns
      }
      this.dispatchEvent(
        new CustomEvent('success', {detail: response})
      );
    } else if (error) {
      this.dispatchEvent(
        new CustomEvent('error', {detail: error})
      );
    }
  }
  
  flattenQueryResult = (listOfObjects) => {
    for (let i = 0; i < listOfObjects.length; i++) {
      let obj = listOfObjects[i];
      for (let prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
          continue;
        }
        if (typeof obj[prop] == 'object' && !Array.isArray(obj[prop])) {
          obj = Object.assign(obj, this.flattenObject(prop,obj[prop]));
        } else if (Array.isArray(obj[prop])) {
          for(let j = 0; j < obj[prop].length; j++) {
            obj[prop+'_'+j] = Object.assign(obj, this.flattenObject(prop,obj[prop]));
          }
        }
      }
    }
    return listOfObjects;
  }

  flattenObject = (propName, obj) => {
    let flatObject = [];
    for (let prop in obj) {
      if (prop) {
        //if this property is an object, we need to flatten again
        let propIsNumber = isNaN(propName);
        let preAppend = propIsNumber ? propName+'_' : '';
        if (typeof obj[prop] == 'object') {
          flatObject[preAppend+prop] = Object.assign(flatObject, this.flattenObject(preAppend+prop,obj[prop]));
        } else {
          flatObject[preAppend+prop] = obj[prop];
        }
      }
    }
    return flatObject;
  }
}