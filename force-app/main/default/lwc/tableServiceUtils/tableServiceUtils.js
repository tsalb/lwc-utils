const flattenObject = (propName, obj) => {
    let flatObject = {};
    for (let prop in obj) {
        if (prop) {
            //if this property is an object, we need to flatten again
            let propIsNumber = isNaN(propName);
            let preAppend = propIsNumber ? propName + '_' : '';
            if (typeof obj[prop] == 'object') {
                flatObject[preAppend + prop] = { ...flatObject, ...flattenObject(preAppend + prop, obj[prop]) };
            } else {
                flatObject[preAppend + prop] = obj[prop];
            }
        }
    }
    return flatObject;
};

const flattenQueryResult = listOfObjects => {
    let finalArr = [];
    for (let i = 0; i < listOfObjects.length; i++) {
        let obj = listOfObjects[i];
        for (let prop in obj) {
            if (!obj.hasOwnProperty(prop)) {
                continue;
            }
            if (typeof obj[prop] == 'object' && typeof obj[prop] != 'Array') {
                obj = { ...obj, ...flattenObject(prop, obj[prop]) };
            } else if (typeof obj[prop] == 'Array') {
                for (let j = 0; j < obj[prop].length; j++) {
                    obj[prop + '_' + j] = { ...obj, ...flattenObject(prop, obj[prop]) };
                }
            }
        }
        finalArr.push(obj);
    }
    return finalArr;
};

const applyLinks = flatData => {
    let dataClone = JSON.parse(JSON.stringify(flatData));
    for (let row of dataClone) {
        Object.keys(row).forEach(key => {
            if (key.endsWith('Id')) {
                row[key] = '/' + row[key];
            }
        });
    }
    return dataClone;
};

export { flattenQueryResult, applyLinks };
