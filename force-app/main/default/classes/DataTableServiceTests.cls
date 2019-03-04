@isTest
private class DataTableServiceTests {

  @isTest
  static void test_missing_query() {
    Map<String, Object> tableServiceRequest = new Map<String, Object>();
    Map<String, Object> tableServiceResponse = new Map<String, Object>();
    String errorMessage;

    Test.startTest();
      try {
        tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
      } catch (Exception e) {
        errorMessage = e.getMessage();
      }
    Test.stopTest();

    System.debug('test_missing_query errorMessage is: '+errorMessage);
    System.assert(tableServiceResponse.isEmpty());
    System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
    System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));
    System.assert(String.isNotEmpty(errorMessage));
  }

  @isTest
  static void test_query_no_where_filter() {
    Map<String, Object> tableServiceRequest = new Map<String, Object>();
    Map<String, Object> tableServiceResponse = new Map<String, Object>();
    String queryString = 'SELECT Id, Name, Email FROM User';

    tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

    Test.startTest();
      tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
    Test.stopTest();

    System.assert(!tableServiceResponse.isEmpty());
    System.assert(tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
    System.assert(tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));

    List<User> users = (List<User>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
    System.assert(!users.isEmpty());

    List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(DataTableService.TABLE_COLUMNS_KEY);
    System.assertEquals(2, columns.size()); // Id is parsed out
  }

  @isTest
  static void test_query_has_advanced_where_filter() {
    Map<String, Object> tableServiceRequest = new Map<String, Object>();
    Map<String, Object> tableServiceResponse = new Map<String, Object>();
    String queryString = 'SELECT Id, Name FROM User WHERE Name LIKE \'%BlahBlahBlah%\'';

    tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

    Test.startTest();
      tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
    Test.stopTest();

    List<User> users = (List<User>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
    System.assertEquals(0, users.size());

    List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(DataTableService.TABLE_COLUMNS_KEY);
    System.assertEquals(1, columns.size()); // Id is parsed out
  }

  @isTest
  static void test_query_has_where_bind_var() {
    Map<String, Object> bindVars = new Map<String, Object>(); // This is the datatype for a bind var
    Map<String, Object> tableServiceRequest = new Map<String, Object>();
    Map<String, Object> tableServiceResponse = new Map<String, Object>();

    // Build our binding var, assuming this is coming form somewhere in the UI or user interaction
    Id userId = UserInfo.getUserId();
    Set<Id> idSet = new Set<Id>();
    idSet.add(userId);
    bindVars.put(DataTableService.ID_SET_KEY, idSet);

    // This is the expected format for a soql using the bind var key
    String queryString = 'SELECT Id, Name, Email FROM User WHERE Id =: idSet';

    tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);
    tableServiceRequest.put(DataTableService.BIND_VAR_KEY, bindVars);

    Test.startTest();
      tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
    Test.stopTest();

    System.assert(!tableServiceResponse.isEmpty());
    System.assert(tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
    System.assert(tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));

    List<User> users = (List<User>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
    System.assertEquals(1, users.size());
    System.assertEquals(userId, users[0].Id);

    List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(DataTableService.TABLE_COLUMNS_KEY);
    System.assertEquals(2, columns.size()); // Id is parsed out
  }

  @isTest
  static void test_query_has_where_bind_var_testing_soql_injection() {
    Map<String, Object> tableServiceRequest = new Map<String, Object>();
    Map<String, Object> tableServiceResponse = new Map<String, Object>();
    String userIdString = (String)UserInfo.getUserId();
    String queryString = 'SELECT Id, Name FROM User WHERE Id = \''+userIdString+'\'';

    tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

    Test.startTest();
      tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
    Test.stopTest();

    List<User> users = (List<User>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
    System.assertEquals(1, users.size());
  }

  @isTest
  static void test_query_with_typo_has_exception_msg() {
    Map<String, Object> tableServiceRequest = new Map<String, Object>();
    Map<String, Object> tableServiceResponse = new Map<String, Object>();
    String queryString = 'SELECT Id, Name, Email FROM Fake_SObject__c';
    String errorMessage;

    tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

    Test.startTest();
      try {
        tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
      } catch (Exception e) {
        errorMessage = e.getMessage();
      }
    Test.stopTest();

    System.debug('test_query_with_typo_has_exception_msg errorMessage is: '+errorMessage);
    System.assert(tableServiceResponse.isEmpty());
    System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
    System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));
    System.assert(String.isNotEmpty(errorMessage));
  }

  @isTest
  static void test_bind_var_set_up_incorrectly_has_exception_msg() {
    Map<String, Object> bindVars = new Map<String, Object>();
    Map<String, Object> tableServiceRequest = new Map<String, Object>();
    Map<String, Object> tableServiceResponse = new Map<String, Object>();
    String errorMessage;

    // Build our binding var INCORRECTLY
    Id userId = UserInfo.getUserId();
    String idSet = userId;
    bindVars.put(DataTableService.ID_SET_KEY, idSet);

    // This is the expected format for a soql using the bind var key
    String queryString = 'SELECT Id, Name FROM User WHERE Id =: idSet';

    tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);
    tableServiceRequest.put(DataTableService.BIND_VAR_KEY, bindVars);

    Test.startTest();
      try {
        tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
      } catch (Exception e) {
        errorMessage = e.getMessage();
      }
    Test.stopTest();

    System.debug('test_bind_var_set_up_incorrectly_has_exception_msg errorMessage is: '+errorMessage);
    System.assert(tableServiceResponse.isEmpty());
    System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
    System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));
    System.assert(String.isNotEmpty(errorMessage));
  }

}