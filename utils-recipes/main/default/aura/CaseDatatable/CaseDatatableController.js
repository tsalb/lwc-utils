({
  doInit: function (component, event, helper) {
    const contactRecordId = component.get('v.contactRecordId');
    // prettier-ignore
    const queryString =
      'SELECT ' +
      'Id, CaseNumber, CreatedDate, ClosedDate, Description, Comments, Status, Subject, Type, Owner.Name ' +
      'FROM Case ' +
      'WHERE ContactId = \''+contactRecordId+'\'' +
      'ORDER BY CaseNumber ASC';
    component.set('v.queryString', queryString);
  }
});
