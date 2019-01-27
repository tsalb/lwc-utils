import { LightningElement, api, track, wire } from 'lwc';
import wireTableCache from '@salesforce/apex/DataTableService.wireTableCache';

export default class LwcDatatableService extends LightningElement {
  @api 
  get requestConfig() {
    return this.request;
  }
  set requestConfig(value) {
    this.request = value;
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
        new CustomEvent('error', {detail: error.details.body.message})
      );
    }
  }
  
  flattenQueryResult = (listOfObjects) => {
    let finalArr = [];
    for (let i=0; i<listOfObjects.length; i++) {
      let obj = listOfObjects[i];
      for (let prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
          continue;
        }
        if (typeof obj[prop] == 'object' && typeof obj[prop] != 'Array') {
          obj = {...obj, ...this.flattenObject(prop, obj[prop])};
        } else if (typeof obj[prop] == 'Array') {
          for (let j=0; j<obj[prop].length; j++) {
            obj[prop+'_'+j] = {...obj, ...this.flattenObject(prop,obj[prop])};
          }
        }
      }
      finalArr.push(obj);
    }
    return finalArr;
  }

  flattenObject = (propName, obj) => {
    let flatObject = {};
    for (let prop in obj) {
      if (prop) {
        //if this property is an object, we need to flatten again
        let propIsNumber = isNaN(propName);
        let preAppend = propIsNumber ? propName+'_' : '';

        if (typeof obj[prop] == 'object') {
          flatObject[preAppend+prop] = {...flatObject, ...this.flattenObject(preAppend+prop,obj[prop])};
        } else {
          flatObject[preAppend+prop] = obj[prop];
        }
      }
    }
    return flatObject;
  }
}