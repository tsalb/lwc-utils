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

export {
    // Generic JS Utils
    generateUUID,
    // Apex Utils
    hasPermission,
    // Supports prototyping
    // ONLY USE THIS FOR SANDBOX ENVIRONMENTS BY WHITELISTING CSP
    // Trusted Site Name: salesforce_heroku_data_faker
    // Trusted Site URL:	https://data-faker.herokuapp.com
    fetchFakeDataHelper
};
