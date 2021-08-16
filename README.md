# LWC Utils

Reusable LWCs to 10x your solution building speed.

- `messageService`: Lightning Message Service (LMS) simplified component messaging.
- `SOQL Datatable`: Leverage SOQL to power your list views, related lists, and even Screen Flows.
- `Collection Datatable`: Manage Record Collections variables in Screen Flows.
- Design patterns leveraging both Aura and LWC to dynamically create dialogs (modals) for better UX.
- Launch Screen Flows dynamically inside a dialog (modal) from anywhere.

## Introduction

This repo showcases the best defaults for creating rich, interactive, data-dense UIs using the following centerpieces:
- `lightning-datatable` from LWC.
- `lightning:overlayLibrary` from Aura.
- `lightning:flow` from Aura.
- `messageService` which abstracts [Lightning Message Service](https://developer.salesforce.com/docs/component-library/bundle/lightning-message-service) to stitch it all-together.

Salesforce has invested heavily into `LWC`, `Flow` and `Screen Flow` and has given [Architect Guidance](https://architect.salesforce.com/design/decision-guides/build-forms/) around how to build scalable and flexible solutions now and into the future.

This repo builds on that guidance and pushes data-dense UI design to the next level with highly reusable, highly configurable components. These components have saved me thousands of developer hours and allowed me to pivot on a dime to meet the changing speed of business.

I hope they will help you do the same.

## Motivation

The components found in this repo aim to solve these high level problems:

- Complex component communication can be difficult to design with consistency.
- Datatables are useful but high effort to use.
- Modals / Dialogs are useful but high effort to use.

More detailed info can be found in the [wiki](https://github.com/tsalb/lwc-utils/wiki/Motivation).

## Getting Started

1) Take a look at the component [overview](https://github.com/tsalb/lwc-utils/wiki/Component-Library-Overview).

2) Install [core](https://github.com/tsalb/lwc-utils/wiki/Installation#core).

3) For first time users, install [recipes](https://github.com/tsalb/lwc-utils/wiki/Installation#recipes) in a [scratch org](https://github.com/trailheadapps/lwc-recipes#installing-the-app-using-a-scratch-org).

4) Read the [Configuration](https://github.com/tsalb/lwc-utils/wiki/Configuration).

5) Skim the [FAQ](https://github.com/tsalb/lwc-utils/wiki/FAQ).
