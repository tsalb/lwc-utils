<!-- omit in toc -->
# LWC Utils 

Reusable LWCs to 10x your solution building.

- `messageService`: Lightning Message Service (LMS) simplified component messaging.
- `SOQL Datatable`: Leverage SOQL to power your list views, related lists, and Screen Flows.
- `Collection Datatable`: Display Collections and Selected Rows from SOQL Datatable in Screen Flows.
- Design patterns leveraging both Aura and LWC to dynamically create dialogs (modals) for better UX.
- Launch Screen Flows dynamically inside a dialog (modal) from anywhere.

In this README:

- [Component Library Overview](#component-library-overview)
  - [messageService](#messageservice)
  - [DialogService](#dialogservice)
  - [MessageServiceHandler](#messageservicehandler)
  - [FlowWrapper](#flowwrapper)
  - [dialogAutoCloser](#dialogautocloser)
  - [soqlDatatable](#soqldatatable)
    - [soqlDatatable - Features and Examples](#soqldatatable---features-and-examples)
  - [collectionDatatable](#collectiondatatable)
    - [collectionDatatable - Features and Examples](#collectiondatatable---features-and-examples)

<!-- omit in toc -->
## Installation

With SFDX + Scratch Orgs:

1) See pre-requisite steps in the official [lwc-recipes](https://github.com/trailheadapps/lwc-recipes#installing-the-app-using-a-scratch-org) repo.

2) Clone this repo to a desired directory and navigate into it:

```
git clone https://github.com/tsalb/lwc-utils
cd lwc-utils
```

3) Use VSCode's [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) (or equivalent) to:
- SFDX: Create a Default Scratch Org.
- SFDX: Push Source to Default Scratch Org.
- SFDX: Open Default Org.

With Deploy to Salesforce:

<a href="https://githubsfdeploy.herokuapp.com?owner=tsalb&repo=lwc-utils&ref=summer-20">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>

> **NOTE:** This button will deploy this current `summer-20` branch to a target sandbox ONLY if that sandbox is also on summer 20.

## Component Library Overview

| Component Name | Description | Component Type |
|-|-|-|
| `messageService`<br><br>[Example](#messageService)<br>[Code](./force-app/main/default/lwc/messageService/messageService.js#L41) | Use one API to communicate **within** or **across** both Aura and LWC technologies.<br><br>Use this component instead of manually publishing / subscribing to `Lightning Message Service` (LMS).<br><br>Provides a psuedo-namespacing property called `boundary` which can separate subscribers by string, `recordId` etc. | LWC:<br>- Service |
| `DialogService`<br><br>[Example](#DialogService)<br>[Code](./force-app/main/default/aura/DialogService) | Provide LWCs access to `lightning:overlayLibrary` to create dialogs (modals) via LMS.<br><br>Both Aura and LWCs can be created dynamically and injected as the dialog body.<br><br>Both Aura's public `attributes` and LWC's `@api` properties can be passed in. | Aura:<br>- Service |
| `MessageServiceHandler`<br><br>[Example](#MessageServiceHandler)<br>[Code](./force-app/main/default/aura/MessageServiceHandler) | Provides access to `DialogService` by handling the `opendialog` LMS event.<br><br>This is a hidden component you need to place on the flexipage or utility bar (hidden, empty label). | Aura:<br>- Service<br>- Utility Bar <br>- Record Flexipage |
| `EventFooter`<br><br>[Code](./force-app/main/default/aura/EventFooter) | Dynamic footer for lwc dialogs. Meant to be used by `DialogService`.<br><br>Contains an instance of `messageService` listening for the `closedialog` LMS Event.<br><br>Unfortunately, `component.getReference()` does not work on LWCs. Write your own action button in the dialog body. | Aura:<br>- Service |
| `ModalFooter`<br><br>[Code](./force-app/main/default/aura/ModalFooter) | Dynamic footer for aura dialogs. Meant to be used by `DialogService`.<br><br>Connects a primary action on the target dialog body to the footer's main action via `component.getReference()`<br><br>Enables writing functions directly on the dialog body and `DialogService.modal()` will connect it to a primary action. | Aura:<br>- Service |
| `FlowWrapper`<br><br>[Example](#FlowWrapper)<br>[Code](./force-app/main/default/aura/FlowWrapper) | Enables `messageService` to create flows inside a dialog body dynamically.<br><br>Can be used with `dialogAutoCloser` (LWC flow component) to automatically close a dialog launched by this component.<br><br>See [`flowWizardLauncherExample`](./force-app/main/default/lwc/flowWizardLauncherExample/flowWizardLauncherExample.js#L19) | Aura:<br>- Service |
| `dialogAutoCloser`<br><br>[Example](#dialogAutoCloser)<br>[Code](./force-app/main/default/lwc/dialogAutoCloser) | Contains a progress bar and timer message (optional).<br><br>Automatically tells the current dialog with the `closerfooter` LMS event.<br><br>Use `uniqueBoundary` to target a specific dialog to close if [Tab-Focused Dialogs is Enabled](https://releasenotes.docs.salesforce.com/en-us/winter20/release-notes/rn_console_dialogs.htm) | LWC:<br>- Service<br>- Flow Screen |
| `soqlDatatable`<br><br>[Example](#soqlDatatable)<br>[Code](./force-app/main/default/lwc/soqlDatatable) | A SOQL powered list view. Meant to replace any related list / list view.<br><br>Supports record context, in-line editing, configurable table/row actions, output of selected rows to Flow (or other LWCs) and more.<br><br>See example for full features. | LWC:<br>- Service<br>- App Flexipage<br>- Record Flexipage<br>- Flow Screen |
| `collectionDatatable`<br><br>[Example](#collectionDatatable)<br>[Code](./force-app/main/default/lwc/collectionDatatable) | Display Record Collections inside Flow Screens. Meant to mimic a related list / list view.<br><br>Can be populated from a Flow's `Get Records` element or `soqlDatatable.selectedRows` output. | LWC:<br>- Flow Screen |

### messageService

Leverages `Lightning Message Service` on `OpenChannel__c` to message `payloads` in a `key` / `value` format as defined in `OpenChannel__c` like this:

```js
const payload = { 
    key: 'coolevent',
    value: {
        hello: 'world',
        foo: 'bar'
    }
}
this._messageService.publish(payload);

// or, my preferred method, this way

const payload = {
    accountId: '12345'
}
this._messageService.publish({key: 'supercoolevent', value: payload});
```

And handled like this, composed on the template

```html
<c-message-service
    boundary="sample_app_lwc"
    oncoolevent={handleCoolEvent}
    onsupercoolevent={handleSuperCoolEvent}
></c-message-service>
```
```js
handleCoolEvent(event) {
    console.log(event.detail.value.hello) // world
    console.log(event.detail.value.foo) // bar
}

handleSuperCoolEvent(event) {
    const payload = event.detail.value
    console.log(payload.accountId) // 12345
}
```

This component doesn't need to subscribe to an event, it can be used for publish only:

```html
<!-- No listeners, but has a boundary set for any publish() calls -->
<c-message-service boundary={recordId}></c-message-service>

... or

<!-- No listeners, no boundary set for any publish() calls -->
<c-message-service></c-message-service>
```

This component also provides public methods to Aura only APIs like `overlayLibrary`.

For example, using `.dialogService()` ultimately routes to `DialogService.cmp`:

```js
const dialogServicePayload = {
    method: 'bodyModalLarge',
    config: {
        auraId: 'soql-datatable-example',
        headerLabel: 'Dynamically Created SOQL Datatable',
        component: 'c:soqlDatatable',
        componentParams: {
            isRecordBind: false,
            recordId: this.recordId,
            queryString: query
        }
    }
};
this._messageService.dialogService(dialogServicePayload);
```

<details>
    <summary>messageService Specification</summary>

⠀

**Attributes**

| name | type | access | required | default | description |
|-|-|-|-|-|-|
| boundary | string | public | no |  | Filter subscription messages like a namespace.<br><br>e.g. `recordId` if you only want same components on same record flexipage to handle the publish.<br><br>e.g. `sample_app_lwc` as reference among various components that share the same functionality.<br><br>Enablement of `APPLICATION_SCOPE` like in [this diagram](/readme-images/rn_lc_lms_scope.png) is not currently enabled. |

**Public Methods**

| name | arguments | description |
|-|-|-|
| dialogService | (`payload`) | `payload` is in the shape required by `MessageServiceHandler`. Examples:<br>[`flowWizardLauncherExample`](./force-app/main/default/lwc/flowWizardLauncherExample/flowWizardLauncherExample.js#L18)<br>[`lwcContactDatatable`](./force-app/main/default/lwc/lwcContactDatatable/lwcContactDatatable.js#L73)<br>[`soqlDatatableLauncherExample`](./force-app/main/default/lwc/soqlDatatableLauncherExample/soqlDatatableLauncherExample.js#L12) |
| notifyClose |  | Uses `publishOpen` to fire a `closedialog` LMS Event which will close any dialog opened by `DialogService` |
| publish | (`payload`) | Leverages LMS's `publish` functionality.<br>Defaults to no `boundary`.<br>If `boundary` is set, all subscribers will require the same `boundary`. |
| publishOpen | (`payload`) | Leverage LMS's `publish` functionality without `boundary`. Any subscriber can react to this event.<br>// TODO Useful for `closedialog` unless this [critical update](https://releasenotes.docs.salesforce.com/en-us/winter20/release-notes/rn_console_dialogs.htm) is enabled.<br>// TODO When a user can simultaneously open multiple dialogs in service console, it's better to set a `boundary`. |
| forceRefreshView |  | Uses `eval("$A.get('e.force:refreshView').fire();");` directly. |
| notifySuccess | (`title`, `message` = null) | Convenience function for `ShowToastEvent` |
| notifyInfo | (`title`, `message` = null) | Convenience function for `ShowToastEvent` |
| notifySingleError | (`title`, `error` = '') | Convenience function for `ShowToastEvent`.<br>`error` object can be passed directly in, it will be reduced/parsed by `c-utils.reduceError`. |
</details>

### DialogService

This component is composed inside `MessageServiceHandler` and provides it with the public methods for creating modals via Aura's `overlayLibrary`. 

Primarily used by `messageService` for message publishing, `MessageServiceHandler` receives the subscription and delegates to this component.

It is not recommended to use this component directly.

<details>
    <summary>DialogService Specification</summary>

⠀

**Attributes**

| name | type | access | required | default | description |
|-|-|-|-|-|-|
| overlayPromise | Object | public | no |  | Stores the returned overlay promise from `overlayLibrary`.<br><br>If a `callback` is specified by the caller, this is returned. |

**Public Methods**

Arguments for this component are not in JS Object `{}` notation so that they can be explicitly listed out in the component itself.

For that reason, it is recommended to use `messageService` / `MessageServiceHandler` to call these functions.

| name | arguments | description |
|-|-|-|
| showPopover | (<br>  `body`,<br>  `bodyParams`,<br>  `referenceSelector`,<br>  `cssClass`,<br>  `callback`<br>) | No examples for this one yet. |
| modal | (<br>  `auraId`,<br>  `headerLabel`,<br>  `body`,<br>  `bodyParams`,<br>  `mainActionReference`,<br>  `mainActionLabel`,<br>  `callback`,<br>) | Compatible with Aura dialog bodies.<br><br>`body` is the component name (Aura notation) to be created in a dialog.<br><br>`bodyParams` are public attributes to be passed from the caller to the body.<br><br>`mainActionReference` uses `component.getReference` to connect the primary action in `ModalFooter` to a function on the body to be created.<br>This allows you to avoid writing a button specifically at the bottom of the body to be created.<br><br>`mainActionLabel` changes the label of the primary action on `ModalFooter`.<br><br>`callback` is optionally specified to return the `overlayPromise` if needed. Alternatively, listen for the `dialogready` LMS Event. |
| modalLarge | (<br>  `auraId`,<br>  `headerLabel`,<br>  `body`,<br>  `bodyParams`,<br>  `mainActionReference`,<br>  `mainActionLabel`,<br>  `callback`,<br>  `isLargeModal = true`<br>) | Compatible with Aura dialog bodies.<br><br>Same as `modal`, with wider dialog box using `slds-modal_large` |
| bodyModal | (<br>  `auraId`,<br>  `headerLabel`,<br>  `body`,<br>  `bodyParams`,<br>  `callback`<br>) | Compatible with LWC dialog bodies.<br><br>Same as `modal` except without connectivity to a `mainAction` via `component.getReference` which doesn't work on LWCs, even with `@api` functions.<br><br>Instead, a slim footer called `EventFooter` is created which is subscribing to the `dialogclose` event for closing the dialog.<br><br>Write your own `Cancel` and `Primary Action` button on the dialog body that is dynamically being created. |
| bodyModalLarge | (<br>  `auraId`,<br>  `headerLabel`,<br>  `body`,<br>  `bodyParams`,<br>  `callback`,<br>  `isLargeModal = true`<br>) | Compatible with LWC dialog bodies.<br><br>Same as `bodyModal`, with wider dialog box using `slds-modal_large` |
</details>

### MessageServiceHandler

This component parses the `messageService.dialogService()` payload. It expects two properties:

```js
const flowOrDialogServicePayload = {
    method: 'bodyModal', // or bodyModalLarge, flowModal, flowModalLarge
    config: {
        <see flowWizardLauncherExample>
        <or soqlDatatableLauncherExample>
    }
}
```

As of early Summer 20, `Lightning Message Service` requires rendering on the DOM to be connected.

Because of this limitation, this component is designed to be placed once on the utility bar (rendered, but hidden label) OR per flexipage.

This component is very simple which just listens and delegates to `DialogService`.

```html
<aura:component implements="lightning:utilityItem">
    <c:DialogService aura:id="dialogService" />
    <c:messageService aura:id="messageService" onopendialog="{! c.handleDialogService }" />
    <c:singleton aura:id="singleton" />
</aura:component>
```

<details>
    <summary>MessageServiceHandler Specification</summary>

⠀

**Attributes**

None

**Public Methods**

None

</details>

### FlowWrapper

This component wraps `lightning:flow` and is designed to be created dynamically by `DialogService`.

So then, the component itself is very simple.

```html
<aura:component>
    <c:messageService aura:id="messageService" />
    <aura:attribute name="flowApiName" type="String" access="PUBLIC" />
    <aura:attribute name="inputVariables" type="Object[]" access="PUBLIC" />
    <aura:handler name="init" value="{! this }" action="{! c.doInit }" />
    <div class="slds-is-relative">
        <lightning:flow aura:id="flow" onstatuschange="{! c.handleStatusChange }" />
    </div>
</aura:component>
```

<details>
    <summary>FlowWrapper Specification</summary>

⠀

**Attributes**

| name | type | access | required | default | description |
|-|-|-|-|-|-|
| flowApiName | String | public | yes |  | Developer Name of the flow to be dynamically created by `lightning:flow` |
| inputVariables | Object[] | public | yes |  | Array of inputs in flow's `[{ name: 'flowVarName', type: 'String', value: 'my cool string value!' }]` |

**Public Methods**

None

</details>

### dialogAutoCloser

A simple component that counts down and auto closes a dialog with the `closedialog` LMS Event.

```html
<template>
    <c-message-service></c-message-service>
    <lightning-layout horizontal-align="center" multiple-rows>
        <lightning-layout-item flexibility="shrink">
            {messageTemplate}
        </lightning-layout-item>
        <lightning-layout-item size="12">
            <lightning-progress-bar value={progress}></lightning-progress-bar>
        </lightning-layout-item>
    </lightning-layout>
</template>
```

```js
    @api messageTemplate = 'Auto closing in {timer} seconds';
    @api timer = 5;
    
    ...

    renderedCallback() {
        if (this._isRendered) {
            return;
        }
        this._isRendered = true;
        this._startProgressInterval();
        this._startTimerInterval();
    }
```

<details>
    <summary>dialogAutoCloser Specification</summary>

⠀

**Attributes**

| name | type | access | required | default | description |
|-|-|-|-|-|-|
| messageTemplate | String | public | no | Auto closing in {timer} seconds | Message to display to user while countdown is running |
| timer | Number | public | no | 5 | Seconds until the component launches the `closedialog` LMS event |

**Public Methods**

None
</details>

### soqlDatatable

Create a fully featured `lightning-datatable` with just a SOQL String.

This component can be used on a Flexipage as a list view or a related list. This can even be used inside Screen Flows.

Since this is built on top of the `lightning-datatable` base component, all the bells and whistles can be inherited.

The below example showcases how easy it is to create a `soqlDatatable` right in the Lightning App Builder with the following query string:

```
SELECT Name, Email, Phone, LeadSource, Level__c, AccountId, Account.Type FROM Contact LIMIT 50
```

![soql-datatable-app-builder](readme-images/soql-datatable-app-builder.png?raw=true)

#### soqlDatatable - Features and Examples

<!-- Psuedo-spoiler tags can be formed like this. Line break is required! -->
<details>
    <summary>Using Record Context with <code>$CurrentRecord</code> in the SOQL</summary>

⠀

`$CurrentRecord` and `$recordId` are special syntax that allows for merge-fields of current record data into the SOQL string. By using them, you can merge current record context as values in the `WHERE` clause as follows:

```js
// Find other Accounts similar to this Account's Industry
SELECT Name, Type, Website, Industry
FROM Account
WHERE Industry = $CurrentRecord.Industry
AND Id != $recordId

// Find related contacts with same MailingState as this Account's BillingState
SELECT Name, Email, MailingState, Account.BillingState
FROM Contact
WHERE AccountId = $recordId
AND MailingState = $CurrentRecord.BillingState
```

This uses Lightning Data Service (`getRecord`) to retrieve and resolve the record values, so make sure your user(s) have FLS enabled for any fields you plan on using the `$CurrentRecord` feature with.  

All data types that can be SOQL-ed are supported for `$CurrentRecord`.

Please submit issues to this repo if you find one that cannot be merged correctly.
</details>

<details>
    <summary>Inline Editing / Mass Inline Editing</summary>

⠀

Define which fields can be editable in a comma separated list in the `Editable Fields` design attribute. For data types that are supported in the vanilla `lightning-datatable`, such as `date`, `text`, `number`, those are relied on as heavily as possible.

For data types such as `picklist` and `lookup` which are yet to be [supported](https://trailblazer.salesforce.com/ideaView?id=0873A000000PZJ4QAO), this component provides custom data types as follows.

**Picklist Custom Data Type**

This custom data type is surfaced as `customPicklist`. It always places a `--None--` value, regardless of if your picklist is configured to always require a value. The save will fail and user will need to correct it to move on.

`RecordType` restricted picklist values are supported with a limitation:

> When using mass edit on a Picklist field for a Standard Object enabled with Record Types, it's possible to mass apply a value which does not belong on that table. This seems to be because Standard Object picklist fields do not have the `Restrict picklist to the values defined in the value set` option.

The actual picklist edit cell is a fork of the one authored by jlyon87 as found [here](https://github.com/jlyon87/lwc-picklist)

**Lookup Custom Data Type**

The custom LWC data type is surfaced as `customLookup`.

Each `soqlDatatable` can be have one defined **Lookup Configuration** (`Datatable_Config__mdt`) to define lookup search behavior.

Because of a limitation with cmdt, the `Type__c` on the parent `Datatable_Config__mdt` must be `Lookups`.

When using inline edit and lookup, there are two properties that are set as global defaults on `Datatable_Lookup_Config__mdt` that help with the search results:

- **Title**: Name of the Record
- **Subtitle**: null

However, in this sample repo, they are overridden by the following settings:

![soql-datatable-lookup-defaults.png](/readme-images/soql-datatable-lookup-defaults.png?raw=true)

Which produces this kind of search result:

<p align="center">
    <img src="./readme-images/soql-datatable-lookup.png" width="350">
</p>

The actual lookup edit cell is a fork of the one authored by jlyon87 as found [here](https://github.com/jlyon87/lwc-lookup)

**Supported Features for all Custom Data Types**
- Multi-line inline edit (aka mass-edit).

<p align="center">
    <img src="./readme-images/soql-datatable-inline-edit-mass.png" width="900">
</p>

- Partial save across rows is supported. 
    - Error display user experience is aligned to **native list views**.
    - If one row errors, all fields/columns for that row fail as well until all errors are resolved.

<p align="center">
    <img src="./readme-images/soql-datatable-inline-edit-error.png" width="900">
</p>

**Unsupported / Roadmap Features**
- Keyboard navigation.
    - Pending lwc / aura issue investigation [here](https://github.com/salesforce/lwc/issues/1962).
- Geolocation fields must be queried with the `__Longitude__s` and `__Latitude__s` (capital L).
- Time data type is not yet supported for **view** or **edit**.

</details>

<details>
    <summary>Configurable Flow and LWC actions</summary>

⠀

Each `soqlDatatable` can be have one defined **Action Configuration** (`Datatable_Config__mdt`) to define both Table level (supporting multi / single select) and Row Level actions. This can be the same `Datatable_Config__mdt` as used in the **Lookup Configuration** section.

Because of a limitation with cmdt, the `Type__c` on the parent `Datatable_Config__mdt` must be text of `Actions`. For combined configs, use `Actions; Lookups`.

Both LWCs (inside a dialog) and Screen Flows can be launched from either action type. The configuration is easier to explain in picture format:

![soql-datatable-config-mdt](/readme-images/soql-datatable-config-mdt.png?raw=true)

<p align="center">
    <img src="./readme-images/soql-datatable-actions.png" width="480">
</p>

Assign New Account - Flow Table Action

The button is configured to the `SOQL_Datatable_Flow_Action_Update_Contacts_with_New_Account` Screen Flow.

`soqlDatatable` sends the following `inputVariables` to Flows.

| Name | Type | Value |
|-|-|-|
| SelectedRowKeys | String[]  | Selected Row key-fields, usually recordIds. |
| SelectedRowKeysSize | Number | Number of selected rows. |
| UniqueBoundary | String | For `dialogAutoCloser` to refresh the table that opened the Screen Flow.  |
| SourceRecordId | String | The recordId of the page that the `soqlDatatable` is placed on. |

When the flow is done, it auto-closes using `dialogAutoCloser`.

<p align="center">
    <img src="./readme-images/soql-datatable-new-account-flow.png" width="640">
</p>

Check Opportunities - LWC Table Action

This button configured to open the `checkOpportunitiesExample` LWC.

Notice the public attributes, these are always supplied by `soqlDatatable` when invoking an LWC.

```html
<template>
    <c-message-service boundary={uniqueBoundary}></c-message-service>
    <template if:true={queryString}>
        <c-soql-datatable query-string={queryString}></c-soql-datatable>
    </template>
    <template if:false={queryString}>
        <div class="slds-align_absolute-center">
            No Contacts Selected. Please choose contacts to view opportunities for.
        </div>
    </template>
</template>
```
```js
...

@api uniqueBoundary;
@api selectedRows;
@api sourceRecordId;

queryString;

// private
_isRendered;
_messageService;
_accountIdSet = new Set();

connectedCallback() {
    if (this.selectedRows && this.selectedRows.length) {
        this.selectedRows.forEach(row => {
            this._accountIdSet.add(`'${row.AccountId}'`);
        });
    }
    if (this._accountIdSet.size > 0) {
        let accountIds = Array.from(this._accountIdSet.keys());
        this.queryString = convertToSingleLineString`
            SELECT Account.Name, Name, Amount, CloseDate, StageName
            FROM Opportunity
            WHERE AccountId IN (${accountIds.join(',')})
            ORDER BY Account.Name ASC
        `;
    }
}

...
```

Remove Phone - Flow Row Action

The button is configured to the `SOQL_Datatable_Flow_Row_Action_Remove_Contact_Phone` Screen Flow.

This Screen Flow also auto-closes with `dialogAutoCloser`.

<p align="center">
    <img src="./readme-images/soql-datatable-remove-contact-phone-flow.png" width="380">
</p>

</details>

<details>
    <summary>Dynamic Creation via MessageService & DialogService</summary>

⠀

Dynamically create a `soqlDatatable` when clicking the `Launch a SOQL Datatable in a Dialog` button.

<p align="center">
    <img src="./readme-images/soql-datatable-in-dialog.gif" width="900">
</p>

This is the psuedo-code of what happens:

```
button.js calls messageService.dialogService(payload)
    => button.js composed instance of messageService uses LMS to...
        => Another composed instance of messageService in MessageServiceHandler.cmp (label-less in utility bar)
            =>  CustomEvent opendialog is bubbled and handled in...
                => MessageServiceHandler.cmp component.finds()...
                    => DialogService.cmp
                        => DialogServiceController.js
                            => $A.createComponent('c:soqlDatatable')
                                => lightning:overlayLibrary
```

Here's the actual payload used in the above code flow:

```js
handleOpenDialog() {
    const query = convertToSingleLineString`
        SELECT Title, Name, Email, Account.Name, Account.Type
        FROM Contact
        LIMIT 5
    `;
    const dialogServicePayload = {
        method: 'bodyModalLarge',
        config: {
            auraId: 'soql-datatable-example',
            headerLabel: 'Dynamically Created SOQL Datatable',
            component: 'c:soqlDatatable',
            componentParams: {
                isRecordBind: false,
                recordId: this.recordId,
                queryString: query
            }
        }
    };
    this._messageService.dialogService(dialogServicePayload);
}
```

As you can see, it's possible to parameterize a payload back to Aura's `$A.createComponent` API to instantiate a public properties against an LWC.
</details>

<details>
    <summary>Display a Selection to Collection Datatable in Flow</summary>

⠀

This Screen Flow uses the ability for `SOQL Datatable` to output a `List<SObject>` directly in Flow.

Another component called `Collection Datatable` is able to display any Flow `Record Collection`.

<p align="center">
    <img src="./readme-images/soql-datatable-to-collection-datatable-flow.png" width="320">
</p>
<p align="center">
    <img src="./readme-images/soql-datatable-to-collection-datatable.gif" width="600">
</p>
</details>

<details>
    <summary>soqlDatatable Specification</summary>


**Attributes**

`// TODO`

**Public Methods**

`// TODO`
</details>

### collectionDatatable

This component is designed for use with Screen Flows to display tables of data from a Record Collection.

You can use `Get Records` elements or `selectedRows` from SOQL Datatable.

// TODO more description

<details>
    <summary>collectionDatatable Specification</summary>

⠀

**Attributes**

`// TODO`

**Public Methods**

`// TODO`
</details>

#### collectionDatatable - Features and Examples

<details>
    <summary>Displaying Selected Records from SOQL Datatable</summary>

⠀

This Screen Flow uses the ability for `SOQL Datatable` to output a `List<SObject>` directly in Flow.

Another component called `Collection Datatable` is able to display any Flow `Record Collection`.

<p align="center">
    <img src="./readme-images/soql-datatable-to-collection-datatable-flow.png" width="320">
</p>
<p align="center">
    <img src="./readme-images/soql-datatable-to-collection-datatable.gif" width="600">
</p>
</details>

<details>
    <summary>Combining SOQL and Collection Datatable with Flow inputs</summary>

Details incoming...

<p align="center">
    <img src="./readme-images/combine-soql-and-collection-datatable-flow.png" width="600">
</p>

</details>
