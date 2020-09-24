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

@isTest
private class DataTableServiceTests {
    @isTest
    static void test_missing_query_should_return_error_message() {
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

        System.debug('test_missing_query errorMessage is: ' + errorMessage);
        System.assert(tableServiceResponse.isEmpty());
        System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
        System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));
        System.assert(String.isNotEmpty(errorMessage));
    }

    @isTest
    static void test_query_no_where_filter_should_return_response() {
        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        Map<String, Object> tableServiceResponse = new Map<String, Object>();
        String queryString = 'SELECT Name, Email FROM User LIMIT 1';

        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Test.startTest();
        tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        Test.stopTest();

        System.assert(!tableServiceResponse.isEmpty());
        System.assert(tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
        System.assert(tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));

        List<User> users = (List<User>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
        System.assert(!users.isEmpty());

        List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(
            DataTableService.TABLE_COLUMNS_KEY
        );
        System.assertEquals(2, columns.size());
    }

    @isTest
    static void test_query_has_advanced_where_filter_should_return_response() {
        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        Map<String, Object> tableServiceResponse = new Map<String, Object>();
        String queryString = 'SELECT Name FROM User WHERE Name LIKE \'%BlahBlahBlah%\' LIMIT 1';

        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Test.startTest();
        tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        Test.stopTest();

        List<User> users = (List<User>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
        System.assertEquals(0, users.size());

        List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(
            DataTableService.TABLE_COLUMNS_KEY
        );
        System.assertEquals(1, columns.size());
    }

    @isTest
    static void test_query_has_where_bind_var_should_have_response() {
        Map<String, Object> bindVars = new Map<String, Object>(); // This is the datatype for a bind var
        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        Map<String, Object> tableServiceResponse = new Map<String, Object>();

        // Build our binding var, assuming this is coming form somewhere in the UI or user interaction
        Id userId = UserInfo.getUserId();
        Set<Id> idSet = new Set<Id>();
        idSet.add(userId);
        bindVars.put(DataTableService.ID_SET_KEY, idSet);

        // This is the expected format for a soql using the bind var key
        String queryString = 'SELECT Name, Email FROM User WHERE Id =: idSet';

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

        List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(
            DataTableService.TABLE_COLUMNS_KEY
        );
        System.assertEquals(2, columns.size());
    }

    @isTest
    static void test_query_with_typo_should_return_no_response_and_return_exception() {
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

        System.debug('test_query_with_typo_has_exception_msg errorMessage is: ' + errorMessage);
        System.assert(tableServiceResponse.isEmpty());
        System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
        System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));
        System.assert(String.isNotEmpty(errorMessage));
    }

    @isTest
    static void test_bind_var_set_up_incorrectly_should_return_exception() {
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

        System.debug('test_bind_var_set_up_incorrectly_has_exception_msg errorMessage is: ' + errorMessage);
        System.assert(tableServiceResponse.isEmpty());
        System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_DATA_KEY));
        System.assert(!tableServiceResponse.containsKey(DataTableService.TABLE_COLUMNS_KEY));
        System.assert(String.isNotEmpty(errorMessage));
    }

    @isTest
    static void test_invalid_query_returns_exception_message() {
        String queryString = 'SELECT Name FROM Not_A_Real_Object';

        Test.startTest();
        String error = DataTableService.getQueryExceptionMessage(queryString);
        Test.stopTest();

        System.assertNotEquals(null, error);
    }

    @isTest
    static void test_get_display_type_map_should_return_24_display_types() {
        Test.startTest();
        Map<String, String> displayTypeMap = DataTableService.getDisplayTypeMap();
        Test.stopTest();

        System.assert(!displayTypeMap.isEmpty());
        System.assertEquals(24, displayTypeMap.size());
    }

    @isTest
    static void test_get_action_config_should_return_no_defaults() {
        Test.startTest();
        List<Datatable_Action_Config__mdt> actionConfigs = DataTableService.getActionConfig('No_OOTB_Defaults');
        Test.stopTest();

        System.assert(actionConfigs.isEmpty());
    }

    @isTest
    static void test_get_lookup_config_should_return_defaults() {
        Test.startTest();
        List<Datatable_Lookup_Config__mdt> lookupConfig = DataTableService.getLookupConfig('Default_Lookup_Config');
        Test.stopTest();

        System.assert(!lookupConfig.isEmpty());
    }

    @isTest
    static void test_relationship_query_from_user_to_manager_should_return_multiple_columns() {
        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        Map<String, Object> tableServiceResponse = new Map<String, Object>();
        String queryString = 'SELECT Name, Email, Manager.Name FROM User LIMIT 1';

        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Test.startTest();
        tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        Test.stopTest();

        List<User> users = (List<User>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
        System.assertEquals(1, users.size());

        List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(
            DataTableService.TABLE_COLUMNS_KEY
        );
        System.assertEquals(3, columns.size());
    }

    @isTest
    static void test_query_should_return_various_datatype_columns() {
        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        Map<String, Object> tableServiceResponse = new Map<String, Object>();
        String queryString = '';
        queryString += 'SELECT Name, IsActive, SenderEmail, ';
        queryString += 'Phone, LanguageLocaleKey, AboutMe, Alias, ';
        queryString += 'Username, BannerPhotoUrl, ManagerId ';
        queryString += 'FROM User LIMIT 1';

        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Test.startTest();
        tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        Test.stopTest();

        List<User> users = (List<User>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
        System.assertEquals(1, users.size());

        List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(
            DataTableService.TABLE_COLUMNS_KEY
        );

        Boolean hasCustomName = false;
        Boolean hasBoolean = false;
        Boolean hasEmail = false;
        Boolean hasCustomLookup = false;
        Boolean hasPhone = false;
        Boolean hasCustomPicklist = false;
        Boolean hasText = false;
        Boolean hasUrl = false;

        for (Map<String, Object> col : columns) {
            String columnType = (String) col.get('type');
            if (columnType.equalsIgnoreCase('customName')) {
                hasCustomName = true;
            }
            if (columnType.equalsIgnoreCase('boolean')) {
                hasBoolean = true;
            }
            if (columnType.equalsIgnoreCase('email')) {
                hasEmail = true;
            }
            if (columnType.equalsIgnoreCase('customLookup')) {
                hasCustomLookup = true;
            }
            if (columnType.equalsIgnoreCase('phone')) {
                hasPhone = true;
            }
            if (columnType.equalsIgnoreCase('customPicklist')) {
                hasCustomPicklist = true;
            }
            if (columnType.equalsIgnoreCase('text')) {
                hasText = true;
            }
            if (columnType.equalsIgnoreCase('url')) {
                hasUrl = true;
            }
        }

        System.assertEquals(true, hasCustomName);
        System.assertEquals(true, hasBoolean);
        System.assertEquals(true, hasEmail);
        System.assertEquals(true, hasCustomLookup);
        System.assertEquals(true, hasPhone);
        System.assertEquals(true, hasCustomPicklist);
        System.assertEquals(true, hasText);
        System.assertEquals(true, hasUrl);
    }

    @isTest
    static void test_query_should_return_date_datatype_columns() {
        // Query an object that all orgs should have, the Contact
        Contact con = new Contact(FirstName = 'hello', LastName = 'World', Birthdate = System.today());
        insert con;

        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        Map<String, Object> tableServiceResponse = new Map<String, Object>();
        String queryString = 'SELECT BirthDate, LastCURequestDate FROM Contact LIMIT 1';

        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Test.startTest();
        tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        Test.stopTest();

        List<Contact> contacts = (List<Contact>) tableServiceResponse.get(DataTableService.TABLE_DATA_KEY);
        System.assertEquals(1, contacts.size());

        List<Map<String, Object>> columns = (List<Map<String, Object>>) tableServiceResponse.get(
            DataTableService.TABLE_COLUMNS_KEY
        );

        Boolean hasDate = false;
        Boolean hasDateTime = false;

        for (Map<String, Object> col : columns) {
            String columnType = (String) col.get('type');
            if (columnType.equalsIgnoreCase('date-local')) {
                hasDate = true;
            }
            if (columnType.equalsIgnoreCase('date')) {
                hasDateTime = true;
            }
        }

        System.assertEquals(true, hasDate);
        System.assertEquals(true, hasDateTime);
    }

    @isTest
    static void test_query_should_not_return_disallowed_query_data() {
        List<FieldPermissions> revenueFieldPermissions = [
            SELECT Id, PermissionsEdit, PermissionsRead
            FROM FieldPermissions
            WHERE Parent.Profile.Name = 'Standard User' AND Field = 'Account.AnnualRevenue'
        ];

        for(FieldPermissions fp : revenueFieldPermissions) {
            fp.PermissionsEdit = false;
            fp.PermissionsRead = false;
        }
        update revenueFieldPermissions;

        System.runAs(getAnotherUser()) {
            Test.startTest();
            insertAccountAndTest();
            Test.stopTest();
        }
    }

    @isTest
    static void test_query_should_allow_aggregate_query_without_alias() {
        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        String queryString = 'SELECT Count(Id), Sum(AnnualRevenue) FROM Account';
        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Map<String, Object> tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        List<AggregateResult> results = (List<AggregateResult>) tableServiceResponse.get(
            DataTableService.TABLE_DATA_KEY
        );
        System.assertEquals(1, results.size(), 'Aggregate result was not properly returned');
        System.assertEquals(0, results[0].get('expr0'), 'Count(Id) was not properly returned');
        System.assertEquals(null, results[0].get('expr1'), 'Sum(AnnualRevenue) was not properly returned');
    }

    @isTest
    static void test_query_should_allow_aggregate_query_with_alias() {
        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        String queryString = 'SELECT Count(Id) CountStar, Sum(AnnualRevenue) AnnualRevenueSummed FROM Account';
        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Map<String, Object> tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        List<AggregateResult> results = (List<AggregateResult>) tableServiceResponse.get(
            DataTableService.TABLE_DATA_KEY
        );
        System.assertEquals(1, results.size(), 'Aggregate result was not properly returned');
        System.assertEquals(0, results[0].get('CountStar'), 'Aliased count was not properly returned');
        System.assertEquals(null, results[0].get('AnnualRevenueSummed'), 'Aliased sum was not properly returned');
    }

    @isTest
    static void test_query_should_allow_grouping() {
        insert new Account(AnnualRevenue = 350000, Name = 'TestGrouping');

        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        String queryString = 'SELECT Count(Id) CountStar, Sum(AnnualRevenue) AnnualRevenueSummed, Name FROM Account GROUP BY Name';
        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Map<String, Object> tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        List<AggregateResult> results = (List<AggregateResult>) tableServiceResponse.get(
            DataTableService.TABLE_DATA_KEY
        );
        System.assertEquals(1, results.size(), 'Aggregate result was not properly returned');
        System.assertEquals(1, results[0].get('CountStar'), 'Aliased count was not properly returned');
        System.assertEquals(350000, results[0].get('AnnualRevenueSummed'), 'Aliased sum was not properly returned');
        System.assertEquals('TestGrouping', results[0].get('Name'));
    }

    private static User getAnotherUser() {
        //the fields listed here are the required ones to create a User
        Profile standardProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User'];
        User standardUser = new User(
            Alias = 'tsalt',
            CommunityNickname = 'tsalt',
            Email = 'tsalb@example.com',
            EmailEncodingKey = 'ISO-8859-1',
            FirstName = 'temp_sf_dev',
            LanguageLocaleKey = 'en_US',
            LastName = 'Tsalb',
            LocaleSidKey = 'en_US',
            ProfileId = standardProfile.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            Username = 'tsalb' + System.now().millisecond() + '@example.com'
        );
        insert standardUser;
        return standardUser;
    }

    @future
    private static void insertAccountAndTest() {
        // has to be @future to avoid mixed DML between setup object (PermissionSet/PermissionSetAssignment and Account)
        insert new Account(Name = 'Testington', AnnualRevenue = 100);

        Map<String, Object> tableServiceRequest = new Map<String, Object>();
        String queryString = 'SELECT Id, AnnualRevenue FROM Account LIMIT 1';
        tableServiceRequest.put(DataTableService.QUERY_STRING_KEY, queryString);

        Map<String, Object> tableServiceResponse = DataTableService.getTableCache(tableServiceRequest);
        List<Account> tableData = (List<Account>) tableServiceResponse.get(
            DataTableService.TABLE_DATA_KEY
        );

        System.assertEquals(1, tableData.size());
        //System.SObjectException: SObject row was retrieved via SOQL without querying the requested field: Account.AnnualRevenue
        //when you try to do the assert directly, so let's pull this old trick
        Map<String, Object> deserializedAccount = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(tableData[0]));
        System.assertEquals(
            false,
            deserializedAccount.containsKey(Account.AnnualRevenue.getDescribe().getName()),
            'AnnualRevenue was returned incorrectly'
        );
    }
}
