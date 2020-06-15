import checkPermission from '@salesforce/apex/PermissionService.checkPermission';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const hasPermission = async apiName => {
    const response = await checkPermission({ apiName: apiName });
    return response;
};

// Straight from component library playground
const fetchFakeDataHelper = async ({ amountOfRecords }) => {
    const recordMetadata = {
        name: 'name',
        email: 'email',
        website: 'url',
        amount: 'currency',
        phone: 'phoneNumber',
        closeAt: 'dateInFuture'
    };
    const response = await fetch('https://data-faker.herokuapp.com/collection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
            amountOfRecords,
            recordMetadata
        })
    });
    return response.json();
};

const createSetFromDelimitedString = (string, delimiter) => {
    // remove all white space in and around
    return new Set(string.replace(/\s+/g, '').split(delimiter));
};

/**
 * Reduces one or more LDS errors into a string[] of error messages.
 * @param {FetchResponse|FetchResponse[]} errors
 * @return {String[]} Error messages
 */
const reduceErrors = errors => {
    if (!Array.isArray(errors)) {
        errors = [errors];
    }

    return (
        errors
            // Remove null/undefined items
            .filter(error => !!error)
            // Extract an error message
            .map(error => {
                console.log(error);
                // UI API read errors
                if (Array.isArray(error.body)) {
                    return error.body.map(e => e.message);
                }
                // FIELD VALIDATION, FIELD, and trigger.addError
                else if (
                    error.body &&
                    error.body.enhancedErrorType &&
                    error.body.enhancedErrorType.toLowerCase() === 'recorderror' &&
                    error.body.output
                ) {
                    let firstError = '';
                    if (
                        error.body.output.errors.length &&
                        error.body.output.errors[0].errorCode === 'INSUFFICIENT_ACCESS_OR_READONLY'
                    ) {
                        firstError = error.body.output.errors[0].message;
                    }
                    if (
                        error.body.output.errors.length &&
                        error.body.output.errors[0].errorCode === 'FIELD_CUSTOM_VALIDATION_EXCEPTION'
                    ) {
                        firstError = error.body.output.errors[0].message;
                    }
                    if (
                        error.body.output.errors.length &&
                        error.body.output.errors[0].errorCode === 'CANNOT_EXECUTE_FLOW_TRIGGER'
                    ) {
                        firstError = error.body.output.errors[0].message;
                    }
                    if (!error.body.output.errors.length && error.body.output.fieldErrors) {
                        // It's in a really weird format...
                        firstError =
                            error.body.output.fieldErrors[Object.keys(error.body.output.fieldErrors)[0]][0].message;
                    }
                    return firstError;
                }
                // UI API DML, Apex and network errors
                else if (error.body && typeof error.body.message === 'string') {
                    return error.body.message;
                }
                // PAGE ERRORS
                else if (error.body && error.body.pageErrors.length) {
                    return error.body.pageErrors[0].message;
                }
                // JS errors
                else if (typeof error.message === 'string') {
                    return error.message;
                }
                // Unknown error shape so try HTTP status text
                return error.statusText;
            })
            // Flatten
            .reduce((prev, curr) => prev.concat(curr), [])
            // Remove empty strings
            .filter(message => !!message)
    );
};

export {
    generateUUID,
    hasPermission,
    // Supports prototyping
    // ONLY USE THIS FOR SANDBOX ENVIRONMENTS BY WHITELISTING CSP
    // Trusted Site Name: salesforce_heroku_data_faker
    // Trusted Site URL:	https://data-faker.herokuapp.com
    fetchFakeDataHelper,
    createSetFromDelimitedString,
    reduceErrors
};
