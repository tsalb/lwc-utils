import { LightningElement } from 'lwc';
import { convertToSingleLineString } from 'c/utils';

export default class SoqlDatatableLauncherExample extends LightningElement {
    handleOpenDialog() {
        const query = convertToSingleLineString`
            SELECT Title, Name, Email
            FROM Contact
            WHERE AccountId IN (SELECT Id FROM Account)
            LIMIT 5
        `;
        const dialogServicePayload = {
            method: 'bodyModalLarge',
            config: {
                auraId: 'soql-datatable-example',
                headerLabel: 'Dynamically Created SOQL Datatable',
                component: 'c:soqlDatatable',
                componentParams: {
                    isRecordBind: false,
                    recordId: this.recordId,
                    queryString: query
                }
            }
        };
        this.template.querySelector('c-message-broker').dialogService(dialogServicePayload);
    }
}
