/*************************************************************
 *  @author: James Hou, james@sparkworks.io
 *  Date: 8-2018
 **************************************************************/

public with sharing class DataServiceCtrl {
    @AuraEnabled(cacheable=true)
    public static Data getAccountOptions() {
        Data valueLabels = new Data();
        List<AggregateResult> aggList = new List<AggregateResult>(
            [
                SELECT AccountId accId, Account.Name accName
                FROM Contact
                GROUP BY AccountId, Account.Name HAVING count(Name) > 0
                ORDER BY count(Name) DESC
                LIMIT 10
            ]
        );
        for (AggregateResult ar : aggList) {
            valueLabels.items.add(new Item((String) ar.get('accId'), (String) ar.get('accName')));
        }
        return valueLabels;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getAccountOptionsCache() {
        Map<String, Object> optionsCache = new Map<String, Object>();
        List<AggregateResult> aggList = new List<AggregateResult>(
            [
                SELECT AccountId accId, Account.Name accName
                FROM Contact
                GROUP BY AccountId, Account.Name HAVING count(Name) > 0
                ORDER BY count(Name) DESC
                LIMIT 10
            ]
        );
        List<Map<String, Object>> items = new List<Map<String, Object>>();
        for (AggregateResult ar : aggList) {
            Map<String, Object> option = new Map<String, Object>{
                'value' => (String) ar.get('accId'),
                'label' => (String) ar.get('accName')
            };
            items.add(option);
        }
        optionsCache.put('items', items);
        return optionsCache;
    }

    @AuraEnabled(cacheable=true)
    public static List<Contact> wireContactsByAccountId(String accountId) {
        return DataServiceCtrl.getContactsByAccountId(accountId);
    }

    @AuraEnabled
    public static List<Contact> getContactsByAccountId(String accountId) {
        try {
            return [
                SELECT
                    Name,
                    Email,
                    Phone,
                    MailingStreet,
                    MailingCity,
                    MailingState,
                    MailingPostalCode,
                    MailingCountry,
                    AccountId,
                    Id
                FROM Contact
                WHERE AccountId = :accountId
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean updateMultiContactAddress(
        List<Contact> conList,
        String conStreet,
        String conCity,
        String conState,
        String conZip,
        String conCountry
    ) {
        List<Contact> contactsToUpdate = new List<Contact>();
        for (Contact c : conList) {
            contactsToUpdate.add(
                new Contact(
                    Id = c.Id,
                    MailingStreet = conStreet,
                    MailingCity = conCity,
                    MailingState = conState,
                    MailingPostalCode = conZip,
                    MailingCountry = conCountry
                )
            );
        }
        try {
            update contactsToUpdate;
            return true;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class Item {
        @AuraEnabled
        public String value;
        @AuraEnabled
        public String label;

        public Item(String value, String label) {
            this.value = value;
            this.label = label;
        }
    }

    public class Data {
        @AuraEnabled
        public List<Item> items;

        public Data() {
            this.items = new List<Item>();
        }
    }
}
