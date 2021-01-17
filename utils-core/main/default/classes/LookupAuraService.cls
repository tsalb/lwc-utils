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
public with sharing class LookupAuraService {
  @AuraEnabled
  public static String getOneRecordById(Searchable searcher, Id recordId) {
    List<String> expr = new List<String>();
    expr.add('SELECT ' + String.join(searcher.fields, ', '));
    expr.add('FROM ' + String.escapeSingleQuotes(searcher.objectName));
    expr.add('WHERE Id = \'' + recordId + '\'');
    expr.add('LIMIT 1');

    String queryString = String.join(expr, ' ');
    System.debug('query string: ' + queryString);
    return JSON.serialize(Database.query(queryString));
  }

  @AuraEnabled(cacheable=true)
  public static String getRecent(Searchable searcher) {
    Set<Id> recentIds = new Set<Id>();
    for (RecentlyViewed rv : queryRecentByType(searcher.objectName)) {
      recentIds.add(rv.Id);
    }

    List<String> expr = new List<String>();
    expr.add('SELECT ' + String.join(searcher.fields, ', '));
    expr.add('FROM ' + String.escapeSingleQuotes(searcher.objectName));
    expr.add('WHERE Id IN (\'' + String.join(new List<Id>(recentIds), '\', \'') + '\')');

    return JSON.serialize(Database.query(String.join(expr, ' ')));
  }

  @AuraEnabled(cacheable=true)
  public static String getRecords(Searchable searcher) {
    String find = 'FIND \'' + String.escapeSingleQuotes(searcher.searchTerm) + '*\' IN ALL FIELDS';
    String returning = 'RETURNING ' + getReturning(searcher.objectName, searcher.fields);
    String limitter = 'LIMIT ' + 5;
    String query = find + ' ' + returning + ' ' + limitter;
    return JSON.serialize(System.Search.query(query));
  }

  private static String getReturning(String objectName, List<String> fields) {
    List<String> returning = new List<String>();
    String objectWithFields = objectName + (fields.isEmpty() ? '' : joinReturnFields(fields));
    returning.add(objectWithFields);
    return String.join(returning, ', ');
  }

  private static String joinReturnFields(List<String> fields) {
    return ' (' + String.escapeSingleQuotes(String.join(fields, ', ')) + ')';
  }

  private static List<RecentlyViewed> queryRecentByType(String objectName) {
    return [SELECT Id FROM RecentlyViewed WHERE Type = :objectName LIMIT 5];
  }

  public class Searchable {
    @AuraEnabled
    public String searchTerm { get; set; }
    @AuraEnabled
    public String objectName { get; set; }
    @AuraEnabled
    public List<String> fields { get; set; }
  }
}
