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
        Schema.DisplayType.anytype => 'text', // Rich text areas, TODO customRichText data type
        Schema.DisplayType.base64 => 'text',
        Schema.DisplayType.Boolean => 'boolean',
        Schema.DisplayType.Combobox => 'text',
        Schema.DisplayType.Currency => 'currency',
        Schema.DisplayType.Date => 'date-local',
        Schema.DisplayType.DateTime => 'date',
        Schema.DisplayType.Double => 'number',
        Schema.DisplayType.Email => 'email',
        Schema.DisplayType.EncryptedString => 'text', // TODO customEncryptedString data type
        Schema.DisplayType.Long => 'number',
        Schema.DisplayType.Location => 'location',
        Schema.DisplayType.ID => 'text',
        Schema.DisplayType.Integer => 'number',
        Schema.DisplayType.MultiPicklist => 'text',
        Schema.DisplayType.Percent => 'percent',
        Schema.DisplayType.Phone => 'phone',
        Schema.DisplayType.Picklist => 'customPicklist',
        Schema.DisplayType.Reference => 'customLookup',
        Schema.DisplayType.String => 'text',
        Schema.DisplayType.TextArea => 'text',
        Schema.DisplayType.Time => 'text', // TODO customTime data type
        Schema.DisplayType.URL => 'url'
    };

    private static final Set<String> AGGREGATE_QUERY_DELIMITERS = new Set<String>{
        'avg',
        'count',
        'count_distinct',
        'min',
        'max',
        'sum'
    };

    private static Set<Id> RECORD_TYPE_IDS { private get; private set; }
    private static Map<String, String> LOOKUP_FIELD_TO_NAME_FIELD_MAP = new Map<String, String>();

    private static final String DATATABLE_ACTION_CONFIG_TYPE = 'Actions';
    private static final String DATATABLE_LOOKUP_CONFIG_TYPE = 'Lookups';

    // TODO move to custom metadata config later for performance tuning
    private static final Integer ROW_LIMITER = 500;

    @AuraEnabled(cacheable=true)
    public static String getQueryExceptionMessage(String queryString) {
        System.debug(LoggingLevel.INFO, 'getQueryExceptionMessage queryString is: ' + queryString);
        String errorMessage;
        try {
            Database.query(queryString);
        } catch (System.QueryException e) {
            errorMessage = e.getMessage();
        }
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

    @AuraEnabled(cacheable=true)
    public static Map<Id, Id> getRecordTypeIdMap(List<Id> recordIds) {
        Map<Id, Id> recordTypeIdMap = new Map<Id, Id>();

        // Validate
        Set<String> objectNames = new Set<String>();
        for (Id recordId : recordIds) {
            objectNames.add(recordId.getSobjectType().getDescribe().getName());
        }
        if (objectNames.size() != 1) {
            throw new DataTableServiceException('Only one type of SObject is allowed.');
        }

        // And then check if we need this
        String objectName = new List<String>(objectNames)[0];
        Boolean hasRecordTypes = DataTableService.recordTypeIdsForObject(objectName).size() > 1;
        if (hasRecordTypes) {
            String queryString = 'SELECT Id, RecordTypeId FROM ' + objectName + ' LIMIT ' + ROW_LIMITER;
            for (SObject obj : Database.query(queryString)) {
                recordTypeIdMap.put(obj.Id, (Id) obj.get('RecordTypeId'));
            }
        }
        return recordTypeIdMap;
    }

    @AuraEnabled(cacheable=true)
    public static List<Datatable_Action_Config__mdt> getActionConfig(String configName) {
        // No multi-selects for custom metadata, so semicolon delimited string field
        String configType = '%' + DATATABLE_ACTION_CONFIG_TYPE + '%';
        return [
            SELECT
                Order__c,
                Row_Action_Name__c,
                Button_Label__c,
                Type__c,
                Datatable_Config__c,
                Flow_API_Name__c,
                LWC_Name__c,
                Dialog_Size__c
            FROM Datatable_Action_Config__mdt
            WHERE Datatable_Config__r.DeveloperName = :configName AND Datatable_Config__r.Type__c LIKE :configType
            ORDER BY Order__c ASC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Datatable_Lookup_Config__mdt> getLookupConfig(String configName) {
        // No multi-selects for custom metadata, so semicolon delimited string field
        String configType = '%' + DATATABLE_LOOKUP_CONFIG_TYPE + '%';
        return [
            SELECT Datatable_Config__c, Object_API_Name__c, Title_Field__c, Subtitle_Field__c, Icon_Name__c
            FROM Datatable_Lookup_Config__mdt
            WHERE Datatable_Config__r.DeveloperName = :configName AND Datatable_Config__r.Type__c LIKE :configType
        ];
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
            throw new DataTableServiceException('Missing Query.');
        }
        // Gather Schema information from incoming query string
        String queryString = (String) tableRequest.get(QUERY_STRING_KEY);
        String objectName = queryString.substringAfter(' FROM ').split(' ').get(0); // don't depend on if there is a WHERE, also in case FROM is in a field name
        SObject queryObject = Schema.getGlobalDescribe().get(objectName).newSObject();

        // Master RecordType Id, 012000000000000AAA is always given
        if (
            DataTableService.recordTypeIdsForObject(objectName).size() > 1 &&
            !queryString.containsIgnoreCase('RecordTypeId')
        ) {
            queryString = addFieldToQueryString('RecordTypeId', queryString);
            tableRequest.put(QUERY_STRING_KEY, queryString);
        }

        System.debug(LoggingLevel.INFO, 'getTableCache PRE COLUMN queryString is: ' + queryString);

        // Columns are derived first for customLookup detection by populating LOOKUP_FIELD_TO_NAME_FIELD_MAP
        List<Map<String, Object>> tableColumns = DataTableService.getColumnData(queryString, queryObject);
        if (!LOOKUP_FIELD_TO_NAME_FIELD_MAP.isEmpty()) {
            for (String lookupNameField : LOOKUP_FIELD_TO_NAME_FIELD_MAP.values()) {
                if (!queryString.containsIgnoreCase(lookupNameField) && !isAggregateQuery(queryString)) {
                    queryString = addFieldToQueryString(lookupNameField, queryString);
                    tableRequest.put(QUERY_STRING_KEY, queryString);
                }
            }
        }

        // Finally, the data itself after checking on both recordTypeId and lookupNameFields
        List<SObject> tableData = DataTableService.getSObjectData(tableRequest);

        // Put it all together
        return new Map<String, Object>{
            TABLE_DATA_KEY => tableData,
            TABLE_COLUMNS_KEY => tableColumns,
            SOBJECT_API_NAME => objectName
        };
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
        // Safety first
        String.escapeSingleQuotes(queryString);
        // Performance second
        if (!queryString.containsIgnoreCase(' LIMIT ') && shouldAddLimit(queryString)) {
            queryString += ' LIMIT ' + ROW_LIMITER;
        }
        System.debug(LoggingLevel.INFO, 'getSObjectDataFromQueryString FINAL queryString is: ' + queryString);
        return getSObjectsWithAllowedFields(queryString, null);
    }

    /**
     * Contains dynamic binding vars, returns everything bound to the dynamic variable
     * @param  queryString     [Dynamic SOQL string]
     * @param  orderedBindVars [Currently only an ID_SET_KEY, containing a list of sObject Ids to scope the query]
     * @return                 [List of dynamically queried SObjects scoped by some BIND_VAR]
     */
    private static List<SObject> getSObjectDataFromQueryString(String queryString, Object orderedBindVars) {
        Set<Id> idSet = new Set<Id>();
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
        return getSObjectsWithAllowedFields(queryString, idSet);
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
            } else if (fieldMap.containsKey(fieldName)) {
                field = fieldMap.get(fieldName).getDescribe();
            } else if (isAggregateQuery(fieldName)) {
                String aggQueryFieldLabel = getAggregateQueryFieldLabel(fieldName);
                fieldColumn.put('label', aggQueryFieldLabel);
                fieldColumn.put('type', DISPLAY_TYPE_TO_DATATABLE_TYPE_MAP.get(Schema.DisplayType.Integer));
                fieldColumn.put('fieldName', getAggregateQueryFieldName(fieldName, aggQueryFieldLabel));
                tableColumns.add(fieldColumn);
                continue;
            }

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

            // Fields with Name are typically hyperlinked, so we replace it with a custom datatype
            if (fieldName.equalsIgnoreCase('name') || fieldName.substringAfterLast('.').equalsIgnoreCase('name')) {
                fieldColumn.put('type', 'customName');

                // Need a little bit of magic to resolve name fields that are relationship one level up
                Boolean isNameFieldForPrimaryObject =
                    currentSObjectType.getDescribe().getName() ==
                    queriedSObject.getSObjectType().getDescribe().getName();
                String hrefFieldValue = isNameFieldForPrimaryObject
                    ? currentSObjectType.getDescribe().getName() + '_Id'
                    : fieldName.substringBeforeLast('.') + '_Id';

                Map<String, Object> typeAttributes = getTypeAttributes(fieldColumn);
                typeAttributes.put('href', new Map<String, Object>{ 'fieldName' => hrefFieldValue });
                typeAttributes.put('target', '_parent');
                fieldColumn.put('typeAttributes', typeAttributes);
            }

            // Some native data types need some default typeAttributes
            String columnType = String.valueOf(fieldColumn.get('type'));

            // Formula fields may output text links via the HYPERLINK formula
            if (field.isCalculated() && columnType.equalsIgnoreCase('text')) {
                String formulaValue = field.getCalculatedFormula();
                if (
                    String.isNotBlank(formulaValue) &&
                    (formulaValue.containsIgnoreCase('hyperlink') || formulaValue.containsIgnoreCase('image'))
                ) {
                    fieldColumn.put('type', 'customFormula');
                    Map<String, Object> typeAttributes = getTypeAttributes(fieldColumn);
                    typeAttributes.put('isHtmlFormula', true);
                    fieldColumn.put('typeAttributes', typeAttributes);
                }
            }

            if (columnType.equalsIgnoreCase('location')) {
                throw new DataTableServiceException(
                    'Geolocation fields must be queried with __Longitude__s and __Latitude__s suffixes.'
                );
            }

            if (columnType.equalsIgnoreCase('date-local')) {
                Map<String, Object> typeAttributes = getTypeAttributes(fieldColumn);
                typeAttributes.put('year', 'numeric');
                typeAttributes.put('month', 'numeric');
                typeAttributes.put('day', 'numeric');
                fieldColumn.put('typeAttributes', typeAttributes);
            }

            if (columnType.equalsIgnoreCase('date')) {
                Map<String, Object> typeAttributes = getTypeAttributes(fieldColumn);
                typeAttributes.put('year', 'numeric');
                typeAttributes.put('month', 'numeric');
                typeAttributes.put('day', 'numeric');
                typeAttributes.put('hour', 'numeric');
                typeAttributes.put('minute', 'numeric');
                fieldColumn.put('typeAttributes', typeAttributes);
            }

            // All custom data types get these attributes for dealing with cell specific logic
            if (columnType.startsWithIgnoreCase('custom')) {
                String fieldNameParticle = fieldName.contains('.') ? fieldName.substringAfterLast('.') : fieldName;
                Map<String, Object> typeAttributes = getTypeAttributes(fieldColumn);
                typeAttributes.put('columnName', fieldNameParticle);
                typeAttributes.put('objectApiName', currentSObjectType.getDescribe().getName());
                typeAttributes.put('fieldApiName', fieldNameParticle);
                fieldColumn.put('typeAttributes', typeAttributes);
            }

            Boolean hasRecordTypes =
                DataTableService.recordTypeIdsForObject(currentSObjectType.getDescribe().getName()).size() > 1;
            if (columnType.equalsIgnoreCase('customPicklist') && hasRecordTypes) {
                Map<String, Object> typeAttributes = getTypeAttributes(fieldColumn);
                typeAttributes.put('picklistRecordTypeId', new Map<String, Object>{ 'fieldName' => 'RecordTypeId' });
                fieldColumn.put('typeAttributes', typeAttributes);
            }

            if (columnType.equalsIgnoreCase('customLookup')) {
                // We need to scrape the schema for the name field
                Boolean isCustomObjectLookup = field.getReferenceTo().get(0).getDescribe().isCustom();
                String cleanFieldName = isCustomObjectLookup ? fieldName : fieldName.removeEnd('Id');
                String lookupNameField = DataTableService.getLookupNameField(field, cleanFieldName);
                String flattenedNameField = lookupNameField.replace('.', '_');
                String hrefFieldValue = cleanFieldName.replace('__c', '__r') + '_Id';

                // So that when we get the table data, these extra name fields are injected
                LOOKUP_FIELD_TO_NAME_FIELD_MAP.put(cleanFieldName, lookupNamefield);

                // Then process the column itself
                Map<String, Object> typeAttributes = getTypeAttributes(fieldColumn);
                typeAttributes.put('href', new Map<String, Object>{ 'fieldName' => hrefFieldValue });
                typeAttributes.put('target', '_parent');
                typeAttributes.put('displayValue', new Map<String, Object>{ 'fieldName' => flattenedNameField });
                typeAttributes.put('referenceObjectApiName', field.getReferenceTo().get(0).getDescribe().getName());
                fieldColumn.put('typeAttributes', typeAttributes);
            }

            // Finally
            tableColumns.add(fieldColumn);
        }
        return tableColumns;
    }

    private static Map<String, Object> getTypeAttributes(Map<String, Object> fieldColumn) {
        if (fieldColumn.get('typeAttributes') == null) {
            fieldColumn.put('typeAttributes', new Map<String, Object>());
        }
        return (Map<String, Object>) fieldColumn.get('typeAttributes');
    }

    private static Set<Id> recordTypeIdsForObject(String objectName) {
        if (DataTableService.RECORD_TYPE_IDS == null) {
            DataTableService.RECORD_TYPE_IDS = Schema.getGlobalDescribe()
                .get(objectName)
                .getDescribe()
                .getRecordTypeInfosById()
                .keySet();
        }
        return DataTableService.RECORD_TYPE_IDS;
    }

    private static String addFieldToQueryString(String field, String queryString) {
        String queryStart = queryString.substringBefore(' FROM ');
        String queryEnd = queryString.substringAfter(' FROM ');
        return queryStart + ', ' + String.escapeSingleQuotes(field) + ' FROM ' + queryEnd;
    }

    private static Boolean isAggregateQuery(String queryString) {
        Boolean isAggregateQuery = false;
        for (String aggQueryDelimiter : AGGREGATE_QUERY_DELIMITERS) {
            if (queryString.containsIgnoreCase(aggQueryDelimiter + '(')) {
                isAggregateQuery = true;
                break;
            }
        }
        return isAggregateQuery;
    }

    private static String getAggregateQueryFieldLabel(String fieldName) {
        Integer expressionEnd = fieldName.indexOf(')') + 1;
        if (expressionEnd == fieldName.length()) {
            //there isn't an alias, just use the expression itself
            return fieldName;
        }
        //sometimes people put a space after the expression end and before the field alias, trim the result
        return fieldName.substring(expressionEnd, fieldName.length()).trim();
    }

    private static Integer aggQueryExpressionNameCounter = 0;
    private static String getAggregateQueryFieldName(String fieldName, String fieldLabel) {
        //Any aggregated field in a SELECT list that does not have an alias automatically gets an implied alias with a format "expr{i}"
        //where i denotes the order of the aggregated fields with no explicit aliases.
        if (fieldName == fieldLabel) {
            String baseString = 'expr{0}';
            String returnString = String.format(baseString, new List<String>{ aggQueryExpressionNameCounter.format() });
            aggQueryExpressionNameCounter++;
            return returnString;
        } else if (fieldName.indexOf(')') + 1 < fieldName.length()) {
            //there is an alias
            return fieldLabel;
        }
        return fieldName;
    }

    private static Boolean shouldAddLimit(String queryString) {
        //You can't use a LIMIT clause in a query that uses an aggregate function, but does not use a GROUP BY clause.
        return isAggregateQuery(queryString) ? queryString.containsIgnoreCase('group by') : true;
    }

    private static String getLookupNameField(Schema.DescribeFieldResult field, String cleanFieldName) {
        Schema.SObjectField nameField;
        for (Schema.SObjectField curField : field.getReferenceTo().get(0).getDescribe().fields.getMap().values()) {
            if (curField.getDescribe().isNameField()) {
                nameField = curField;
                break;
            }
        }
        return cleanFieldName.replace('__c', '__r') + '.' + nameField.getDescribe().getName();
    }

    private static List<SObject> getSObjectsWithAllowedFields(String queryString, Set<Id> idSet) {
        try {
            List<SObject> queriedRecords = Database.query(queryString);
            //stripInaccessible doesn't support AggregateResult SObjects
            if (isAggregateQuery(queryString)) {
                return queriedRecords;
            }
            return Security.stripInaccessible(AccessType.READABLE, queriedRecords).getRecords();
        } catch (Exception e) {
            throw new DataTableServiceException(e.getMessage() + '\nInner stack trace: ' + e.getStackTraceString());
        }
    }

    private class DataTableServiceException extends Exception {
    }
}
