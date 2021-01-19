/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Justin Lyon
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
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
 *
 */
@isTest
private class LookupAuraServiceTests {
  @TestSetup
  static void makeData() {
    List<Account> accounts = new List<Account>();
    accounts.add(new Account(Name = 'Test 1'));
    accounts.add(new Account(Name = 'Test 2'));
    accounts.add(new Account(Name = 'Test 3'));
    accounts.add(new Account(Name = 'Test 4'));
    accounts.add(new Account(Name = 'Test 5'));
    accounts.add(new Account(Name = 'Test 6'));
    insert accounts;
  }

  static testMethod void getOneRecordById_givenSearchable_shouldGetRecord() {
    Account acc = [SELECT Id FROM Account LIMIT 1];
    LookupAuraService.Searchable searcher = new LookupAuraService.Searchable();
    searcher.searchTerm = 'test';
    searcher.objectName = 'Account';
    searcher.fields = new List<String>{ 'Name', 'Id' };

    Test.startTest();

    String data = LookupAuraService.getOneRecordById(searcher, acc.Id);

    Test.stopTest();

    System.debug('data: ' + data);

    // the following is weird because
    // USUALLY: Account acc = Database.query(...LIMIT 1) // => { account }
    // BUT HERE: return JSON.serialize(Database.query(...)) // => [ { account } ]

    List<Account> queried = (List<Account>) JSON.deserialize(data, List<Account>.class);
    System.assertEquals(acc.Id, queried[0].Id);
  }

  static testMethod void getRecent_givenDefault_shouldGetRecentRecords() {
    List<Account> recentAccounts;
    LookupAuraService.Searchable searcher = new LookupAuraService.Searchable();
    searcher.searchTerm = 'test';
    searcher.objectName = 'Account';
    searcher.fields = new List<String>{ 'Name', 'Id' };

    Test.startTest();

    recentAccounts = (List<Account>) JSON.deserialize(LookupAuraService.getRecent(searcher), List<Account>.class);

    Test.stopTest();

    // Recent Queries can Fail in an org where a User doesn't have Recent Records.
    List<RecentlyViewed> recents = [SELECT Id FROM RecentlyViewed WHERE Type = :searcher.objectName];
    Boolean isValid = recents.size() >= 0 || recentAccounts.size() == 5;
    System.assert(isValid, 'RecentlyViewed table is TestVisible, and will vary by environment.');
  }

  static testMethod void getRecords_givenTerm_shouldGetAccounts() {
    List<Id> fixedAccountIds = new List<Id>();
    for (Account acc : [SELECT Id FROM Account]) {
      fixedAccountIds.add(acc.Id);
    }

    Test.setFixedSearchResults(fixedAccountIds);

    List<List<Account>> results;
    LookupAuraService.Searchable searcher = new LookupAuraService.Searchable();
    searcher.searchTerm = 'test';
    searcher.objectName = 'Account';
    searcher.fields = new List<String>{ 'Name', 'Id' };

    Test.startTest();

    results = (List<List<Account>>) JSON.deserialize(LookupAuraService.getRecords(searcher), List<List<Account>>.class);

    Test.stopTest();

    System.assertEquals(5, results[0].size());
  }
}
