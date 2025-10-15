# Masterportal

The Masterportal is a tool-kit to create geo web applications based on [OpenLayers](https://openlayers.org), [Vue.js](https://vuejs.org/) and [Cesium](https://cesium.com/platform/cesiumjs/) for 3D functionality. The Masterportal is Open Source Software published under the [MIT License](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/License.txt).

The Masterportal is a project by [Geowerkstatt Hamburg](https://www.hamburg.de/geowerkstatt/).

## MasterPortal Version 3

After more than two years of refactorings we can proudly present the new major Release Masterportal 3.0.0! We completely removed backbonejs and jquery, moved to vue3 and vuex4 and rewrote the application-core. We redesigned the UI to match all the different usecases and usergroups. We have nearly all modules and tools working but still some work to do. Features still to be added/moved to the new version are the following:

* New Draw Module
* Different AddOns
* Theming
* Touchtable-UI
* ...

To try out the new version just checkout this tag and run "npm install" and "npm start". You'll find working configs under "portal" as usual.

Please be aware of the following:

**We appreciate hints, feedback and communication of bugs! Please use the Issuetracker and tag your issue with "v3.x.x"**

## Roadmap
Our further Roadmap is to work further on Masterportal Version 3. Support and bug fixing ended for V2.x in the end of 2024.
### Masterportal 3.x
* 01.10.2026: New LTS Release MP (Including functionality based on v3.27.0)
### Masterportal Releases
#### Monthly Releases
We release a minor version on the first Wednesday of every month.
##### LTS
LTS release status is "long-term support", which typically guarantees that only critical bugs in functionality or security will be fixed for a total of 12 months and will be released in patch versions.
New LTS minor versions (based on the current version 3 development branch) are released annually on the first Wednesday in October.
### Masterportal Release Schedule
<p align="center">
  <img src="./docs/_media/Masterportal-TimeSchedule.svg" alt="Release plan"/>
</p>

### Support for MP 2.x and MP 3.x
* MP 2.x Version is since 31.12.2024 not longer officially supported.
* Pull requests for function enhancements and new developments have to be on v3.x.x basis.


## User section

* [Download](https://bitbucket.org/geowerkstatt-hamburg/masterportal/downloads/)
* [Quick start for users](./docs/Setup/setup.md)
* [User documentation](./docs/User/About.md)
* [User documentation online](https://www.masterportal.org/dokumentation)
* [Community board (User forum)](https://discourse.opencode.de/t/ueber-die-kategorie-masterportal-projekt-413/1691)
* [Former Community board (User forum is closed - read only!)](https://trello.com/c/qajdXkMa/110-willkommen)

## Developer section
### Community
* [Issue tracker](https://bitbucket.org/geowerkstatt-hamburg/masterportal/issues?status=new&status=open&status=submitted&is_spam=!spam)
* [Community board (User forum)](https://discourse.opencode.de/t/ueber-die-kategorie-masterportal-projekt-413/1691)
* [Former Community board (User forum is closed - read only!)](https://trello.com/c/qajdXkMa/110-willkommen)
### Contributing
* Contributors to the Masterportal are expected to act respectfully toward others in accordance with the [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for open source projects.
* Follow our [Developer documentation](./docs/Dev/About.md)
* First steps in the code: [Tutorial 01: Creating a new module (Scale switcher)](./docs/Dev/Tutorials/tutorial.md)

#### Pull requests
* Your pull request must have:
    * An understandable detailed description
    * If necessary a test portal or test configurations
    * A changelog entry
    * A PrePushHook with no errors
    * Hints if your contribution contains adopted external code
    * Unit tests for new functions or updated tests for bugfixes

#### Contributor License Agreement
* Your contribution will be under [MIT License](./License.txt)
