import LightningDatatable from 'lightning/datatable';

// Custom data type templates
import customName from './customName.html';

export default class datatableExtension extends LightningDatatable {
    static customTypes = {
        customName: {
            template: customName,
            // Provide template data here if needed
            typeAttributes: ['href', 'target']
        }
    };
}
