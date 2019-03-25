# LWC Service Modules

Rewrite of [Service Components Framework (Aura)](https://github.com/tsalb/sfdc-lightning-service-components) but with Lightning Web Components (LWC). This repository includes all my previous Service Components for easy side-by-side comparison.

![side-by-side](/readme-images/side-by-side.png?raw=true)

## Install with SFDX

SFDX CLI and VSCode has matured enough for general usage so I will be moving my repo to SFDX format only.

For VSCode and SFDX setup see steps (1 and 2) from the [official lwc-recipes repo](https://github.com/trailheadapps/lwc-recipes#installing-recipes-using-salesforce-dx). Once you have the SFDX CLI set up and Authed into a Dev Hub you can then:

1) Open VSCode, then open terminal with `` ctrl+` `` then clone lwc-utils.

```
git clone https://github.com/tsalb/lwc-utils
```

2) Use [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) to `SFDX: Create a Default Scratch Org` .

3) Use Command Palette to `SFDX: Push Source to Default Scratch Org`.

4) Use Command Palette to `SFDX: Open Default Org`.

## Service Components Framework (Aura)

See [Readme](https://github.com/tsalb/sfdc-lightning-service-components#dataservice-usage-example) for any Aura component usage.

## Datatable Service (LWC @wire and imperative)

Two samples:

1) An `@wire` child template component fed by a reactive attribute that emits events on success/error. 
2) An imperative callout using `async await` that uses promises in the returning tableResults.

Parent relationships (1 level up) are working okay. It's safer to use formulas still, for now.

![datatable](/readme-images/datatable.gif?raw=true)

## LWC to Aura MessageBroker

Leverages the lwc-recipe pubsub to provide an API for all LWC to access Aura only service modules, such as `lightning:overlayLibrary`.
This simple example uses `MessageService` to dynamically create a LWC (using `$A.createComponent`).

![lwc-modal](/readme-images/lwc-modal.gif?raw=true)

