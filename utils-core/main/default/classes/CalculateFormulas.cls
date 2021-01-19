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
  @InvocableMethod(label='Calculates Formulas for a Record Collection')
  public static List<FlowOutput> calculateFormulasFor(List<FlowInput> inputs) {
    List<FlowOutput> outputs = new List<FlowOutput>();

    for (FlowInput curInput : inputs) {
      List<SObject> collectionToHydrate = new List<SObject>();
      for (SObject obj : curInput.originalCollection) {
        for (String field : curInput.formulaFieldsToCalculate) {
          collectionToHydrate.add(setReadOnlyField(obj, field, null));
        }
      }
      System.debug(LoggingLevel.INFO, 'CalculateFormulas collectionToHydrate: ' + collectionToHydrate);
      FlowOutput output = new FlowOutput();
      output.hydratedCollection = new List<SObject>();
      for (FormulaRecalcResult result : Formula.recalculateFormulas(collectionToHydrate)) {
        output.hydratedCollection.add(result.getSObject());
      }
      System.debug(LoggingLevel.INFO, 'CalculateFormulas hydratedCollection: ' + output.hydratedCollection);
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

  public class FlowInput {
    @InvocableVariable(label='Record Collection to Rehydrate' required=true)
    public List<SObject> originalCollection;

    @InvocableVariable(label='Formula Fields to Recalculate' description='Comma separated list of Field API Names')
    public List<String> formulaFieldsToCalculate = new List<String>();
  }

  public class FlowOutput {
    @InvocableVariable(label='Record Collection with Recalculated Formulas')
    public List<SObject> hydratedCollection = new List<SObject>();
  }
}
