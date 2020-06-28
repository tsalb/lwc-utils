/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2019, james@sparkworks.io
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

public inherited sharing class DataTableService {
    // Request
    public static final String QUERY_STRING_KEY = 'queryString';
    public static final String BIND_VAR_KEY = 'bindVars';
    public static final String ID_SET_KEY = 'idSet';

    // Response
    public static final String TABLE_DATA_KEY = 'tableData';
    public static final String TABLE_COLUMNS_KEY = 'tableColumns';
    public static final String SOBJECT_API_NAME = 'objectApiName';

    // lightning-datatable type translation map
    // https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_enum_Schema_DisplayType.htm
    // https://developer.salesforce.com/docs/component-library/bundle/lightning-datatable/documentation
    public static final Map<Schema.DisplayType, String> DISPLAY_TYPE_TO_DATATABLE_TYPE_MAP = new Map<Schema.DisplayType, String>{
        Schema.DisplayType.address => 'text',
        Schema.DisplayType.anytype => 'text',
        Schema.DisplayType.base64 => 'text',
        Schema.DisplayType.Boolean => 'boolean',
        Schema.DisplayType.Combobox => 'text',
        Schema.DisplayType.Currency => 'currency',
        Schema.DisplayType.Date => 'date',
        Schema.DisplayType.DateTime => 'date-local',
        Schema.DisplayType.Double => 'number',
        Schema.DisplayType.Email => 'email',
        Schema.DisplayType.ID => 'text',
        Schema.DisplayType.Integer => 'number',
        Schema.DisplayType.MultiPicklist => 'text',
        Schema.DisplayType.Percent => 'percent',
        Schema.DisplayType.Phone => 'text',
        Schema.DisplayType.Picklist => 'text',
        Schema.DisplayType.Reference => 'url',
        Schema.DisplayType.String => 'text',
        Schema.DisplayType.TextArea => 'text',
        Schema.DisplayType.Time => 'text',
        Schema.DisplayType.URL => 'url'
    };

    @AuraEnabled(cacheable=true)
    public static String getQueryExceptionMessage(String queryString) {
        System.debug(LoggingLevel.INFO, 'getQueryExceptionMessage queryString: ' + queryString);
        String errorMessage;
        try {
            Database.query(queryString);
        } catch (System.QueryException e) {
            errorMessage = e.getMessage();
        } catch (Exception e) {
            errorMessage = e.getMessage();
        }
        System.debug(LoggingLevel.ERROR, 'getQueryExceptionMessage errorMessage: ' + errorMessage);
        return errorMessage;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getDisplayTypeMap() {
        Map<String, String> result = new Map<String, String>();
        for (Schema.DisplayType type : DISPLAY_TYPE_TO_DATATABLE_TYPE_MAP.keySet()) {
            result.put(String.valueOf(type), DISPLAY_TYPE_TO_DATATABLE_TYPE_MAP.get(type));
        }
        return result;
    }

    /**
     * Experimental wire for creating tableCache
     * For now, new POJO passed through @wire aren't triggering change event unless as JSON.
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> wireTableCache(String tableRequest) {
        return DataTableService.getTableCache((Map<String, Object>) JSON.deserializeUntyped(tableRequest));
    }

    /**
     * Creates a lightning-datatable ready object keys:
     * tableData and tableColumns can be used as attributes directly clientside.
     * @param  tableRequest [Object with keys listed at top of this class]
     * @return              [Object with keys listed at top of this class]
     */
    @AuraEnabled
    public static Map<String, Object> getTableCache(Map<String, Object> tableRequest) {
        if (!tableRequest.containsKey(QUERY_STRING_KEY)) {
            throw new AuraHandledException('Missing Query.');
        }
        // Configurations
        Map<String, Object> tableServiceResponse = new Map<String, Object>();
        // Derived Data
        List<SObject> tableData = DataTableService.getSObjectData(tableRequest);
        // Derived Columns
        String queryString = (String) tableRequest.get(QUERY_STRING_KEY);
        String objectName = queryString.substringAfter(' FROM ').split(' ').get(0); // don't depend on if there is a WHERE, also in case FROM is in a field name
        SObject queryObject = Schema.getGlobalDescribe().get(objectName).newSObject();

        tableServiceResponse.put(TABLE_DATA_KEY, tableData);
        tableServiceResponse.put(TABLE_COLUMNS_KEY, DataTableService.getColumnData(queryString, queryObject));
        tableServiceResponse.put(SOBJECT_API_NAME, objectName);
        return tableServiceResponse;
    }

    /**
     * Routing method to see if there are any Binding Variables (BIND_VAR_KEY) to scope the dynamic query
     * @param  tableRequest [Object with configs]
     */
    private static List<SObject> getSObjectData(Map<String, Object> tableRequest) {
        if (tableRequest.get(BIND_VAR_KEY) == null) {
            return DataTableService.getSObjectDataFromQueryString((String) tableRequest.get(QUERY_STRING_KEY));
        } else {
            return DataTableService.getSObjectDataFromQueryString(
                (String) tableRequest.get(QUERY_STRING_KEY),
                tableRequest.get(BIND_VAR_KEY)
            );
        }
    }

    /**
     * No dynamic binding vars, returns everything specific directly from SOQL string
     * @param  queryString [Dynamic SOQL string]
     * @return             [List of dynamically queried SObjects]
     */
    private static List<SObject> getSObjectDataFromQueryString(String queryString) {
        String.escapeSingleQuotes(queryString);
        try {
            System.debug('getSObjectDataFromQueryString queryString is: ' + queryString);
            return Database.query(queryString);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Contains dynamic binding vars, returns everything bound to the dynamic variable
     * @param  queryString     [Dynamic SOQL string]
     * @param  orderedBindVars [Currently only an ID_SET_KEY, containing a list of sObject Ids to scope the query]
     * @return                 [List of dynamically queried SObjects scoped by some BIND_VAR]
     */
    private static List<SObject> getSObjectDataFromQueryString(String queryString, Object orderedBindVars) {
        Set<Id> idSet = new Set<Id>();
        System.debug('getSObjectDataFromQueryString orderedBindVars ' + orderedBindVars);

        Map<String, Object> reconstructedBindVars = (Map<String, Object>) JSON.deserializeUntyped(
            JSON.serialize(orderedBindVars)
        );

        if (reconstructedBindVars.get(ID_SET_KEY) != null) {
            List<String> idList = (List<String>) JSON.deserialize(
                JSON.serialize(reconstructedBindVars.get(ID_SET_KEY)),
                List<String>.class
            );
            for (String sObjectId : idList) {
                idSet.add(sObjectId.trim());
            }
        }
        try {
            return Database.query(queryString);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Creates lightning-datatable ready tableColumns using the queryString and the queried object's schema.
     * @param  queryString    [Dynamic SOQL String, to parse out fields]
     * @param  queriedSObject [To grab full schema of fields, primarily for labels]
     * @return                [List of individual tableColumn, i.e. tableColumns]
     */
    private static List<Map<String, Object>> getColumnData(String queryString, SObject queriedSObject) {
        String soqlFields = queryString.subString(
                queryString.indexOfIgnoreCase('select') + 7,
                queryString.indexOfIgnoreCase(' from ')
            )
            .trim();
        List<String> soqlColumns = soqlFields.split('[,]{1}[\\s]*'); // sanitizes the spacing between commas
        List<Map<String, Object>> tableColumns = new List<Map<String, Object>>();
        Map<String, Schema.SObjectField> fieldMap = queriedSObject.getSObjectType().getDescribe().fields.getMap();

        for (String fieldName : soqlColumns) {
            Schema.SObjectType currentSObjectType = queriedSObject.getSObjectType();
            Schema.DescribeFieldResult field;
            Map<String, Object> fieldColumn = new Map<String, Object>();

            // History tables have this field, ignore this one
            if (fieldname == 'created') {
                continue;
            }

            // Handles parent relationships, to a degree
            if (fieldName.contains('.')) {
                String parentReference = fieldName.contains('__r')
                    ? fieldName.substringBeforeLast('__r.') + '__c' // custom objects
                    : fieldName.substringBeforeLast('.') + 'Id'; // standard objects typical schema
                Schema.SObjectType referenceTo = fieldMap.get(parentReference).getDescribe().getReferenceTo().get(0);
                currentSObjectType = referenceTo;
                field = referenceTo.getDescribe().fields.getMap().get(fieldName.substringAfterLast('.')).getDescribe();
            } else {
                field = fieldMap.get(fieldName).getDescribe();
            }
            System.debug('getColumnData field info: ' + fieldName + ' : ' + field.getType());

            // Respect FLS
            if (!field.isAccessible()) {
                continue;
            }

            // Default column props and typeAttributes are assigned here
            String flatFieldName = fieldName.contains('.')
                ? fieldName.replace('.', '_') // parent fields handled by clientside flattener
                : fieldName;
            fieldColumn.put('label', field.getLabel());
            fieldColumn.put('type', DISPLAY_TYPE_TO_DATATABLE_TYPE_MAP.get(field.getType()));
            fieldColumn.put('fieldName', flatFieldName);

            // TODO
            if (field.getType() === Schema.DisplayType.REFERENCE) {
                continue;
            }

            // Fields with Name are typically hyperlinked, so we replace it with a custom datatype
            if (fieldName.equalsIgnoreCase('name') || fieldName.substringAfterLast('.').equalsIgnoreCase('name')) {
                String objectName = currentSObjectType.getDescribe().getName();
                fieldColumn.put('type', 'customName');
                Map<String, Object> typeAttributes = new Map<String, Object>();
                // This is a trick to set reference to a value and allow tableServiceUtils.js deal with this
                typeAttributes.put('href', new Map<String, Object>{ 'fieldName' => objectName + '_Id' });
                typeAttributes.put('target', '_parent');
                fieldColumn.put('typeAttributes', typeAttributes);
            }

            // All custom data types get these attributes for dealing with cell specific logic
            if (String.valueOf(fieldColumn.get('type')).startsWithIgnoreCase('custom')) {
                String fieldNameParticle = fieldName.contains('.') ? fieldName.substringAfterLast('.') : fieldName;
                Map<String, Object> typeAttributes = (Map<String, Object>) fieldColumn.get('typeAttributes');
                typeAttributes.put('columnName', fieldNameParticle);
                typeAttributes.put('objectApiName', currentSObjectType.getDescribe().getName());
                typeAttributes.put('fieldApiName', fieldNameParticle);
                fieldColumn.put('typeAttributes', typeAttributes);
            }

            // Finally
            tableColumns.add(fieldColumn);
        }
        return tableColumns;
    }
}
