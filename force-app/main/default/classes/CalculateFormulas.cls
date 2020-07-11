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

public inherited sharing class CalculateFormulas {
    @InvocableMethod(label='Calculates Formulas and Relationship Name Fields for a Record Collection')
    public static List<FlowOutput> calculateFormulasFor(List<FlowInput> inputs) {
        List<FlowOutput> outputs = new List<FlowOutput>();

        for (FlowInput input : inputs) {
            // Sanity check since we're going to do some SOQL later
            if (!isAllSameSObject(input.originalCollection)) {
                throw new AuraHandledException('Records in the collection must be of the same SObject type');
            }

            // First, we check for reference/lookup fields so we can put them back in at the end
            // This is done when the user is trying to display the customLookup datatype
            // prettier-ignore
            Map<String, Schema.SObjectField> fieldMap = input.originalCollection[0].getSObjectType().getDescribe().fields.getMap();
            Map<Id, String> lookupIdToNameFieldMap = new Map<Id, String>();
            for (SObject obj : input.originalCollection) {
                Map<String, Object> fieldsToValue = obj.getPopulatedFieldsAsMap();

                for (String fieldName : fieldsToValue.keySet()) {
                    // Some kind of mismatch, like for lookup field names
                    if (fieldMap.get(fieldName) == null) {
                        continue;
                    }
                    // If not a reference field
                    if (fieldMap.get(fieldName).getDescribe().getReferenceTo().isEmpty()) {
                        continue;
                    }
                    lookupIdToNameFieldMap.put((Id) fieldsToValue.get(fieldName), getLookupNameField(fieldMap));
                }
            }
            System.debug(LoggingLevel.INFO, 'CalculateFormulas lookupIdToNameFieldMap: ' + lookupIdToNameFieldMap);

            // Prep for recalculation or add directly (typically used when user wants relationship name fields calced via SOQL)
            List<SObject> collectionToHydrate = new List<SObject>();
            for (SObject obj : input.originalCollection) {
                if (!input.formulaFieldsToCalculate.isEmpty()) {
                    for (String fieldName : input.formulaFieldsToCalculate) {
                        collectionToHydrate.add(setReadOnlyField(obj, fieldName, null));
                    }
                } else {
                    collectionToHydrate.add(obj);
                }
            }
            System.debug(LoggingLevel.INFO, 'CalculateFormulas collectionToHydrate: ' + collectionToHydrate);

            // Hydration happens here
            FlowOutput output = new FlowOutput();
            for (FormulaRecalcResult result : Formula.recalculateFormulas(collectionToHydrate)) {
                output.hydratedCollection.add(result.getSObject());
            }

            // And finally we stitch the SOQL back into the hydrated collection. Due to the SOQL in a loop here,
            // CalculateFormulas should only ever be used for Screen Flows (which makes sense).
            if (!lookupIdToNameFieldMap.isEmpty()) {
                // Establish the actual values of the name field
                List<Id> scopeIds = new List<Id>(lookupIdToNameFieldMap.keySet());
                String queryString = '';
                queryString += 'SELECT Id, ' + lookupIdToNameFieldMap.values()[0];
                queryString += ' FROM ' + scopeIds[0].getSobjectType().getDescribe().getName();
                queryString += ' WHERE Id = :scopeIds';
                System.debug(LoggingLevel.INFO, 'CalculateFormulas queryString: ' + queryString);
                Map<Id, SObject> lookupIdToNameValueMap = new Map<Id, SObject>(Database.query(queryString));
                System.debug(LoggingLevel.INFO, 'CalculateFormulas lookupIdToNameValueMap: ' + lookupIdToNameValueMap);

                // Then work backwards from the Id value on each already formula recalculated row
                for (SObject row : output.hydratedCollection) {
                    Map<String, Object> fieldsToValue = row.getPopulatedFieldsAsMap();
                    for (String fieldName : fieldsToValue.keySet()) {
                        if (fieldsToValue.get(fieldName) instanceof Id) {
                            Id lookupId = (Id) fieldsToValue.get(fieldName);
                            // When a match is found, put the queried object back in for collectionDatatable to flatten
                            if (lookupIdToNameValueMap.keySet().contains(lookupId)) {
                                SObject objectWithData = lookupIdToNameValueMap.get(lookupId);
                                String objectName = objectWithData.getSObjectType().getDescribe().getName();
                                row.putSObject(objectName, objectWithData);
                            }
                        }
                    }
                }
            }
            System.debug(LoggingLevel.INFO, 'CalculateFormulas output: ' + output);
            outputs.add(output);
        }
        return outputs;
    }

    private static SObject setReadOnlyField(SObject sobj, String fieldName, Object value) {
        return setReadOnlyField(sobj, new Map<String, Object>{ fieldName => value });
    }

    private static SObject setReadOnlyField(SObject sobj, Map<String, Object> changesToFields) {
        String serializedRecord = JSON.serialize(sobj);
        Map<String, Object> deserializedRecordMap = (Map<String, Object>) JSON.deserializeUntyped(serializedRecord);
        // Loop through the deserialized record map and put the field & value
        // Since it's a map, if the field already exists on the SObject, it's updated (or added if it wasn't there already)
        for (String sobjectField : changesToFields.keySet()) {
            deserializedRecordMap.put(sobjectField, changesToFields.get(sobjectField));
        }
        serializedRecord = JSON.serialize(deserializedRecordMap);
        return (SObject) JSON.deserialize(serializedRecord, SObject.class);
    }

    private static Boolean isAllSameSObject(List<SObject> collection) {
        Set<String> objectNames = new Set<String>();
        for (SObject obj : collection) {
            objectNames.add(obj.getSObjectType().getDescribe().getName());
        }
        return new List<String>(objectNames).size() == 1;
    }

    private static String getLookupNameField(Map<String, Schema.SObjectField> fieldMap) {
        Schema.SObjectField nameField;
        for (Schema.SObjectField curField : fieldMap.values()) {
            if (curField.getDescribe().isNameField()) {
                nameField = curField;
                break;
            }
        }
        return nameField.getDescribe().getName();
    }

    public class FlowInput {
        @InvocableVariable(label='Record Collection to recalculate' required=true)
        public List<SObject> originalCollection;

        @InvocableVariable(
            label='List of formula fields for calculation'
            description='If only recalculating relationship name fields, this can be blank.'
        )
        public List<String> formulaFieldsToCalculate = new List<String>();
    }

    public class FlowOutput {
        @InvocableVariable(label='Record Collection with formulas and relationship name fields recalculated')
        public List<SObject> hydratedCollection = new List<SObject>();
    }
}
