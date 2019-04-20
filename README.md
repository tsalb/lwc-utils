# LWC Utils and Design Patterns

This repo highlights the following production proven design patterns:

* Design custom LWC into a service component architecture, i.e. making "utils".
* Showcase a bi-directional event / payload brokering system between Aura and LWC.
* Highlight the versatility of the Flexipage SPA.
* Showcase an apples-to-apples comparison of "Aura vs LWC" with an LWC re-write of my [Aura Service Components Sample App](https://github.com/tsalb/sfdc-lightning-service-components).

![side-by-side](/readme-images/side-by-side.png?raw=true)

## Install with SFDX

SFDX CLI and VSCode has matured enough for general usage so I will be moving my repo to SFDX format only.

For VSCode and SFDX setup see steps (1 and 2) from the [official lwc-recipes repo](https://github.com/trailheadapps/lwc-recipes#installing-recipes-using-salesforce-dx). Once you have the SFDX CLI set up and Authed into a Dev Hub you can then:

1) Clone this repo to a desired directory.

```
git clone https://github.com/tsalb/lwc-utils
```

2) Open VSCode (with a Dev Hub already connected), and open the `lwc-utils` folder.

3) Use [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) to `SFDX: Create a Default Scratch Org` .

4) Use Command Palette to `SFDX: Push Source to Default Scratch Org`.

5) Use Command Palette to `SFDX: Open Default Org`.

## Service Components Framework (Aura)

See the [readme](https://github.com/tsalb/sfdc-lightning-service-components#dataservice-usage-example) on the old repository.

## Datatable Service (LWC @wire and imperative)

Two samples:

1) An `@wire` child template component fed by a reactive attribute that emits events on success/error. 
2) An imperative callout using `async await` that uses promises in the returning tableResults.

Parent relationships (1 level up) are working okay. It's safer to use formulas still, for now.

![datatable](/readme-images/datatable-optimized.gif?raw=true)

## LWC to Aura MessageBroker

Leverages the lwc-recipe pubsub to provide an API for all LWC to access Aura only service modules, such as `lightning:overlayLibrary`.

This simple example uses `MessageService` to dynamically create a LWC (using `$A.createComponent`).

![lwc-modal](/readme-images/lwc-modal-optimized.gif?raw=true)

