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
private class CalculateFormulasTests {
  @isTest
  static void test_request_should_get_response_but_with_no_hydrated_sobjects() {
    List<User> userList = [SELECT Id, Name, Email FROM User LIMIT 1];
    List<String> fieldsToRecalc = new List<String>{ 'Email' };
    List<CalculateFormulas.FlowInput> inputs = new List<CalculateFormulas.FlowInput>();

    CalculateFormulas.FlowInput input = new CalculateFormulas.FlowInput();
    input.originalCollection = userList;
    input.formulaFieldsToCalculate = fieldsToRecalc;
    inputs.add(input);

    Test.startTest();
    List<CalculateFormulas.FlowOutput> outputs = CalculateFormulas.calculateFormulasFor(inputs);
    Test.stopTest();

    System.assertEquals(1, outputs.size());
    List<SObject> hydratedCollection = outputs[0].hydratedCollection;
    // No formula fields on User means Formula.recalculateFormulas() will return nothing
    System.assertEquals(0, hydratedCollection.size());
  }
}
