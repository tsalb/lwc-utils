({
  doInit : function(component, event, helper) {
    let contactRecordId = [].concat(component.get("v.contactRecordId")); // guarantees array for idSet
    if (!$A.util.isEmpty(contactRecordId)) {
      let tableRequest = {
        queryString: "SELECT "
                   + "Id, CaseNumber, CreatedDate, ClosedDate, Description, Comments, Status, Subject, Type, Owner.Name "
                   + "FROM Case "
                   + "WHERE ContactId =: idSet "
                   + "ORDER BY CaseNumber ASC",
        bindVars: {
          idSet: contactRecordId,
        }
      }
      helper.tableService(component).fetchData(
        tableRequest,
        $A.getCallback((error, data) => {
          if (!$A.util.isEmpty(data)) {
            component.set("v.tableData", data.tableData);
            component.set("v.tableColumns", data.tableColumns);
          } else {
            if (!$A.util.isEmpty(error) && error[0].hasOwnProperty("message")) {
              helper.messageService(component).showToast({
                message: error[0].message,
                variant: "error"
              });
            }
          }
        })
      );
    }
  }
})