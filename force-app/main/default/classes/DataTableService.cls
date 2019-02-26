/*************************************************************
*  @author: James Hou, james@sparkworks.io
**************************************************************/

public with sharing class DataTableService {

  // tableRequest
  public static final String QUERY_STRING_KEY   = 'queryString';
  public static final String BIND_VAR_KEY       = 'bindVars';
  public static final String ID_SET_KEY         = 'idSet';
  public static final String LINKIFY_KEY        = 'linkify';

  // tableCache
  public static final String TABLE_DATA_KEY     = 'tableData';
  public static final String TABLE_COLUMNS_KEY  = 'tableColumns';

  // lightning-datatable type translation map
  // https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_enum_Schema_DisplayType.htm
  // https://developer.salesforce.com/docs/component-library/bundle/lightning-datatable/documentation
  public static final Map<Schema.DisplayType, String> DISPLAY_TYPE_TO_DATATABLE_TYPE_MAP = new Map<Schema.DisplayType, String>{
    Schema.DisplayType.address        => 'text',
    Schema.DisplayType.anytype        => 'text',
    Schema.DisplayType.base64         => 'text',
    Schema.DisplayType.Boolean        => 'boolean',
    Schema.DisplayType.Combobox       => 'text',
    Schema.DisplayType.Currency       => 'currency',
    Schema.DisplayType.Date           => 'date-local', // my preference
    Schema.DisplayType.DateTime       => 'date-local', // my preference
    Schema.DisplayType.Double         => 'number',
    Schema.DisplayType.Email          => 'email',
    Schema.DisplayType.ID             => 'text',
    Schema.DisplayType.Integer        => 'number',
    Schema.DisplayType.MultiPicklist  => 'text',
    Schema.DisplayType.Percent        => 'percent',
    Schema.DisplayType.Phone          => 'text',
    Schema.DisplayType.Picklist       => 'text',
    Schema.DisplayType.Reference      => 'text',
    Schema.DisplayType.String         => 'text',
    Schema.DisplayType.TextArea       => 'text',
    Schema.DisplayType.Time           => 'text',
    Schema.DisplayType.URL            => 'url'
  };

/**
 * Experimental wire for creating tableCache
 * For now, new POJO passed through @wire aren't triggering change event unless as JSON.
 */
  @AuraEnabled (cacheable=true)
  public static Map<String, Object> wireTableCache(String tableRequest) {
    return DataTableService.getTableCache((Map<String, Object>)JSON.deserializeUntyped(tableRequest));
  }

/**
 * Creates a lightning-datatable ready object keys:
 * tableData and tableColumns can be used as attributes directly clientside.
 * @param  tableRequest [Object with configs, see DataTableService.cmp]
 * @return              [Object with tableCache.tableData, tableCache.tableColumns]
 */
  @AuraEnabled
  public static Map<String, Object> getTableCache(Map<String, Object> tableRequest) {
    if (!tableRequest.containsKey(QUERY_STRING_KEY)) {
      throw new AuraHandledException('Missing Query.');
    }
    // Configurations
    Map<String, Object> tableServiceResponse = new Map<String, Object>();
    List<Object> linkify = (List<Object>)tableRequest.get(LINKIFY_KEY);
    // Derived Data
    List<SObject> tableData = DataTableService.getSObjectData(tableRequest);
    // Derived Columns
    String queryString = (String)tableRequest.get(QUERY_STRING_KEY);
    String sObjectName = queryString.substringAfterLast(' FROM ').split(' ').get(0); // don't depend on if there is a WHERE, also in case FROM is in a field name
    SObject queryObject = Schema.getGlobalDescribe().get(sObjectName).newSObject();

    tableServiceResponse.put(TABLE_DATA_KEY, tableData);
    tableServiceResponse.put(TABLE_COLUMNS_KEY, DataTableService.getColumnData(queryString, queryObject, linkify));
    return tableServiceResponse;
  }

/**
 * Routing method to see if there are any Binding Variables (BIND_VAR_KEY) to scope the dynamic query
 * @param  tableRequest [Object with configs]
 */
  private static List<SObject> getSObjectData(Map<String, Object> tableRequest) {
    if (tableRequest.get(BIND_VAR_KEY) == null) {
      return DataTableService.getSObjectDataFromQueryString((String)tableRequest.get(QUERY_STRING_KEY));
    } else {
      return DataTableService.getSObjectDataFromQueryString((String)tableRequest.get(QUERY_STRING_KEY), tableRequest.get(BIND_VAR_KEY));
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
      System.debug('getSObjectDataFromQueryString queryString is: '+queryString);
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
    System.debug('getSObjectDataFromQueryString orderedBindVars '+orderedBindVars);

    Map<String, Object> reconstructedBindVars = (Map<String, Object>) orderedBindVars;

    if (reconstructedBindVars.get(ID_SET_KEY) != null) {
      List<String> idList = (List<String>) JSON.deserialize(
        JSON.serialize(
          reconstructedBindVars.get(ID_SET_KEY)
        ),
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
 * @param  linkifyConfig  [Configure which fields are linkified in apex, rather than JS]
 * @return                [List of individual tableColumn, i.e. tableColumns]
 */
  private static List<Map<String, Object>> getColumnData(String queryString, SObject queriedSObject, List<Object> linkify) {
    String soqlFields = queryString.subString(queryString.indexOfIgnoreCase('select') + 6, queryString.indexOfIgnoreCase('from')).trim();
    List<String> soqlColumns = soqlFields.split('[,]{1}[\\s]?'); // sanitizes the spacing between commas
    List<Map<String, Object>> tableColumns = new List<Map<String, Object>>();
    Map<String, Schema.SObjectField> fieldMap = queriedSObject.getSObjectType().getDescribe().fields.getMap();

    // Fields were requested to be turned into hyperlinks
    Map<String, DataTableService.LinkField> linkFieldMap = new Map<String, DataTableService.LinkField>();
    if (linkify != null && !linkify.isEmpty()) {
      System.debug('getColumnData linkify is: '+linkify);
      for (Object linkField : linkify) {
        Map<String, Object> reconstructedLinkField = (Map<String, Object>) linkField;
        linkFieldMap.put(
          (String)reconstructedLinkField.get('fieldName'),
          (DataTableService.LinkField)JSON.deserialize(JSON.serialize(reconstructedLinkField), DataTableService.LinkField.class)
        );
      }
      System.debug('getColumnData linkFieldMap is: '+linkFieldMap);
    }

    for (String fieldName : soqlColumns){
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
        field = referenceTo.getDescribe().fields.getMap().get(fieldName.substringAfterLast('.')).getDescribe();
      } else {
        field = fieldMap.get(fieldName).getDescribe();
      }
      System.debug('getColumnData field info: '+fieldName+' : '+field.getType());

      // Minor validations
      if (
        field.getType() == Schema.DisplayType.ID  // IDs are usually keyFields, so we skip display of this
        || field.getType() == Schema.DisplayType.Reference // References are lookups, need granular formatting so left to UI implementation
        || !field.isAccessible() // Respect FLS
      ) {
        continue;
      }

      // Handles parent relationships, to a degree
      if (fieldName.contains('.')) {
        fieldColumn.put('label', fieldName.substringBeforeLast('.') +' '+ field.getLabel());
        fieldColumn.put('fieldName', fieldName.replace('.', '_')); // handled clientside by DataTableServiceHelper.js
      } else {
        fieldColumn.put('label', field.getLabel());
        fieldColumn.put('fieldName', fieldName);
      }

      // Final assembly
      fieldColumn.put('type', DISPLAY_TYPE_TO_DATATABLE_TYPE_MAP.get(field.getType()));

      // Linkification overrides, when required
      if (linkFieldMap.containsKey(fieldName)) {
        // Undo the above
        fieldColumn.remove('label');
        fieldColumn.remove('fieldName');
        fieldColumn.remove('type');
        // Then we recreate from here on
        DataTableService.LinkField config = linkFieldMap.get(fieldName);
        fieldColumn.put('label', fieldName);
        fieldColumn.put('type', DISPLAY_TYPE_TO_DATATABLE_TYPE_MAP.get(Schema.DisplayType.URL));
        fieldColumn.put('fieldName', config.recordIdField);
        // granular config
        Map<String, Object> typeAttributes = new Map<String, Object>();
        typeAttributes.put('label', new Map<String, Object>{'fieldName' => config.fieldName}); // neat trick to pass reference to an existing column
        typeAttributes.put('target', config.target);
        fieldColumn.put('typeAttributes', typeAttributes);
      }
      tableColumns.add(fieldColumn);
    }
    return tableColumns;
  }

  /**
   * Minor wraper to help with linkification process
   */
  public class LinkField {
    public String fieldName;
    public String recordIdField;
    public String target;
  }

}