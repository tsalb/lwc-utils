import { reduceErrors } from 'c/utils';

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
            if (!obj.hasOwnProperty(prop)) {
                continue;
            }
            if (typeof obj[prop] === 'object' && typeof obj[prop] !== 'Array') {
                obj = { ...obj, ...flattenObject(prop, obj[prop]) };
            } else if (typeof obj[prop] === 'Array') {
                for (let j = 0; j < obj[prop].length; j++) {
                    obj[`${prop}_${j}`] = { ...obj, ...flattenObject(prop, obj[prop]) };
                }
            }
            // Helps with linkifying name fields
            if (prop === 'Id') {
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
            tableMessages.push(`Row ${value.rowNumber} ${msg}`);
        });
    }
    return {
        title: `Found ${Object.keys(datatableErrorRows).length} error rows`,
        messages: tableMessages.sort()
    };
};

export { flattenQueryResult, createDatatableErrorRow, createDataTableError };
