/*************************************************************
*  @author: James Hou, james@sparkworks.io
*  Date: 8-2019
**************************************************************/

public class PermissionService {

  @AuraEnabled
  public static Boolean checkPermission(String apiName) {
    return FeatureManagement.checkPermission(apiName);
  }

}
