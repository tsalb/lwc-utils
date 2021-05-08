/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, james@sparkworks.io
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

import { reduceErrors } from 'c/baseUtils';

const flattenObject = (propName, obj) => {
  let flatObject = {};
  for (let prop in obj) {
    if (prop) {
      //if this property is an object, we need to flatten again
      let propIsNumber = isNaN(propName);
      let preAppend = propIsNumber ? `${propName}_` : '';
      if (typeof obj[prop] == 'object') {
        flatObject[preAppend + prop] = { ...flatObject, ...flattenObject(preAppend + prop, obj[prop]) };
      } else {
        flatObject[preAppend + prop] = obj[prop];
      }
    }
  }
  return flatObject;
};

const flattenQueryResult = (listOfObjects, objectApiName) => {
  let finalArr = [];
  for (let i = 0; i < listOfObjects.length; i++) {
    let obj = listOfObjects[i];
    for (let prop in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
        continue;
      }
      if (typeof obj[prop] === 'object' && !Array.isArray(obj[prop])) {
        obj = { ...obj, ...flattenObject(prop, obj[prop]) };
      } else if (Array.isArray(obj[prop])) {
        for (let j = 0; j < obj[prop].length; j++) {
          obj[`${prop}_${j}`] = { ...obj, ...flattenObject(prop, obj[prop]) };
        }
      }
      // Helps with linkifying name fields
      if (prop === 'Id' && objectApiName) {
        const objectIdProp = { [`${objectApiName}_Id`]: obj[prop] };
        obj = { ...obj, ...objectIdProp };
      }
    }
    finalArr.push(obj);
  }
  return finalArr;
};

const createDatatableErrorRow = (error, recordInput) => {
  const originalRecord = { ...recordInput.fields };
  let errorMessages = [];
  let errorFields = [];

  // Not an LDS fields error
  if (!error.body.output) {
    errorMessages = [error.body.message];
  }
  // LDS fields error
  if (error.body.output && error.body.output.fieldErrors) {
    errorFields = Object.keys(error.body.output.fieldErrors);
    errorMessages = reduceErrors(error);
  }
  const errorRow = {
    [originalRecord.Id]: {
      title: `${errorMessages.length} error(s) on this row`,
      messages: errorMessages,
      fieldNames: errorFields
    }
  };
  return errorRow;
};

const createDataTableError = (datatableErrorRows, recordIdToRowNumberMap) => {
  let tableMessages = [];
  const errorMap = new Map(Object.entries(datatableErrorRows));
  for (let [key, value] of errorMap.entries()) {
    value.rowNumber = recordIdToRowNumberMap.get(key);
    value.messages.forEach(msg => {
      tableMessages.push(`Row ${value.rowNumber}: ${msg}`);
    });
  }
  return {
    title: `Found ${Object.keys(datatableErrorRows).length} error rows`,
    messages: tableMessages.sort()
  };
};

export { flattenQueryResult, createDatatableErrorRow, createDataTableError };
