
# Changelog Masterportal
 All important changes in this project are stored in this file.

[Semantic versioning](https://semver.org/spec/v2.0.0.html) is used.

## Unreleased - in development
### __Breaking Changes__

### Added
- UISTYLE: Updated element visibility when the UISTYLE URL parameter is applied.
- App: All locales can now be overridden with the config.js, and new locales can be added.
- Issue #1248: BaselayerSwitcher: Added configuration option `visibleBaselayerIds` that allows to restrict base layers available in the layer switcher.
- Issue: #1525: convertFeaturesToKml: Added alert for unsupported geometry types.
- LayerSelection: All layers in a folder can now be enabled or disabled by checking the `isFolderSelectable` attribute under `Add subject` configurable in config.json.
- WMS-Time: The default value can now be specified as a number within the dimension.

### Changed
- Issue #1254: LayerPreview: Allow setting static layer preview images (`layerConfig.elements.layers.preview.src`) for all supported layer types.
- Changed Node.js support: Versions from Node.js **22.19.0** up to Node.js **22.21.0** (LTS) are now supported
- Adjusted module "statisticDashboard" and shared utility function "getOAFFeature" to changes in OAF standard.
- LayerTree: Highlight clickable elements in breadcrumbs.

### Deprecated

### Removed

### Fixed
- Issue #1168: Fix autoRefresh for LayerGroups.
- Issue #1241: WfsSearch: Fix an issue where queryType "like" would not result in a "PropertyIsLike" expression.
- Issue #1307: print: add check if dpiForPdf is in dpiList and fall back to first list item if needed.
- Issue #1310: legend images scale correctly now.
- Issue #1317: encode the share link.
- Issue #1323: draw_old - show icon id instead of translationkey when no translation was found.
- Issue #1489: Print - fix rotated print masks and add missing rotation for MapFish. Add information regarding missing support of *High Resolution PlotService* to docs.
- Issue #1517: Fix issue where a single failing GFI request would prevent all requested feature information to be hidden from user.
- Issue #1521: Login: Requesting GeoJSON layers now also works when the GeoJSON requires a login.
- Issue #1527: statisticDashboard - restored WFS support for statistic dashboard and added default color palettes.
- Issue #1529: LayerSlider: Fix issue where after quitting the LayerSlider, effects of it remained on the map.
- Issue #1530: LayerComponent: Fix translation of tooltip when switching languages.
- Issue #1531: SelectFeatures: Fix link display in selectFeatures tool.
- Issue #1534: LayerInformation: Fix retrieval URL when using `customMetadata`.
- Print: When printing a tiled WMS, the version is now specified, as without this information an error would occur when printing with some services.
- wfsSearch: reset dependent fields at changed selection.
- MouseHover: Prevent duplicate hover info for WebGL polygon and line layers.
- WFS-cluster: Fix a recursive style loop that triggered a ‘Maximum call stack size exceeded’ error.
- MapMarker: Fix marker visibility after ShareView.
- MkDocs: Fixed MkDocs formatting and heading anchor issues and ensured the CI pipeline fails immediately on MkDocs warnings and errors.
- Documentation: correct example configuration for FeatureLister.
- Translations: Added missing translations across all locales.
- Documentation: Added jsDoc to shared Button Components.

---

## 2025-12-18 v3.17.1

### Fixed
- print: Bugfix using print from other modules.

---

## 2025-12-03 v3.17.0

### Added
- App: Added automatic device mode switch between Desktop and Mobile when window size changes.
- draw_old: Possible to save and then import square geometry.
- Shared ButtonGroup: Allow to use a different button property as "setSelectedButton" event return value.
- GraphicalSelect: Added line feature with buffer geometry for selection.
- FeatureLister:
  - Added spatial selection of features that are shown in the list.
  - GeoJSON is now supported.
- TableComponent:
  - Added GeoJSON Download.
  - Added alphanumerical sorting.
  - Security: Added SECURITY.md file.
- layerTree: Added clickable folder paths in submenu, if `showFolderPath: true`.
- Routing:
  - Added new, configurable interval slider option
  - Added functionality to calculcate isodistances < 1km with new interval slider option

### Changed
- GFI: Ensures that the text within the GFI window wraps correctly.
 The following packages have been updated:
    - devDependencies:
        - @masterportal/masterportalapi: 2.52.0 to 2.53.0 (This also raised ol to version 10.7.0)
        - replace-in-file: 7.1.0 to 8.3.0
- Title Bar: line break for long names in the title bar has been restored.
- wfsSearch: use `featurePrefix` and `featureNS` from services.json (when configured) for creating the xml Filter. Add better geometry detection for search results.

### Removed
- SearchBar: Removed search status (min characters, loading, no results).
- LayerSelection: Removed search within current folder (requires `"filter": true"` in `config.json`).

### Fixed
- Issue #1477: The Calculate button is now disabled and a warning message is displayed when this limit of Isochrones is exceeded.
- Issue #1491: Fix connection between `import` and `draw_old` tool that wouldn't work if `draw_old` was opened first.
- Issue #1497: Fix styling of `featureviaurl` features that was previously missing, resulting in invisible features.
- Issue #1501: Fix bad perfomance of filter module for clustering.
- Issue #1505: Fix FileImport tool breaking after using ShareView URL with the tool being open.
- Issue #1509: Fix zIndex order of layers configured by URL that could've been wrong in edge cases.
- Issue #1512: Fix `compareMaps` for mobile devices, where the slider was previously missing.
- Issue #1519: Fix initialization of print module.
- Searchbar and LayerSelection: Behavior restored to the way it was before layerSelection filtering was introduced.
- 3D: When switching from 2D to 3D, the center coordinate of the current map section can be reproduced in 3D. This can be configured using `map3dParameter.camera.offset`.
- Print: Layout A0: WMS image layer are printed correctly.

---

## 2025-11-25 v3.16.2

### Removed
- SearchBar: Removed search status (min characters, loading, no results).
- LayerSelection: Removed search within current folder (requires `"filter": true"` in `config.json`).

### Fixed
- Searchbar and LayerSelection: Behavior restored to the way it was before layerSelection filtering was introduced.

---

## 2025-11-12 v3.16.1

### Fixed
- LayerSelection: Fixed filtering of layers.
- LayerTree and `tree.type` `auto`: Layers with empty category in datasets are classified in folder "No category".

---

## 2025-11-05 v3.16.0

### Added
- SearchBar: Added search status (min characters, loading, no results).
- LayerSelection: Added search within current folder (requires `"filter": true"` in `config.json`).
- Issue #1390: Added support for `.apng`, `.webp`,and `.svg` files in GFI window.
- map3DParameter: Added new `shadowTime` configuration option to define a fixed time for shadow calculation in 3D mode.
- Build Script: Added support for providing the portal path via environment variable `PORTAL_PATH` in the build script.
  - If `PORTAL_PATH` is set, the build script will use it instead of prompting the user.
  - This enables automated builds in CI/CD pipelines without manual input.
- Shared TableComponent: New style in ButtonGroup to show the buttons in individual way.
- Added Shared Component for buttonGroup in buttons.
- Filter:
    - Adds parameter collapseButtons to show collapsible buttons instead of accordions.
    - Adds parameter clearAll to enable to clear the layers for the whole filter.
    - New parameter icon to set an icon for the filter.
    - New parameter showCurrentlyActiveFilters to control the visibility of the active filter area

### Changed
- The following packages have been updated:
  - devDependencies:
    - axios: ^1.7.9 to ^1.12.2
    - bootstrap: ^5.3.3 to ^5.3.8
    - bootstrap-icons: ^1.11.3 to ^1.13.1
    - chart.js: ^4.4.8 to ^4.5.0
    - i18next: ^24.2.2 to ^25.5.2
    - i18next-browser-languagedetector: ^8.0.3 to ^8.2.0
    - i18next-http-backend: ^2.7.3 to ^3.0.2
    - three: ^0.173.0 to ^0.180.0
    - @vue/compiler-sfc: ^3.3.4 to ^3.5.22
    - @vue/server-renderer: ^3.3.4 to ^3.5.22
    - mqtt": 4.3.7 to ^5.14.1
  - dependencies:
    - vue: ^3.3.4 to ^3.5.22
  - devDependencies:
- Removed temporary `overrides` that pinned Vue core packages to 3.3.4.
- Adjusted test webpack config for Vue 3.5 (aliases/loaders).
- Add missing .js/.vue extensions in import paths project-wide
- Filter: Updated UI to match masterportal design

### Removed
- The following packages have been removed:
  - devDependencies:
    - dom-storage
    - html2canvas
    - bootstrap-sass
- Filter:
    - The layerSelectorVisible parameter has been removed. If all filters are to be opened initially, the parameter active of all filters can be set to true.
    - Parameter 'initialStartupReset' has been removed. The behaviour is now default for each filter which has child-snippets.
    - Parameter 'snippetTag' has been removed. The new active filter area can be controled by the paramter 'showCurrentlyActiveFilters'

### Fixed
- Issue #1385: Add missing internationalization calls for layer names.
- Issue #1413: Fix legend toggle for featureless vector layers.
- Issue #1422: Reset layers in CompareMaps on any deselection to avoid bugs regarding which layers are visible on what side of the comparison.
- Issue #1472: Fix usage of tokens to always use freshest token from cookies. Also allow all acceptable first `fetch` parameters for intercepted URLs now.
- Issue #1476: Fix automated scale adjustment in Print module getting stuck on receiving scale as url parameter.
- Issue #1481: Fix error when configuring customMenuElement as currentComponent.
- Issue #1485: Fix keyboard interaction in compareMaps.
- Issue #1486: Searchbar: Disable scale restricted layers in search UI; add hover text regarding scale restriction.
- Issue #1487: Filter: Fix filtering filter options when typing while `addSelectAll` is true.
- Issue #1488: Prevent footer from being cut when using url parameter UISTYLE=simple.
- Issue #1499: Print: Fix missing legends when multiple WFS layers are active.
- LayerInformation: The addresses of the TileSet3D layer and the Terrain3D layer are displayed correctly.
- Documentation:
    - Corrected usage of 'treeType' (version 2).
    - Corrected description of 'map3dParameter'.
    - EditorConfig no longer strips two trailing spaces, which are intentional line breaks in Markdown.
    - Use Code block headers instead of inline comments for the VueJSAddon tutorial.
Migrator: Corrected 'infoText' of 'mouseHover' in created config.json.
- Documentation: corrected usage of 'treeType' (version 2).
- Documentation: EditorConfig no longer strips two trailing spaces, which are intentional line breaks in Markdown.
- Documentation: Use Code block headers instead of inline comments for the VueJSAddon tutorial.
- LayerPills: Layout of layerPills now gets dynamically adjusted with regard to the current menu-state and re-adjusts on changes made to the menus.
- Shared TableComponent: Fixed remove of row.
- ControlBar: Fix pop-ups display above other elements.
- Gazetteer: Restored correct click behavior in search results.
- LayerInformation: Fixed display of layerInformation for groupLayers.
- Feature-Highlighting: Fixed feature highlighting for polygons.
- buildSpec: Fixed runtime error in Print module caused by imported WMS layers where LAYERS parameter was not a string.
- SensorThings layer: removed duplicate startIntervalUpdate definition, unified periodic refresh, deduplicated Cluster/source access via getActualSource(), and fixed no-data handling & timer cancellation.
- LayerSelection: Fixed 3D folders not showing layers after click.

---

## 2025-11-20 v3.15.1 (LTS)

### Fixed
- wfsSearch: secured layers can now be searched.
- Issue #1385: Add missing internationalization calls for layer names.
- Issue #1410: Legend – Fixed ordering of legend entries to match the style configuration.
- Issue #1481: Fix error when configuring customMenuElement as currentComponent.
- buildSpec: Fixed runtime error in Print module caused by imported WMS layers where LAYERS parameter was not a string.
- Issue #1499: Print: Fix missing legends when multiple WFS layers are active.

---

## 2025-10-01 v3.15.0 (LTS)

### __Breaking Changes__
- Dropped support for **Node.js 18.x**, **20.x** and **npm 9**. Minimum required is now **Node.js 22.19.0 (LTS)** with **npm 10.x**.

### Added
- Routing: Added enhanced isochrones legend.
- Shared TableComponent:
    - fixedColumnWithOrder in Props enable to insert the column with index.
    - fixedRow in Props enable to insert a row directly after the header.
- Added config.json parameter `rasterLayerDefaultInfoFormat` to override global default in 2d raster layer.

### Changed
- Routing: Changed input fields for hgv parameters.
- Shared TableComponent: Changes Props fixedData into fixedBottomData.
- The following packages have been updated:
  - devDependencies:
    - canvas: ^2.11.2 to ^3.1.2
- Temporarily pinned Vue core packages via `overrides` to `3.3.4`:
    - @vue/compiler-sfc
    - @vue/server-renderer
    - @vue/compiler-dom
    - @vue/compiler-core
    - @vue/shared
    - @vue/runtime-dom
    - @vue/runtime-core
- Update the addon documentation to reflect the recent changes in the project structure and Vue3.
- packages: To avoid security issues, all packages have been fixed in package.json. No versions of patch releases will be accepted.
- WFSSearch: To provide configuration of version 2 it is possible to configure a zoom-button for resultlist with config parameter `zoomButtonInColumn` if column key `geometry` or `geom` is configured, default is true.
- Documentation: Updated config.json.md and config.json.de.md for copyrightConstraints module.

### Fixed
- Issue #1404: searchInterfaceVisibleVector: The Visible Vector Search now manually loads all features, ensuring that results are found even outside the bounding box.
- Issue #1416: Dragging a node of the layerTree now hides its tooltip. This ensures it won't be dropped on the tooltip, which lead to disabling the node in the layer tree.
- Issue #1419: SearchInterfaceSpecialWfs: handle multisurface geometries like multipolygon, to ensure correct extraction of interior and exterior surfaces.
- Issue #1467: Print: The info message for printing layers with a predefined legend is now also available in German.
- Issue #1469: Fix menu expansion state after collecting GFI features.
- Issue #1475: LayerInformation: Added additional metadata in group layers.
- Issue  #1482, #1484: WFSSearch with resultlist provides zoom on row-click by default and zoom with button.
- wfsSearch: secured layers can now be searched.
- TableComponent: Fixed right alignment for numeric string values.
- thousandsSeparator: Added optional skipFourDigitYear parameter to prevent formatting plain 4-digit years (e.g., 2025 stays 2025 instead of 2.025).
- HighlightFeaturesByAttribute: Resolved console warning that appeared repeatedly when opening URL with highlight parameters.
- Min/MaxScale: 3D Layers now work with minScale and maxScale attributes in the configuration.
- Mousehover: The element is not highlighted when the mouse is no longer over it and there is no highlight for routing and elements with no highlightStyle.
- draw_old:
    - Fixed a bug where the download would return the portals index.js instead of the desired output after a specific sequence of interactions.
    - Hide drawing makes the drawn layer not visible.
- Issue #1479: Legend is loaded for WMTS with optionsFromCapabilities.
- DOCS: Reverted Markdown table formatting as it was not compatible with soft line wrapping.
- DOCS: Minor fixes in JSON and venv setup documentation.
- SelectFeatures: unmounts correctly.

---

## 2025-09-03 v3.14.0

### Added
- Issue #1038: Added tooltips to display area of drawn polygons/squares and length of drawn lines, as in version 2.
- WFS-T: Enables layers to support the insertion, update, and deletion of multipolygon geometries
- WFS-T: Added confirmation dialogue for creating multipolygons with voids
- Orientation: added parameter iFrameGeolocationEnabled to configure iFrame-Geolocation. If omitted or disabled, the errors within an iFrame now are more helpful.
- StatisticDashboard: Added config parameter `decimalPlaces` to set the number of decimal places for the statistic values.
- CustomMenuElement: Added support for configuring multiple viewpoint folders with the properties "showOnlyByLayersVisible" and "showEntryDirectly".
- MouseHover: Added highlighting Vector Layers on mouseHover as in Version 2.
- MouseHover: Configurable in config.js
- MouseHover: Added an active value that allows enabling or disabling MouseHover through the configuration.
- MouseHover: Added font weight options for desciption and title.
- Added Shared Component for pagination.
- SearchBar: Render images in search result if `imagePath` is provided in SearchBarSuggestionList and SearchBarResultListGeneralItem components.
- Draw: Added square as geometryType.
- PrintModule: Add additional parameter `transferParameter` which is an object with its parameters spread for the mapFish. `transferParameter` can have two parameters: `pagename` and `footer`, which are both strings.
- Routing: Added context menu to for setting and deleting waypoints as well as barrier points via right mouse button.
- Documentation: Now includes a search bar for cross-site search.

### Changed
- Orientation: Nearby: If in an iFrame and geolocation is not enabled through config parameter, geolocation option will not show.
- VectorTile, WebGL: Feature detection for MouseHover/GFI uses forEachFeatureAtPixel to support WebGL-rendered layers and avoid issues with getFeaturesInExtent.
- InputText: Replace input text with InputText.
- HTML input elements: Replaced HTML input elements of type text with shared modules component InputText.
- Shared utils: Optimized function isEmailAddress to return early to avoid running the regex for invalid input values.
- Documentation: Links are now underlined to improve visibility (WCAG 2.2 (A) - 1.4.1).
- The following packages have been updated:
    - devDependencies:
        - @masterportal/masterportalapi: 2.49.0 to 2.50.0 (This also raised ol to version 10.6.0)

### Removed
- Removed configuration portal/layer.

### Fixed
- Issue #1435: Filter: Fixed an issue where additionalGeometries did not work when geometries from a WFS layer with version 2.0.0 were used as a filter area.
- Issue #1444: WMS-Time: Time-based WMS layers are now correctly reset when the comparison layer is removed.
- Issue #1451: CompareMaps: Both maps are now still visible after reset.
- Issue #1453: WfsSearch: The geometry cell in the search results table is now displayed as a button that allows users to zoom to the parcel coordinates.
- Issue #1454: MkDocs: Added instructions for packages needed to run the portalconfig-migrator.
- CompareFeatures: Fixed failing for layers with alphanumeric IDs.
- sortObjects: Ensure stable sortByLayerSequence order in Chrome/Firefox.
- Housekeeping: Multiple important css-rules have been refactored to not use important.
- Housekeeping: Multiple Occurences of document.getElementById() have been replaced by vue-ref-logic.
- WFS-T Tool: Fixed an issue when the module is set as the currentComponent of a menu in the portal config.
- WFS-T Tool: The multiUpdate form now correctly displays checkboxes.
- Tests: Fixed vuex warnings and stubbed console warnings end errors.
- InputText: Fixed missing suggestions in input fields.
- SearchInterfaceOsmNominatim: Fixed getter path in debounce check.
- GroupLayer: Fixed errors when opening layer info for layers within a group.
- wfsSearch: secured layers can now be searched.
- Issue #1410: Legend – Fixed ordering of legend entries to match the style configuration.

---

## 2025-08-06 v3.13.0

### Added
- AddWMS: added parameters showInLayerTree and visibility to set the flags for imported layers.
- Orientation: added parameter iconGeolocationMarker to configure the icon used for the current position in the map.
- WFS-T: Save button is disabled when user gave no input.
- TableComponent: Implemented configurable Fullscreen-View-Button of the table component within secondaryMenu with compressed table columns.
- MainMenu: Refactored Portal Title behavior for smaller menu sizes. Title now moves below logo when space is limited.
- MouseHover: Add additional parameters for configuration. Parameters can be set in the portal configuration to overwrite default values. If no values are set, the usual defaults are used.

### Changed
- WFS-T: Success save message is changed.
- WFS-T: Info message is configurable and is visible in the multiupdate so that users know that they can overwrite things.
- WFS-T: Multiedit name is changed to Edit.
- WFS-T: Box selection was removed from default ones for multiupdate.
- StatisticDashboard:
  - Replaced the old color scheme generating algorithm with the colorbrewer schemes.
  - Enabled colored map for more than one selected statistic.
  - A loading spinner shows before the styled features are loaded.

### Fixed
- Issue #1223: Gazetteer: Fixed filtering of search results where only the address was used as identifier, which led to errors if the same address was used in multiple cities.
- Issue #1418: Routing: Fixed add waypoint button functionality via keyboard input.
- Issue #1432: CompareMaps: Remove the complete loading of maps before activating the addon or changing the map view.
- Issue #1437: LayerComponentSubMenu: Added support for i18n keys to ensure translation.
- Issue #1440: SearchBar: Fixed setMarker and openGetFeatureInfo to work correctly with MultiPolygon features.
- ShareView: Fixed share link to exclude legacy URL parameters that caused conflicts.
- Routing: Fixed addition of waypoints during route modification. Waypoints added when modifying route are now geocoded correctly.
- Alerting: Fixed alerts showing for layers hidden via link, even if set as visible in config.
- About: Ensure the primary contact is displayed in the imprint, fallback to the publisher if no contact is defined.
- BuildPortal: Fixed mastercodeVersionFolderName to prevent time conflicts and avoid hashtags in folder name.
- Layer2dVector: should also filter for null geometries, not only undefined.
- Tests: Fixed failing tests for WMTS layers without capabilities.

## 2025-07-08 v3.12.1

### Fixed
- AddWMS: Fixed incorrect layer order caused by baselayer zIndex being modified when adding a WMS.
- LayerTree: Fixed incorrect layer order when adding last layer of a folder within the layertree.
- WFS-T Tool: now works with featurePrefix including colon at the end
- WFS-T Tool: refresh view after dismiss new created feature

---

## 2025-07-02 v3.12.0

### Added
- Issue #1400: UrlParams: added url parameter `configjs` to provide an external config.js file.
- SearchBar: Added functionality to highlight a 3D tile at the address coordinates.
- Routing:
    - added avoid points, avoid area import and export
    - selecting a waypoint input field and adding a point by clicking into the map, the new waypoint is added into the previously selected field instead of the first empty field on the list

### Changed
- Webpack: Replaced relative import paths with Webpack aliases to enhance code maintainability and readability.
- LayerPills: Added toggle button to show multiple lines of LayerPills. When toggled, they are shown in multiple lines and do not disappear off-screen.
- WFS-T: Errorhandling informs user of slow fetch-time for layer-information.
- WFS-T: Transaction buttons are disabled for fetch-time at module start and when the user saves new values to fields.
- Routing:
    - button for adding a new waypoint was moved between start and endpoint
    - reset button was moved to the bottom of the menu
    - consistent button design in avoid area menu

### Fixed
- Menu: Menu title now updates correctly on language change.
- Issue #1261: Implement configurable imprint link in PortalFooter and prevent duplication.
- Issue #1405: SearchInterfaceTopicTree: Fixed search for layers with internal spaces.
- Issue #1407: WMS-Time layers no longer render across the entire map when changing transparency during map comparison — they now correctly respect their designated area.
- Issue #1411: Menu: Fixed duplicated breadcrumbs in Subject Layer selection after closing LayerInfo.
- Issue #1441: SearchBar: Fixed missing zoom and marker placement for unique URL query results.
- GraphicalSelect: Fix alert message popping up if not all values given in geographicValues are used in the options props.
- Map: Fixed wrong zoom and center if camerea parameters are configured for map 3D and also considers urlParameter for center.
- Tests: Fixed wrapper timing issues in multiple components and getComputedStyle error in ElevatedButton.
- UrlParams: Layers that are loaded via UrlParam and are not configured in config.json, but have a styleId in services.json, are now styled.
- WFS-T: Multiselect tools are inactive on leaving the tool.
- WFS-T: Multisave doesn't overwrite configAttribute.
- WFS-T: A Bug that mistakenly showed empty fields was fixed.
- Layer tree: fixed function sortObjects.
- Circular dependencies in imports are removed.

---

## 2025-06-19 v3.3.6 (LTS)

### Fixed
- Issue #1366:
    - SpecialWfs highlighted multipolygons with empty areas and zooms to the extent and not to the first point of the geometries.
    - SpecialWfs: Fixes search for coordinates with different format.
    - SpecialWfs: Fixes search for polygons with interior areas.
- Issue #1381: SpecialWFS: Fixes highlighting of multi linestring geometries.
- Issue #1405: SearchInterfaceTopicTree: Fixed search for layers with internal spaces.
- Issue #1411: Menu: Fixed duplicated breadcrumbs in Subject Layer selection after closing LayerInfo.
- SpecialWfs search: Add hover/zoomTo support for linestring geometries.
- Modeler3D: Fixed formerly unhandled cesium error that caused the tool to stop working. Disabled gfi in Modeler3D because of conflicting click event reactions.

---

## 2025-06-04 v3.11.0

### Added
- GraphicalSelect: Added prop to enable the graphicalSelect component to start with an existing polygon
- WFST-Tool: Saving objects now works correctly after layer reordering for multiselection.
- IconButton extended by further property label. If a label is given, it will be displayed under the button.

### Fixed
- Issue #1341: AboutModule: Show actual Masterportal version even when no cswUrl or metaId is configured.
- Issue #1360: Fixed Errorhandling for 2D-layers.
- Issue #1366: SpecialWfs: Fixes search for polygons with interior areas.
- Issue #1371: Footer: Fixded rendering issue on menu expand.
- Issue #1381: SpecialWFS: Fixes highlighting of multi linestring geometries.
- Issue #1398: SearchBar/SpecialWfs: Fixed incorrect type name for SpecialWfs in documentation.
- Issue #1420: SliderItem:  Fixed opacity slider visibility in Firefox.
- WFST-Tool: Fixed Margins in editing of wfs-t fields.
- AboutModule: fixed undefined in imprint.
- AddLayerButton: Fixed overlap with underlying layer icons (e.g. info/settings) that blocked user interaction.
- Proxy: Inconsistencies when using a proxy through the attribute `useProxy` on the layer have been corrected.
- LayerInformation: For layers that use a proxy, the url from the services.json is displayed.
- Modeler3D: Fixed formerly unhandled cesium error that caused the tool to stop working. Disabled gfi in Modeler3D because of conflicting click event reactions.
- HighlightedFeature: Fixed highlightedFeatures.layerName to use a valid i18n key, since common:tree.selectedFeatures no longer exists.

---

## 2025-02-21 v3.3.5 (LTS)

### Fixed
- Issue #1233: Zoom to selected search result of "wfsSearch" when "resultList" is configured. Show message if no results where found and resultList was not configured.
- Issue #1331: Show group layers in right order.
- Issue #1356: ShareView: Deleted import of BorisState as it caused a compiler error when addons are not integrated. Replaced it with a string instead.
- Issue #1358: Topic tree search can now also be used in multiple languages via i18next.
- Issue #1387: Sorting layer by `layerSequence` assigns fitting zIndexes.
- Issue #1388: In a menu section are several modules of same type allowed.
- LayerInformation: Fixed an issue with no metadata, when cswUrl was undefined, rather than null.
- ShareView:
    - Url parameter are uri encoded now.
    - Duplicated url params are filtered.
- WMS-Time:
    - GFIFeature is now called every time the time slider is used, ensuring the selected time is always displayed in the feature.
    - Updated to ensure WMS-Time Layer compatibility with version 1.3.0.
    - Fixed issue where dragging the slider while comparing two time instances updated both sliders instead of only the active one.
- Menu: Navigating back from layerinformation to the previous menu item add subject.
- Loading the layer is accelerated by fixing generation of folder ids.
- LayerTree, LayerSelection: Introduced an alternative sorting function for layers utilizing the `layerSequence` prop.
- extendLayers: Adjusted initial z-index values to ensure correct layer order on map load.
- UrlParams: 3D params heading, tilt and altitude are evaluated correctly.
- Searchbar: Fixed a bug where the searchbar would focus itself on mounting, scrolling the parent page if embedded in an iframe.

---

## 2025-05-15 v3.10.1

### Fixed
- Issue #1366: SpecialWfs: Fixes search for coordinates with different format.
- Issue #1387: Sorting layer by `layerSequence` assigns fitting zIndexes.

---

## 2025-05-07 v3.10.0

### Added
- MapMarker: Added the ability to additionally highlight polygons.
- FullScreen: added "newTabFromFrame" configuration, to disable opening a new tab if in an iFrame.
- LayerTree: added "contactPublisherName" configuration, to change the info message shown, when clicking the contact sub menu.
- UrlParams: Added URL-Params mainclosed and secondaryclosed to have the menus initially closed when set to true and opened when set to false.
- Menutitle: Added ability to show only a logo without portal title (do not set option 'text').
- HighlightFeaturesByAttribute: Highlighted features via url parameter can now be printed.
- WFST: Added multiselect for edit option in Point-Layers.
- Menus: Module caching implemented via KeepAlive lifecycle hooks.

### Changed
- WMS-Time: Shrunk wms-time slider for mobile views, adjusted Position on desktop.
- getFeatureInfo: gfi now works on BaseLayers as well as SubjectLayers.
- Menutitle: Allow html in title text.
- CompareMaps: layer selection fields are labeled left/right or upper/lower layer instead of first/second layer.
- dependencies:
        - @masterportal/masterportalapi: 2.48.0 to 2.49.0

### Removed
- Removed since version 3 not used state property `deactivateGFI` and `translate#`,`.tools.` in language-keys.

### Fixed
- Issue #1206: WMTS-Layer: legend is displayed, if configured in attribute legend.
- Issue #1220: Routing: Calculated accessibility displayed on the map remains after exporting the result.
- Issue #1233: Zoom to selected search result of "wfsSearch" when "resultList" is configured. Show message if no results where found and resultList was not configured.
- Issue #1295: Extend error processing for error responses from MapFish server.
- Issue #1345: Opacity of circleStrokeColor is now taken into account when printing.
- Issue #1351: Fix OIDC Token Auto-Refresh After Initial Login.
- Issue #1352: Updating menu item name from Login to Logout after a user is logged in and visa versa.
- Issue #1373: Fixed theme tree not updating when adding WMS layers.
- Issue #1375: Fixed topic tree search with respect to spaces.
- Issue #1378: KML-export now uses the correct url for circle-icon.
- Issue #1382: Icon Info button can now be conditionally hidden based on layer configuration.
- Issue #1383: LightButton: Added padding-bottom, so the theme names are fully visible.
- Issue #1388: In a menu section are several modules of same type allowed.
- Issue #1389: Set and remove cookies with domain flag.
- Layer3dTileset: Prevent set cesium scene options if it wasn't changed before by another 3D tileset layer.
- PortalFooter: The attribute `alias_mobil` has been corrected to `alias_mobile`.
- WMS-Time: Listeners are now removed from Layers when compare maps is ended.
- buildSpec: Added hash check to include only unique legend images in print output.
- Charts: Fixed wrong link and modernized method declaration syntax for weekday function.
- WFST-Tool: Saving objects now works correctly after layer reordering.
- Tests: Refactored tests, fixed asynchronous describe blocks and other tests that were failing.
- LayerInformation:
    - Fixed console error if clicked on contact.
    - Fixed creating url to portal contained in contact.
- AddWMS: Added layers are displayed in layer selection under the headline 'external subject data'.

---

## 2025-04-02 v3.9.0

### Added
- URL-Parameter: added url-Parameter to set the width of menu and secondary menu (menuwidth/secondarywidth).
- New function getOAFFeature.getTemporalExtent for requesting the temporal extent of a collection.
- Routing:
    - Added option to avoid borders for directions and isochrones.
    - Added tooltip to get additional information of isochrones while hovering over it on map.
- Searchbar:
    - Topic tree search can now output baselayer as search category.
    - Topic tree search can be configured whether the path of the layer is displayed in the tooltip.
- LayerTree: added checkMove function to validate dragged layer movement based on allowBaselayerDrag configuration.
- WFST-Tool:
  - Correct transactionFeature properties order.
  - Input validation.
  - gfiAttributes nested object handling.
- LayerSelection: added "deactivateShowAllCheckbox" configuration, to disable the "Show All Checkbox" inside folders.
- LayerTree, LayerSelection: Introduced an alternative sorting function for layers utilizing the layerSequence prop.
- SliderItem: Added markers functionality for visual indication of key points along the slider range.
- Filter:
  - Added parameter questionLink. Can be configured to open a URL with information about the tool.
  - A new parameter "closeDropdownOnSelect" to enable/disable closing list after selecting an option in multiselect dropdown list.
- CustomMenuElement: Added configuration "showOnlyByLayersVisible" to specify a list of layer IDs that must be visible for the module to appear.
- Folder in menu: "showEntryDirectly" to directly open and display entries based on configuration and active layers.

### Changed
- Coding Conventions: updated.
- Menus: Increased maximum width of menu and secondary menu to 95% of viewport.
- secondary Menu: Increasing width of secondary Menu over 70% of viewport (50% for viewwidth < 1000px) now temporarily hides layerpills and footer to show the secondary Menu at a maximum width of 95% of viewport.
- Filter: Parameters featureNS and featurePrefix removed from WFS-request due to redundancy and invalid values at specific layers.
- dependencies:
        - @masterportal/masterportalapi: 2.45.0 to 2.47.0 (This also raised ol to version 10.4.0 and @cesium/engine to version 15.0.0)
        - @masterportal/masterportalapi: 2.47.0 to 2.48.0
- FullScreen: Using the FullScreen control in an iFrame keeps the current state (center, zoom, layers etc.) now.

### Fixed
- LayerInformation:
  - Empty contact accordion was shown, if metadata contains no contact.
  - Fixed wrong or undefined metadata showing when current Layer has no metadata.
  - Fixed an issue with no metadata, when cswUrl was undefined, rather than null.
- Loading the layer is accelerated by fixing generation of folder ids.
- ShareView: Duplicated url params are filtered.
- Issue #1324: CompareMaps: always show loading spinner when loading and do not split maps after closing tool.
- Issue #1348: BaselayerSwitcher: use preview settings from config.
- Issue #1358: Topic tree search can now also be used in multiple languages via i18next.
- Issue #1366: SearchInterfaceSpecialWfs highlighted multipolygons with empty areas and zooms to the extent and not to the first point of the geometries.
- layer2dVector: The style type "nominal" works on single features in clustered layers now.
- layer3dTileset: Can change the cesium scene parameter depthTestAgainstTerrain to true if needed.
- ShareView: Fixed sharing 3D map.
- UrlParams: 3D params heading, tilt and altitude are evaluated correctly.
- specialWfs search: Add hover/zoomTo support for linestring geometries.
- Searchbar: Fixed a bug where the searchbar would focus itself on mounting, scrolling the parent page if embedded in an iframe.

---

## 2025-03-05 v3.8.0

### Added
- i18next: added Nederlands language.

### Changed
- The following packages have been updated:
    - dependencies:
        - @masterportal/mpconfigparser: 1.4.0 to 2.0.0
        - axios: 1.7.7 to 1.7.9
        - chart.js: 4.4.4 to 4.4.8
        - i18next: 23.15.1 to 24.2.2
        - i18next-browser-languagedetector: 8.0.0 to 8.0.3
        - i18next-http-backend: 2.6.1 to 2.7.3
        - jsts: 2.11.3 to 2.12.1
        - three: 0.168.0 to 0.173.0
        - vue-multiselect: 3.0.0 to 3.2.0
    - devDependencies:
        - @eslint/js: 9.10.0 to 9.20.0
        - @sinonjs/fake-timers: 13.0.1 to 14.0.0
        - @stylistic/eslint-plugin-js: 2.8.0 to 2.13.0
        - @vue/compiler-sfc: 3.5.4 to 3.5.13
        - @vue/devtools-api: 6.6.4 to 7.7.2
        - chai: 5.1.1 to 5.2.0
        - esbuild-loader: 4.1.0 to 4.3.0
        - eslint-plugin-jsdoc: 50.2.2 to 50.6.3
        - eslint-plugin-vue: 9.28.0 to 9.32.0
        - fs-extra: 11.2.0 to 11.3.0
        - globals: 15.9.0 to 15.15.0
        - husky: 9.0.11 to 9.1.7
        - jsdoc: 4.0.3 to 4.0.4
        - mocha: 10.7.3 to 10.8.2
        - mochapack: 2.1.4 to 2.1.5
        - sinon: 18.0.0 to 19.0.2
        - zip-a-folder: 3.1.1 to 3.1.8
- Map: added a warning in console, if a listener is added to map for a function that binds this and no special key is provided.
- Routing: TsrUpload and RoutingBatchProcessing now use sharedComponent FileUpload for uploading files.
- OpenConfig: Now uses sharedComponent FileUpload.

### Fixed
- Alerting: Fixed bug, alerts now show everytime on pageload when alert.once is set to false.
- Issue #1190: Print: legends for json layer with geometry type lineString can now be printed.
- Issue #1218: Fixed the missing bbox in request for filter module if the param `searchInMapExtent` and `extern` is true.
- Issue #1299: change of textsize and rm of padding in NewsView Component.
- Issue #1320: Fixed long url when sharing a view with open search bar.
- Issue #1331: Show group layers in right order.
- Issue #1337: Fixed loading javascript addons missing import.
- Issue #1340: fixed duplicate menu entries in the mobile version.
- Issue #1355: Fixed the "urlIsVisible" attribute to properly take effect.
- Issue #1357: Fixed unauthorized errors by restoring credentials: include in utilsAxios to ensure cookies with login information are properly attached to requests.
- layer3dTileset: Fixed the default maximumScreenSpaceError value to be a number and increased it for better performance.
- Issue #1355: Fixed the "urlIsVisible" attribute to properly take effect.
- ShareView: Deleted import of BorisState as it caused a compiler error when addons are not integrated. Replaced it with a string instead.
- WMS-Time: GFIFeature is now called every time the time slider is used, ensuring the selected time is always displayed in the feature.
- BaselayerSwitcher: Fixed scrolling issue on low-height browser, so that all elements can still be scrolled into view.
- LayerTree: Corrected order of layers styled by `layerIDsToStyle`.
- TimeSlider: Fixed issue where dragging the slider while comparing two time instances updated both sliders instead of only the active one.
-  Menu: Navigating back from layerinformation to the previous menu item add subject.

---

## 2025-02-21 v3.3.4 (LTS)

### Fixed
- Issue #1106: Layer names, folder names and breadcrumbs are translated.
- Issue #1250: Loading the layer is accelerated.
- Issue #1301: CustomMenuElement now also works in secondaryMenu.
- Issue #1305, Issue #1327: fixed searchbar navigation, if used action-buttons.
- Issue #1309: fixed translation of periodicity.
- Issue #1316: fixed issue where currentComponent in the secondary menu would close when clicking on the map.
- Issue #1320: Fixed long url when sharing a view with open search bar.
- Issue #1340: fixed duplicate menu entries in the mobile version.
- LayerInformation: Added LayerInfo for each layer within a GROUP layer.
- Login-Module: Fix interceptor for login-secured services.
- Addons: Added missing import on loading javascript addons.
- SensorThings-Layer: problem with not visible features after move of map was solved.

---

## 2025-02-05 v3.7.0

### Added
- LayerTree: added a new parameter at layer `filterRefId` as an index of a configured filter Layer.
- CompareFeatures: applied the functionality from version 2 to 3 and changed the data display to use shared table (TableComponent).
- Modeler3D: Added filter & style function.
- ShareView: Include existing URL query parameters into the generated share URL.
- CustomMenuElement:
    - Added configuration support for 2D/3D viewpoints.
    - Added the possibility to add layers to the map and displays them in layerTree.
- WMS-Time: Updated to ensure WMS-Time Layer compatibility with version 1.3.0.

### Changed
- SearchBar: Added reset button to searchbar, so that the reset is shown and working in all browsers.
- OL: Changes in tests LayerPreview.spec.js after OL update.
- Issue #1338: AddWMS: The attribute `featureCount` can now be configured for the getFeatureInfo.
- dependencies:
        - @masterportal/masterportalapi: 2.42.2 to 2.45.0 (This also raised ol to version 10.3.1 and @cesium/engine to 13.0.0)


### Removed
- setupDev.md: Removed unneeded Python instructions.
- Readme: Link to RemoteInterface.md deleted due to it being outdated

### Fixed
- Issue #1106: Layer names, folder names and breadcrumbs are translated.
- Issue #1250: Loading the layer is accelerated.
- Issue #1301: CustomMenuElement now also works in secondaryMenu.
- Issue #1306: Layer names containing HTML-tags are rendered as HTML in Layer Tree.
- Issue #1312: AddWMS: All layers of the added WMS layers are now added in a folder structure in the layerSelection.
- Issue #1313: AddWMS: Added WMS layers are now no longer initially visible.
- Issue #1314: AddWMS: Added WMS are added in a folder structure in the layerSelection.
- Issue #1320: Shortened shared link when topic tree or boris component are open in menu, resolving the 'Submitted URI too large' browser error.
- Issue #1321: Grouped Layer: Child layer adopt the transparency from the config.json.
- Issue #1325: 3D tileset layers can now be styled via style_v3.json, see also [style.json.md](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/docs/User/Global-Config/style.json.md).
- Issue #1334: LayerSelection: Alphabetical sorting only takes place with tree type auto.
- Issue #1336: CompareFeatures: The star in GFI is only shown, if module compareFeatures ist available.
- Issue #1338: AddWMS: The infoFormat is now read from the capabilities. `application/vnd.ogc.gml` is preferred, because OL cannot handle the prefixes from the MapServer for the infoFormat `text/xml`
- layer3dTileset: Update of the layer only executes setOpacity if the value has changed.
- Print-Module: Exchanged deprecated mapfishServiceId for printServiceId and added optional chaining for payload.
- Routing: Fixed URL of ORS request in TSR
- SensorThings-Layer: problem with not visible features after move of map was solved.
- Login-Module: Fix interceptor for login-secured services.
- setupDev.md: Added relevant proxy-command.
- Readme: Links fixed
- Migrator: Layergroups with attribute `children` in config.json are migrated to version 3 configuration.
- Attributions: Attributions of 3D-layers are only shown in map mode 3D.
- ShareView: Fixed wrong zIndex to avoid the order of layers being incorrect after opening shared link.
- Filter: If the filter tool is closed, the open filter (accordions) lose their status and are closed the next time the tool is opened.

---

## 2025-01-02 v3.6.0

### Added
Geobasiskarten: Added new Layers 33780, 33793, 33787, 33797.
- SelectFeatures: Added click selection for features and added UI components to delete all or single features from the selection.
- AddWMS: add the possibility to configure example URLs to display under the module.

### Changed
- Portal/basic: Renaming of services.json and rest-services.json as in the documentation.
- Re-enabled setting the latest tag and uncommented the TODO regarding its usage in bitbucket-pipelines.yml.
- Filter: for wfs extern the wfs version of the defined service is used.

### Removed
Geobasiskarten: Removed old layers Geobasiskarten (farbig, graublau, schwarzgrau, schriftplatte) from Portals.

### Fixed
- Measure-Tool: fixed missing getters in test mock to prevent warnings.
- Issue #1270: draw_old: If the format selected for download does not support the geometry type of one or more drawn features, an error message is displayed.
- Issue #1271: Draw_old: fix download of features with multi geometries.
- Issue #1309: fixed translation of periodicity.
- Issue #1316: fixed issue where currentComponent in the secondary menu would close when clicking on the map.
- Issue #1305, Issue #1327: fixed searchbar navigation, if used action-buttons.
- Routing: fixed style for waypoints.
- Filter: The searched result list in dropdown should be sorted alphabetically.
- AddWMS: Fixed handling of service parameter.
- LayerInformation: Added LayerInfo for each layer within a GROUP layer.
- Portal Master: Fixed error in console by updating layer id.

---

## 2024-12-12 v3.3.3 (LTS)

### Fixed
- Fixed issue where the 3D view would not launch when button3d was configured under controls.expandable in config.json.
- Issue #1121: For secured services that have the isSecured attribute, the lock icon is now displayed again.
- Issue #1266: For layers whose ids are configured as an array, the visible range can now be restricted with `minScale` and `maxScale` in config.json.
- Issue #1272: Prevents MDID layer IDs from being removed when setting layer IDs, when a shared link with both layer IDs and MDIDs is opened.
- Searchbar: the search in search results shows results and no error occurs.
- wfst: layers that are not in services.json are supported.

---


## 2024-12-05 v3.5.1

### Changed
    - dependencies:
        - @masterportal/masterportalapi: 2.41.1 to 2.42.2 (revert ol and cesium version, because of problems with Routing)

---

## 2024-12-04 v3.5.0

### Added
- Measure-Tool: Added config parameter color for the measured lines and polygons.
- Measure-Tool: Now available in 3D mode (migrated from v2)
- Menu: new config parameter showHeaderIcon to show the icon of the current component in the menu header.
- WMS features with geometry can be highlighted with polygon marker.

### Changed
- The following packages have been updated:
    - dependencies:
        - @masterportal/masterportalapi: 2.41.0 to 2.42.1 (This also raised ol to version 10.2.1 and @cesium/engine to 12.0.1)
- WMS gfi responses with mimeType json/application are parsed as GeoJSON.


### Removed
- Issue #1300: Migrator: The following attributes are removed from the search interface bkg when migrating, as they have no effect: `minCharacters`, `suggestCount`, `suggestServiceId`, `zoomLevel`, `zoomToResultOnClick` and `zoomToResultOnHover`.
- GetFeatureInfo: The attributes `imageLinks` and `maxWidth` have been removed from the gfiTheme `Default`, as the images are now rendered within the table.

### Fixed
- Issue #1121: For secured services that have the isSecured attribute, the lock icon is now displayed again.
- Issue #1172: printing a layer with multiple style conditions doesn´t cause an error anymore.
- Issue #1242: The correct tooltip for the selected baselayer is now displayed in the baselayerSwitcher.
- Issue #1243: wfst: reacts on visibility changes of configured layer ids.
- Issue #1244: wfst: the correct geometry-buttons are displayed.
- Issue #1266: For layers whose ids are configured as an array, the visible range can now be restricted with `minScale` and `maxScale` in config.json.
- Issue #1272: Prevents MDID layer IDs from being removed when setting layer IDs, when a shared link with both layer IDs and MDIDs is opened.
- Issue #1280: showInLayerTree can be set up to false.
- Issue #1275: Layers without capabilitiesURL can now be added as baselayers.
- Issue #1287: The layers are now added to the topic tree in the same order in the layer selection when you click on `add all`.
- Issue #1288: fixed crash that occurred when resetting `compareMaps` without selected layers.
- Issue #1291: fixed reset of tool `compareMaps` to prevent layers from being removed from the layer tree.
- Issue #1292: fixed undefined in LayerInformation contact data and show zip code in one line with city.
- Issue #1300:
    - Searchbar: The EPSG code 25832 is now set as the default value in the search interface bkg.
    - Migrator: The attribute `geosearchServiceId` in the search interface bkg is now correctly renamed to `geoSearchServiceId`.
- Issue #1303: Resolved the issue with configs after migration, ensuring that the migrated portal now displays grouplayer IDs correctly.
- Issue #1308:
    - The postal code is now correctly placed before the city in the about module.
    - The `logo` and `version` in the about module can now be overwritten in config.json and shown or hidden.
- Issue #1315: fix time slider for wms time layers ignoring default values from layer.json and capabilities.
- wfst: layers that are not in services.json are supported.
- 3D: Fixed issue where the 3D view would not launch when button3d was configured under controls.expandable in config.json.
- Routing: The routing now also finds addresses with spaces and umlauts when the address search is carried out with the Locationfinder search interface.
- BuildPortal: Updated mastercodeVersionFolderName to prevent whitespaces and colons, ensuring correct CSS and JavaScript paths in index.html and common.json files. Added a timestamp (`_created_at_<createdAtDate>`) to the build folder name to ensure unique folder names for each build.
- LayerSelection: fixed alphabetical sorting of subtopics.

---

## 2024-11-15 v3.4.1

### Fixed
- Searchbar: the search in search results shows results and no error occurs.
- Filter: for FilterSnippets on gfiAttributes with object definition the title is now taken from the gfiAttribute.

---

## 2024-11-06 v3.4.0

### Added
- AddWMS: Added Information about CORS header to doc and changed error message.
- ShareView: Error handling when sharing via QR code has been improved.
- Maps: add filter to getFeature Request in zoomToGetAndFilterFeatures function.
- Routing:
    - Added checkbox to determine if routes stay visible after closing the routing tool
    - HGV-Routing with additional restrictions
    - Travelling Salesman Routing (TSR) with VROOM
- Login: Documentation was added to [config.js](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/doc/config.js.md).
- Filter supports secure WFS request.
- ShareView: Added hashtag to shared link to share link correctly.
- LayerInformation: Added last revision date to Layer Information.

### Changed
- The following packages have been updated:
    - dependencies:
        - @masterportal/masterportalapi: 2.40.0 to 2.41.0

### Removed
- Deleted the `namespaces` option, as it is not a valid configuration for `createStore`, and also removed it from the `docs/Dev/unitTestVue.md` tutorial.
- Renamed versionLatest to versionLatestDisabled in package.json, so that latest tag is not created until renamed back at the end of december.

### Fixed
- Fixed the issue that the legend information was empty when an empty legend-object was passed to the legend component.
- Corrected link for geodata infrastructure information pdf by GDI-DE.
- Issue #1238: fixed `CQL_FILTER` URL parameter sending invalid `undefined` values.
- Issue #1247: Grouped layer: added attribute `children` in config.json to overwrite attributes for single grouped layers, more see [Grouped layer](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/docs/Dev/groupedLayers.md).
- Issue #1276: Duplicate icons StartModule in expandable ControlBar.
- Issue #1286: i18next: Correct time patterns for missing key, converting 'HH.MM' to 'HH:MM'.
- Issue #1294: PoiChoice: Fixed translation for "customPosition",  PoiOrientation: Fixed layout for the list of POI items.
- `tree.type: auto`: layers configured in config.json do overwrite configuration in services.json.
- Fixed issue with German translation not displaying in styleVT and wfsSearch modules.
- Print:
    - Group layers of different `typ` are printed.
    - Fixed opacity for wfs group layers.
- WFST: The attribute names are now fully visible and no longer overlapped.
- BuildPortal: Fixed mastercodeVersionFolderName to never include whitespaces or colons to avoid an error being thrown, if the version you are building in includes them.
- Searchbar: The action "Show topic in folder" was fixed.
- i18next: Modified missing key handling to retain namespace prefixes.

---

## 2024-11-05 v3.3.2 (LTS)

### Added
- Issue #1247: Grouped layer: added attribute children in config.json to overwrite attributes for single grouped layers, more see [Grouped layer](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/docs/groupedLayers.md).

### Fixed
- Print: Group layers of different `typ` are printed.

---

## 2024-10-09 v3.3.1 (LTS)

### Fixed
- Reduced loading requests for layers defined as array of Ids (not of typ GROUP).
- Print: Fix printing bug considering minScale and maxScale with layers defined as array of ids.
- LayerInformation: Resolved an issue where the tab appeared due to layerInfo.url being undefined instead of null in the layerInformation component.

---

## 2024-10-02 v3.3.0 (LTS)

### Added
- Release Schedule and release information to readme.md.
- FileImport: Added the possibility to configure the confirmation window to show or not.
- Searchbar: mapMarker or polygonMarker stays visible on close of search results.

### Fixed
- AlertingItem: Fixed the position of closing button.
- Issue #1166: function isHTML now recognizes more HTML tags in one String as valid.
- Issue #1179: Add Parameter "WithCredentials" to highlightFeaturesByAttribute axios request, so that it works with secured layers.
- LayerInfoContactButton: no warning in console, if at layer `md_name` ist not available in `datasets`.
- LayerSelection: `tree.type: auto`: change of category creates correct folders.
- Draw_old: import KML file works correctly.
- GroupLayer: Layer of the type group consider now min and max scale of the single layer in 2D.

---

## 2024-09-19 v3.2.2
### Fixed
- 3D: `tree.type: auto` 3D layers can also be selected in the subject tree if additional layers are configured in config.json under `subjectlayer`.

---

## 2024-09-12 v3.2.1
### Fixed
- UrlParams:
    - mapMarker: Fixed map marker set by url parameter.
    - layerIds: if a layerId in params is part of a baselayer group, the group is loaded.

---

## 2024-09-04 v3.2.0
### Added
- WFST: Added buttons names for confirm and stop.
- Alerting: Examples for the configuration of messages have been added to the alerting documentation.
- Modeler3D: Modeler3D was added
- LayerTree:
    - In SubMenu added button to open contact form with layer specific parameters to be used in email.
    - Adds parameter buttonTitle in addLayerButton to enable to configure the button title.

### Changed
- LayerSelection
    - Switches layer categories selection from <select.. to <radio.. using a collapsed list open/close within a IconButton.
    - Adds handling for parameters in `config.json`/`portalConfig.tree`:
        - `hideBackgroundsHeader` to hide the headline for backgrounds
        - `backgroundsHeaderText` custom headline for the backgrounds (to overwrite the default translation)
        - `hideDatalayerHeader` to hide the headline for datalayers
        - `datalayerHeaderText` custom headline for the datalayers (to overwrite the default translation)
- Login:
    - Access Tokens are now revoked after logout.
    - The WMS-Time layer are now available after you have logged in with the login module.
- The following packages have been updated:
    - dependencies:
        - @masterportal/masterportalapi: 2.39.0 to 2.40.0
        - axios: 1.7.1 to 1.7.7
        - chart.js: 4.4.3 to 4.4.4
        - i18next: 23.11.5 to 23.15.1
        - i18next-http-backend: 2.5.2 to 2.6.1
        - qrcode: 1.5.3 to 1.5.4
        - three: 0.165.0 to 0.168.0
    - devDependencies:
        - @eslint/js: 9.3.3 to 9.10.0
        - @geoblocks/print: 0.7.8 to 0.7.9
        - @sinonjs/fake-timers: 11.2.2 to 13.0.1
        - @stylistic/eslint-plugin-js: 2.2.1 to 2.8.0
        - @vue/compiler-sfc: 3.3.4 to 3.5.4
        - @vue/devtools-api: 6.5.0 to 6.6.4
        - @vue/test-utils: 2.4.1 to 2.4.6
        - chai: 4.4.1 to 5.1.1
        - eslint-plugin-jsdoc: 48.2.7 to 50.2.2
        - eslint-plugin-mocha: 10.4.3 to 10.5.0
        - eslint-plugin-n: 17.9.0 to 17.10.2
        - eslint-plugin-vue: 9.25.0 to 9.28.0
        - eslint-plugin-vuejs-accessibility: 2.3.0 to 2.4.1
        - globals: 15.4.0 to 15.9.0
        - mocha: 10.4.0 to 10.7.3
        - sinon-chai: 3.7.0 to 4.0.0
        - vue-loader: 17.3.0 to 17.4.2
        - zip-a-folder: 3.1.6 to 3.1.7
- Import GeoJson
    - GFI attributes are added in the import of a standard GeoJson
    - Supports a new structure of the draw style properties which are set in the export of the draw tool as well as the old ones
    - Adds a custom styling option for GeoJson/ Json import
- Export from draw_old tool: update GeoJSON export from draw_old tool to encapsulate all draw specific properties in a masterportal_attributes property; printing, file import and exporting other formats than GeoJSON were adapted accordingly
- Searchbar in topic tree: More than one searchinterface is supported. Results are shown under category headers.

### Deprecated
- Searchbar in topic tree config.json configuration: 'searchInterfaceInstances' must contain the search interfaces to use. 'searchInterfaceInstanceIds' and 'searchCategory' are deprecated.

### Fixed
- Legend: Same legends of group layers are shown only once.
- Filter: The buttons were always disabled in the accordion of the filter.
- LayerSelection: After layer category switch the visible background layer were removed from layer selection.
- Issue #1224: SecondaryMenu for mobile after closing allows to select coordinates.
- GetFeatureInfo: Images are displayed and the size of images was adapted.
- Login: Access Tokens are now revoked after logout
- OAF-Layer: if parameter 'bbox' is not set, the 'bbox' in parameter 'datasets' is used. Fallback is maps extent.
- Print: Fixed error messages when zooming after map printing is closed
- UrlParams:
        - mapMarker: Fixed map marker set by url parameter.
        - layerIds: if a layerId in params is part of a baselayer group, the group is loaded.
- Styling: the config.json parameter `tree.layerIDsToStyle` is taken into account for all tree-types.

---

## 2024-08-07 v3.1.0
### Added
- SearchBar: Added the possibility to zoom to an extent from a search result.
- StatisticDashboard:
    - Updated UI of the filter to match the MP 3.0 Design.
    - Dropdowns now sort the selected entries always at the top.
    - Statistics from different categories are now listed together in a dropdown when multiple categories are selected.
    - Legend can now use different classifications to show data for the choropleth map and the legend.
    - The number of data in the diagrams has been limited to a maximum value as this ensures better clarity. Once the maximum value has been reached, a selection option is provided with which the data can be searched for manually.
    - Uses the OAF scheme request to load unique values faster.
    - Added export button for CSV export.
    - The name of multi selected statistics will be shown in a carousel.
    - Coordinate reference system and epsg code for OAF services are now configurable with parameter oafRequestCRS and oafDataProjectionCode.
    - Extended region filter
    - Button "All" for selecting all the regions and all in dropdown of districts and cities.
- OAF: Added scheme request function in the api folder for the getOAFFeature file. This can be used for an easy and fast way to gather unique values.
- ViewPoint: Migrated from dev to dev.
- Matomo: Added Support for analytics via matomo.
- Migrator: supports ids with suffix.
- InputText: Added change event handler property and disabled property.
- BaseLayerSwitcher: Added Config-Parameter singleBaseLayer to hide previous selected BaseLayer
- Shareview: If the portal is not running on HTTPS, a message is displayed because the URL cannot then be copied to the clipboard.
- AboutModule:
    - Added data privacy section.
    - Added accessibility section.
    - Added imprint title.
    - Added contact button to open contact module.
    - Added sales tax identification number.
- Footer: Added link to open imprint in about module.
- LayerInfo:
    - Added contact information
    -  Added button to open contact form using the address data from the metadata as the addressee (to parameter)
- ContactFormular:
    - Posibility to send attached pdf from the contact us section.
    - Check for the sum of all attachments size.
    - Check if the same attachment is not already added and don't allow for duplicates.
    - Added info message at the top of the contact form
    - Can be opened from other components using props, which allow a different addressee (to) to be used from the one set in config.json
- Print: Parameter additionalLayer to add layer (e.g. coordinate grid) during print.

### Changed
- Eslint: no-undef eslint rule is switched on.

### Fixed
- Fix migration of login module to Masterportal v3
- Issue #1192: Searchbar: The TopicTree search interface supports the search for folders.
- Issue #1219: AddWMS: Corrected z-index for imported layers if only on baselayer is initial visible.
- Issue #1232: Searchbar: The TopicTree search interface does not fail on configured `resultEvents`.
- Added missing parentheses in v-for loops
- StatisticDashboard:
    - Statistics and Regions are sorted alphabetically.
    - The information text will show under legend when there are more than one statistics selected.
    - Unit test warnings.
    - mapGetters and mapMutations in components.
- LayerPreview for WMTS uses the crs of the service.
- Legend: changed the name in the legend for group and baselayer.
- OAF-Layer: bbox and bboxCrs are respected when building url.
- Auto portal: search in LayerSelection works.
- Print:
    - print mask is now visible for group layer
    - zIndex and transparency from the group layer are also adopted in printing
- Filter: onDownloadProgress function will be commented out in axios in filter.
- LayerInformation: The entry `show_doc_url` in the metadata is now used again to retrieve further information.
- Menu: HTML entities are now decoded for folders in the menu
- Migrator:
    - Alt tag for portal logo is now used as tooltip and alt tag.
    - Placeholder of the search bar is now adopted.
    - The komoot search interface is now renamed komootPhoton.
    - Corrected console output concerning not migrated tools.
- BaselayerSwitcher: if 2 baselayers are configured, switcher is displayed.
- Cesium library is only loaded, if button to switch to 3D is configured.
- Layertree: if no button to add layers is configured, layers cannot be removed by drop outside.
- Issue #1198: WMS link can contain "?".
- ContactFormular:
    - removed attachments are not being send.
    - uploading attachments separately doesn't remove previously added attachments.
- Graphical Select: Fixed an issue where the drawn geometry was not correctly displayed after unmounting and remounting the component.
- Topic tree/Search bar
    - Scrollbars have been adjusted so that they only appear in the Firefox browser when they are needed.
    - The results of the `topicTree` search are no longer displayed twice in Firefox.
    - With the `topicTree` search, you can now access the layerSelection via the folder icon, even if no search is configured in the layerSelection.

---
## 2024-06-27 v3.0.0
### __Breaking Changes__
- GetFeatureInfo:
    - module was renamed from `gfi`.
    - `desktopType` was removed, `detached` and `attached` are no longer provided, getFeatureInfo is displayed in sidebar.

- Moved config.json-Parameter `twoFingerPan` from `portalConfig.map.mapView` to `portalConfig.map.mapView.mapInteractions.interactionModes`.

Under the headline `deprecated` you can find several changes of removed deprecated properties and tools.
In certain circumstances this means that you have to update your portal files (index.html, config.js and config.json) according to the new changes in order to use your portal furthermore.

### Added
- Added config.json-Parameter `Portalconfig.tree.singleBaselayer`. Specifies whether only one base layer may be active at any time selectable by radio-buttons in visible layers.
- Added config.json-Parameter `Portalconfig.tree.showFolderPath`. Determines whether the folder structure of visible layers is displayed. Default is false.
- Added Shared Component for spinner.
- Added Shared Component for accordion.
- Added Shared Component for table with sort,display and download options.
- ShareView:
    - Legend, Layer information, getFeatureInfo, draw_old and wfsSearch can be shared.
    - bufferAnalysis can be shared even if it is configured in both menus.
- 3D: Min- and MaxScale are now available for layers.
- Print: An option "Improve scaling resolution" is implemented for 3d Layers to supply an improved and better resolution.
- WfsSearch:
    - A prop `resetParcelSearch`, so that the wfs search parameter could be resetted from outside component.
    - A prop `zoomLevelProp`. Can be used to set a zoom level (after search) that is different from the configured one.
- Filter:
    - A new parameter `closeGfi` to give an option if a gfi window is open, and it could be closed after a new filtering.
    - A new parameter `universalSearch` in snippet with type "featureInfo" to enable to search the attribute value in webpage.
    - A new parameter `beautifiedAttrName` in snippet with type "featureInfo" to supply beautified names for attributes.
    - A new parameter `adjustOnlyFromParent` in snippet (up to now only for "Dropdown" type) to allow adjust just from parent snippet.
    - A new parameter `linkText` to show a url link to the current filter setting at the bottom of the filter component.
    - A new parameter `allowEmptySelection` in snippet with type "dropdown" to allow all values to be deselected.
    - A new component `SnippetChart`. SnippetChart can be configured as a one of the filter snippets and renders a chart as a visual representation of the data that result from the current filter settings. Makes use of BarchartItem (LinechartItem and PiechartItem may be added in the future), which uses the chart.js library and its various configuration options.
    - A new parameter `alternativeTextForEmptyChart` in snippet type "chart" that can be displayed instead of chart.
    - A new parameter `initialStartupReset` which allows to show a reset button and reset the filter back to initial setup. It prevents the adjusting so it should not be used as a reset for filter configurations without a child snippet.
    - A new parameter `subtitle` in snippet type "chart" which allows to display any combination of text and data as a subtitle.
    - A new parameter `tooltipUnit` in snippet type "chart" that can be used to add a unit to the numbers shown in tooltip.
- LayerTree: A paramter `isNeverVisibleInTree` for layer config to supply an option to hide the layer in tree but can be loaded.
- PoiOrientation:
    - The result window can now be moved.
    - New parameter `onlyFilteredFeatures` introduced, so that only filtered features are displayed in the results window.
- Grouped layers are supported.
- Script to migrate masterportal configuration files to version 3.0.0 migrates layertree with folder structure ("Ordner" in config.json version 2) and group layers.
- Added general CQL filter support for layers and WMS support to add CQL filters by attribute.
- Doc-files explaining migrateConfig script are added.
- Control rotate: has been extended by two buttons to rotate the map clockwise and counterclockwise. A compass rose can be shown in 2D and 3D.
- Tooltips for layernames and folders.
- Addons of type "javascript" or "control" can be loaded.
- Map: on touch devices the map can be moved with two fingers, if `twoFingerPan` is true in config.json.
- FeatureLister: layers of typ OAF are supported.
- StatisticDashboard:
    - Can now load data from an OAF Rest API if an OAF layer is configured.
    - Reset All button.
    - Validation function in filter form.
    - Configurable number of classes and base color for choropleth map and legend.
- TableComponent: New prop `sortByNumericValue`: Optional, defaults to false. If set to true, data elements are compared by their parsed numeric value when user triggers sorting. (By default, they are sorted by their string value.)
- Search for address via URL-Parameter.
- The following packages have been added:
    - dependencies:
        - globals: 15.4.0
    - devDependencies:
        - @eslint/js: 9.3.3
        - eslint-plugin-jsdoc: 48.2.7,
        - eslint-plugin-mocha: 10.4.3,
        - eslint-plugin-n: 17.9.0,
        - @stylistic/eslint-plugin-js: 2.2.1
- Added several WFS-T fixes and improvements.
- Added `searchType` to treeSearch with default search by name otherwise md_name of dataset can be used.
- Added possibility to fit layer extent from layer capabilities.
- Introduced a new `compareMaps` tool that allows users to compare two different layers side by side. This tool provides functionalities for selecting and displaying two layers simultaneously, with a swiper control to adjust the visibility of each layer interactively. Users can switch between vertical and horizontal split directions for better visualization.

### Changed
- CoordToolkit: Toast added instead of Alert for feedback after copying coordinates.
- ShareView: Added more configuration. Sharing possibilities (Qr code, social media, ...) can now be customized.
- LayerMenu: Breadcrumbs with folder location path will now stick to the top when scrolling.
- 3D tileset layer supports hiddenFeatures.
- Update node version to 20.12.2.
- The following packages have been updated:
    - dependencies:
        - @masterportal/masterportalapi: 2.33.0 to 2.39.0 (This also raised ol to version 9.2.4 and @cesium/engine to 9.2.0)
        - @masterportal/mpconfigparser: 1.3.1 to 1.4.0
        - axios: 1.5.1 to 1.7.1
        - bootstrap: 5.3.2 to 5.3.3
        - bootstrap-icons: 1.11.1 to 1.11.3
        - chart.js: 4.4.0 to 4.4.3
        - i18next: 23.5.1 to 23.11.5
        - i18next-browser-languagedetector: 7.1.0 to 8.0.0
        - i18next-http-backend: 2.2.2 to 2.5.2
        - i18next-vue: 3.0.0 to 4.0.0
        - jsts: 2.11.0 to 2.11.3
        - vue-multiselect: 3.0.0-beta.3 to 3.0.0
    - devDependencies:
        - @sinonjs/fake-timers: 11.1.0 to 11.2.2
        - chai: 4.3.10 to 4.4.1
        - css-loader: 1.0.1 to 4.3.0
        - esbuild-loader: 4.0.2 to 4.1.0
        - file-loader: 2.0.0 to 6.2.0
        - fs-extra: 11.1.1 to 11.2.0
        - husky: 8.0.3 to 9.0.11
        - jsdoc: 4.0.2 to 4.0.3
        - markdown-it: 13.0.2 to 14.1.0
        - mocha: 10.2.0 to 10.4.0
        - regenerator-runtime: 0.14.0 to 0.14.1
        - replace-in-file: 7.0.1 to 7.1.0
        - sass: 1.69.0 to 1.77.2
        - sinon: 16.1.0 to 18.0.0
        - webpack-bundle-analyzer: 4.9.1 to 4.10.2
        - zip-a-folder: 3.1.3 to 3.1.6
        - eslint-plugin-vuejs-accessibility: 2.2.0 to 2.3.0
        - eslint-plugin-vue: 9.17.0 to 9.25.0

- Changed prePushHook to check config.json with mpconfigparser for version 3.0.0.
- Restructured `highlightFeature` and `removeHighlighting`.
- Improved mobile view handling e.g. through adaption of the media breakpoints.
- Script to migrate masterportal configuration files to version 3.0.0 is ready to use.
- Styling for Search Results to match topic tree.
- GetFeatureInfo: Added mutation removeGfiFeatureByLayerId to remove a GfiFeature by given layerId.
- Remove only Version 2 relevant information from docs, jsdoc and functions.
- The `layerSwiper` functionality has been refactored and moved into the shared modules.

### Deprecated
- Alerting: removed deprecated property `text`, use `content` instead.
- Wfst:
    - removed deprecated property `show`, use `available` instead.
    - removed deprecated property `areaButton`, use `polygonButton` instead.
    - removed deprecated property `edit`, use `update` instead.
    - removed deprecated property `caption`, use `text` instead.
    - removed deprecated property `useProxy`.
- Draw_old: removed deprecated property `caption`.
- Print: removed deprecated property `useProxy`.
- Search interface BKG: removed deprecated property `zoomToResult`, configure `resultEvents` instead.
- Search interface SPECIAL WFS: removed deprecated property `definition[x].data`.
- Topic-Tree: removed deprecated property `Baumtyp`, use `tree.type` instead.
- WfsFeatureFilter: removed deprecated tool `wfsFeatureFilter`.
- ExtendedFilter: removed deprecated tool `extendedFilter`.
- SearchByCoord: the deprecated tool `searchByCoord` was removed, use `coordToolkit` instead.
- SupplyCoord: the deprecated tool `supplyCoord` was removed, use `coordToolkit` instead.
- Parcel-Search: removed deprecated tool `parcelSearch`, use search interface `wfsSearch` instead.
- GDI-Search: removed deprecated search `gdi`, use search interface `ELASTIC` instead.
- Utils: removed deprecated function `isChrome`.
- index.html: removed deprecated class `lgv-container` of div. Update content of index.html to new structure.
- config.js: removed deprecated property `gfiWindow`.
- Layer GEOJSON: The deprecated subTyp `OpenSenseMap` was removed.
- map3DParameter:
    - the deprecated property `cesiumParameter.enableLighting` was removed, use `map3dParameter.globe.enableLighting` instead.
    - the deprecated property `cesiumParameter.maximumScreenSpaceError` was removed, use `map3dParameter.globe.maximumScreenSpaceError` instead.
    - the deprecated property `cesiumParameter.tileCacheSize` was removed, use `map3dParameter.globe.tileCacheSize` instead.

### Removed
- RoutingLoadingSpinner: Was replaced with share component SpinnerItem.
- ModalItem in WFSSearch. Results are displayed as table now.
- The following packages have been removed:
    - devDependencies:
        - eslint: 8.51.0
        - eslint-plugin-chai-friendly: 0.7.2
- QuickHelp: removed module `quickHelp`
- Search interface BKG: removed property `zoomToResultOnHover` and `zoomToResultOnClick`, configure `resultEvents` instead.


### Fixed
- Issue #1084: fix wrong pointMarker placement when featureType is MultiPolygon.
- Issue #1095: FeatureLister: Fixed highlighting on hover and on click.
- Issue #1114: pass credentials to tiled WMS layers if `isSecured` is set.
- Issue #1118: the `wfsSearch` module now works with multiple select boxes.
- Issue #1119: Routing module: the route is also displayed when the start and end points are selected via the search.
- Issue #1120: the map view gets centered on searched coordinate again.
- Issue #1124: fixed url used in WMS-time layer and in zoomTo environment to not use more than one questionmark.
- Issue #1125: Routing module: Blocked areas can be deleted again.
- Issue #1130: Routing module: fix the bug that interval value could be smaller than minimum interval value.
- Issue #1132: Routing module: error messages have been improved.
- Issue #1136: Routing module: the coordinates change again when point is moved or deleted.
- Issue #1140: AddWMS module: GFI display works again with imported WMS.
- Issue #1144/#1146: the baselayer preview now works for WMTS Layer that have an XML as getCapabilities-URL.
- Issue #1148: fixed bug in vector search so that it can handle GeometryCollection.
- Issue #1153: the Parameter "isSecured" is now recognized if defined in the config.json.
- Issue #1174: Draw: the outer outline color of the double circle is drawn as selected.
- Issue #1182: the order of the layers in the map for initially no subject layers has been corrected.
- Issue #1203: Coordinates: MapMarker stays on the map until other place is selected and disappears when we leave coordinates section.
- Layer selection: the order of the layers corresponds to the order of the layers in config.json.
- AddWMS module: now displays metadata correctly when adding a WMS layer, if "cswId" is specified in the configuration.
- Fixed HighlightFeature for MultiPolygons: in certain WFS layers, when polygon selection is enabled,
    clicking on a polygon would highlight it, but multiPolygons wouldn't. This has now been corrected.
- UrlParams: the correct layers will be visible when copying the URL.
- Routing: spinner will spin again when loading.
- Contact Form: telephone number field shows error when entering letters and fields provide better feedback.
- FileImport: import of GPX-files imports routes, tracks and points. Import of geojson-files imports all besides circles.
- MainMenu: resizing doesn't cause layout problems anymore.
- The TopicTree-Searchinterface failed if there is an empty folder in the topic tree. Now it runs over empty folders.
- Layer Settings: styling of the settings menu.
- Filter: closing the filter with more than one child dropdown snippet selected and opening it again does not trigger an infinite loop anymore.
- WfsSearch: it is now also possible to zoom in on result features with a geometry of type polygon.
- Jsdoc: Generating report works again.
- Print: StyleId can now differ from layerId.
- GetFeatureInfo: the heading has been corrected for 3D objects.
- SingleBaseLayer: if layers change visibility, the baselayer will no longer be turned insvisible as well.
- English language: it is possible to change the language to English of the menu on the right side.
- OAF: layers are displayed if activated in 3D mode.
- Layers: if only maxScale is set at layer, minScale is set to 0.
- 3D: GFI of Cesium3DTileFeature shows correct properties.
- SearchBar: no error is logged to console, if a search request is aborted, because the same URL is requested again.
- Routing directions: no "empty" button, it is not clickable anymore
- Legend: using `legend: ignore` doesnt show up legend tab in layer information.
- GetFeatureInfo: color highlight disappears after closing the description

### Known Issues
- The module `modeler3D` is not yet moved to version 3. It will be added in the next minor release.
- The zoom to searched folders in the layerTree is not yet possible. It will be added in the next minor release.

---

## 2023-12-18 v3.0.0 - beta2
### __Breaking Changes__
- Dropped support for NodeJS 16 and Npm 8
- e2e tests are no longer supported
- The following attributes have been renamed:
    - Baselayer --> baselayer
    - Fachdaten --> subjectlayer
    - Portalconfig --> portalConfig
    - Themenconfig --> layerConfig
- The following attributes have been moved within config.json:
    - Portalconfig.baselayerSwitcher -> portalConfig.map.baselayerSwitcher
    - Portalconfig.controls -> portalConfig.map.controls
    - Portalconfig.getFeatureInfo -> portalConfig.map.getFeatureInfo
    - Portalconfig.mapView -> portalConfig.map.mapView
    - Portalconfig.mouseHover -> portalConfig.map.mouseHover
    - Portalconfig.tree.layerPills -> portalConfig.map.layerPills
- The following attributes have been moved from config.json to config.js
    - Portalconfig.alerts -> alerting.initialAlerts (`alerts` has been renamed to `initialAlerts`)
- The following attributes have been moved from config.js to config.json
    - cesiumParameter -> portalConfig.map.map3dParameter (`cesiumParameter` has been renamed to `map3dParameter`)
    - featureViaURL -> portalConfig.map.featureViaURL
    - mapInteractions -> portalConfig.map.mapView.mapInteractions
    - mapMarker -> portalConfig.map.mapMarker
    - startingMap3D -> portalConfig.map.startingMapMode (`startingMap3D` has been renamed to `startingMapMode`)
    - zoomTo -> portalConfig.map.zoomTo

### Added
- Add roadmap information to the readme file.
- Add documentation for the [config.js](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/doc/config.js.md) and [config.json](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/doc/config.json.md).
- Configurable searchBar for the layerselection.
- To manage dependencies of dependencies "overrides" for cesium are added to package.json and create dummy packages for it.
- New config.json parameter `sldVersion` for legend configuration to define a `Styled Layer Descriptor` for the GetLegendGraphic requests.
- The following packages have been added:
    - devDependencies:
        - webpack-bundle-analyzer: 4.9.1 (For usage comment in "webpack-bundle-analyzer"-code in webpack.dev.js)
- shared\js\utils\convertColor: added an option to convert an rgba array into a hex color with alpha value.
- Configurable searchbar for the layerSelection.
- Add layerParam `gfiThemeSetting`.

### Changed
- GetFeatureInfo: module opens in other menu when print module is opened
- LayerInformation: for layers that do not have metadata, the layer information can now be displayed so that the URLs and legend can be accessed.
- The following NPM packages have been updated:
    - dependencies:
        - @masterportal/masterportalapi: 2.28.0 to 2.30.0  (This also raised ol to version 8.1.0 and olcs to version 2.16.0)
        - @popperjs/core: 2.11.6 to 2.11.8
        - @vue/compat: 3.2.47 to 3.3.4
        - axios: 1.3.4 to 1.5.1
        - bootstrap: 5.2.3 to 5.3.2
        - bootstrap-icons: 1.10.3 to 1.11.1
        - chart.js: 4.2.1 to 4.4.0
        - i18next: 22.4.11 to 23.5.1
        - i18next-browser-languagedetector: 7.0.1 to 7.1.0
        - i18next-http-backend: 2.2.0 to 2.2.2
        - i18next-vue: 2.1.1 to 3.0.0
        - jsts: 2.9.2 to 2.11.0
        - qrcode: 1.5.1 to 1.5.3
        - vue: 3.2.47 to 3.3.4
        - vue-datepicker-next: 1.0.2 to 1.0.3
        - vue-multiselect: 3.0.0-beta.1 to 3.0.0-beta.2
    - devDependencies:
        - @geoblocks/print: 0.7.3 to 0.7.4
        - @sinonjs/fake-timers: 10.0.2 to 11.1.0
        - @vue/compiler-sfc: 3.3.2 to 3.3.4
        - @vue/test-utils: 2.3.1 to 2.4.1
        - canvas: 2.11.0 to 2.11.2
        - chai: 4.3.7 to 4.3.10
        - esbuild-loader: 3.0.1 to 4.0.2
        - eslint: 8.36.0 to 8.51.0
        - eslint-plugin-vue: 9.9.0 to 9.17.0
        - fs-extra: 11.1.0 to 11.1.1
        - markdown-it: 13.0.1 to 13.0.2
        - mock-local-storage: 1.1.23 to 1.1.24
        - regenerator-runtime: 0.13.11 to 0.14.0
        - replace-in-file: 6.3.5 to 7.0.1
        - sass: 1.59.3 to 1.69.0
        - sinon: 15.0.2 to 16.1.0
        - vue-loader: 17.0.1 to 17.3.0
        - webpack: 4.46.0 to 4.47.0
        - zip-a-folder: 1.1.5 to 3.1.3

- SearchBar: styled the input field.
- Print: styled loading button.
- The roadmap dates have been updated. See [Readme](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/README.md).
- Layers are only displayed on the 2D-map, if layers attributes minScale and maxScale are in maps scale-range. The layer is grayed out in the topic tree if it is not displayed on the map.
- Main Menu: added margin so scrollbar is visible on desktop.
- Search results: layers can now be added/removed directly to/from the map by activating the checkbox. The add layer button has been removed.
- Highlighting features via URL:
    - Now accepts multiple feature ids, seperated with commas.
    - Zooms the map, so that all highlighted features are visible.
- Layer selection: layers can now be added directly to the map by activating the checkbox. The add layer button has been removed. All layers are always displayed, including the layers that have already been added.
- Searchbar configuration 'minChars' was renamed to 'minCharacters'.
- ShareView: new wording for buttons and toast added for feedback after link copying.
- Tutorial: ScaleSwitcher tutorial was updated.
- Layerinformation: different labels have been updated.
- Migrated the tool `login` to MP3.0.0


### Removed
- The following NPM packages have been removed:
    - dependencies
        - @panter/vue-i18next
        - dayjs (is loaded via @masterportal/masterportalapi)
        - moment
        - moment-timezone
    - devDependencies:
        - cross-env
- `Legend` : The `showLegend` and `showCollapseAllButton` attributes have been removed

### Fixed
- Issue #859: Allow saveSelection for 3D.
- Issue #1073: Routing: the route is updated after moving a waypoint in the map.
- Issue #1085: Corrected case at import of layer2dRasterWmsTime layerFactory.js.
- Issue #1091: VectorStyle: read geometry type from geoserver featureTypeRequest and do not fail if some rules in style.json have no condition.
- Issue #1094: Measure Tool: unit changes not connected anymore.
- Issue #1099: The package.json is adapted, now the size of the bundle, created with "npm run build" is reduced.
- Issue #1105: Added easting and nothing labels for utm projections in CoordToolkit
- Mobile View: switching vertical and horizontal view works better now.
- Fix click issue between link of logo area and searchbar.
- Close Button is now in line with Menu navigation.
- Modules: open modules are closed when switching to a mode, that they do not support.
- Tree: sorting the layers in the topic tree in the same order as via share link.
- GFI: shown GFI is closed if dedicated layer is removed from map.
- OAF layers are now loaded and displayed correctly.
- Draw: imported features can be modified and deleted. GetFeatureInfo attributes are shown on click on imported feature.
- The routing module can now be saved via shareView.
- Print: only layers are printed that are also displayed in the current scale

---

## 2023-10-04 v3.0.0 - beta1
### __Breaking Changes__
- Configuration:
    - The `wfsSearch` modules config.json parameter 'field'-property `type` was renamed to `queryType`
    - New config.json parameter 'tree' added. Contains:
        - 'type' (was 'treeType' or 'Baumtyp' at root before), the following params are possible: "auto" ( = old "default")
        - 'addLayerButton': if active:true, a button to add layers is shown. On the first menu side only Layers configured in config.json with attribute 'showInLayerTree':true or "visibility": true is shown.
        - 'validLayerTypesAutoTree' (new parameter) only for tree type 'auto'
        - 'layerIDsToIgnore' (moved from config.js) only for tree type 'auto'
        - 'metaIDsToMerge' (moved from config.js) only for tree type 'auto'
        - 'metaIDsToIgnore' (moved from config.js) only for tree type 'auto'
        - 'layerIDsToStyle' (moved from config.js) only for tree type 'auto'
        - 'categories': only for tree type 'auto', contains categories in datasets of layers. Tree is structured by them.
    - The configuration of 'Themenconfig' changed: Layers are contained in "elements"-Array and have type "layer", folders have type "folder." Type "layer" is default and can be omitted.
    - The attribute 'cache' on the layer is no longer taken into account with tree.type 'auto
    - 'supportedTreeTypes': attributes 'supportedDevices' and 'supportedMapModes' are added to each module to make it configurable in which tree type the module should be displayed.
    - The configuration for `mouseHover` is moved from config.js to config.json. Also, the configuration is now optional.
    - The width of the ScaleLine [in cm] can now be configured with the attribute `scaleLineWidth`.
    - It is now possible to configure a search interface more than once. For example `elasticSearch`.
- Modules/Controls:
    - Controls: a control can only be configured in config.json as "expandable". "bottomControl" is no longer supported.
    - GetFeatureInfo:
        - The `gfi` module has been renamed to `getFeatureInfo` and is now configured at the top level in config.json/portalconfigs.
        - The menu side can be accessed under `Portalconfig.getFeatureInfo.menuSide`.
    - The `startTool` control has been renamed to `startModule`. Modules are now completely configured within the control.
    - The `saveSelection` module can now be found as `Copy link` within the `shareSelection` module.
    - PortalFooter
        - The Footer has been renamed to `portalFooter` and its configuration has been moved from config.js to config.json.
        - The `scaleLine` is now a fixed part of the `portalFooter` and is configured within it.
        - In the `portalFooter` only `urls` and the `scaleLine` are configured. For the other contents e.g. `version` or `footerInfo` a module is created in the menu. Language switching has also been moved to a separate `language` module.
    - The 'active' attribute has been removed from the modules. Instead, a module to be displayed initially can now be defined centrally for each menu window with the attribute `currentComponent`.
    - LayerIds can no longer be configured as Object in the layer configuration (config.json). Instead the suffix `#` should be used to use a LayerId more than once.
    - The `mapMarker` is now a part of `map`.
    - You can configure the possibility to add attachments to the `contact` form.
    - `Menu`: the menu has been refactored and changed completely from horizontal menu bar to sidebar navigation.
    - `Searchbar`: The searchbar has been refactored with new options e.g. that the order of the search results can be configured accordingly the order of the searchInstances in the config.json. Furthermore, the search results are categorized by the different search categories. ClickEvents can be defined for search results (e.g. zooming to results). Furthermore, buttons can be defined for the individual search interfaces, which are displayed at each search result that is visible after clicking on "show all". E.g. for addresses, a button can be configured that allows to open the routing module with a certain start address. Starting a search directly with an address zooms to the search result and places a mapMarker.
- Libraries:
    - Update from vue 2 to vue 3
    - Time library moment.js has been replaced with day.js.
- Script to migrate masterportal configuration files to version 3.0.0 was added. The command `npm run migrateConfig` prompts for input and `npm run migrateConfig help` describes usage with parameters.
- The layer attribution is now displayed in an alert when a layer is activated for the first time.

### Added
- Added documentation file doc\jsdoc.md for jsdoc in vue-components and vuex-files.
- LayerPreview: Preview images can be generated and displayed for layer types WMS, WMTS and VectorTile. The layer preview was added to the layerTree.
- The following NPM packages are added:
    - dependencies:
        - @panter/vue-i18next
        - dayjs
    - devDependencies:
        - @vue/compiler-sfc
        - cross-env
        - jsdoc
        - jsdoc-vuejs
        - shelljs
        - sinon-chai
- A new module `about` has been implemented, which can be used to show detailed information about a portal.
- A new module `baseLayerSwitcher` allows to select base layers by preview images from a configurable base layer set.
- Different modules were refactored from masterportal dev: `draw`, `filter`, `legend`, `search`, `wmsTime`, `wfst`
- The new control `tiltView` adds two controls that allow you to tilt the 3d map up or down
- The layer tree can be filtered by categories e. g. `opendata`.
- 3D print support has been added.
- 3D tile highlighting was refactored from masterportal dev.
- Possibility to use urlParams including searching within searchInterfaces.
- Printing functions for vector styling and legend has been added.
- New draw module (still in development) has been added to the code structure parallel to the refactored draw within the module folder.
- Adds `displayOnEvent` functionality for the Alerting module.

### Changed
- The following NPM packages have been updated:
    - dependencies:
        - @masterportal/masterportalapi: 2.14.0 to 2.28.0
        - @vue/compat: 3.2.45 to 3.2.47
        - axios: 1.2.2 to 1.3.4
        - charts.js: 4.1.1 to 4.2.1
        - i18next: 22.4.8 to 22.4.11
        - i18next-http-backend: 2.1.1 to 2.2.0
        - moment-timezone: 0.5.40 to 0.5.41
        - vue: 3.2.45 to 3.2.47
        - vue-multiselect: 2.1.6 to 3.0.0-beta.1
    - devDependencies:
        - @vue/devtools-api: 6.4.5 to 6.5.0
        - @vue/test-utils: 2.2.7 to 2.3.1
        - esbuild-loader: 2.20.0 to 3.0.1
        - eslint: 8.31.0 to 8.36.0
        - eslint-plugin-vue: 9.8.0 to 9.9.0
        - eslint-plugin-vuejs-accessibility: 2.0.0 to 2.2.0
        - sass: 1.57.1 to 1.59.3
        - sinon: 15.0.1 to 15.0.2
- Support for node 18.16.0 and npm 9.5.1
- UI: SDP-Download UI was updated
- Different terms for baselayer (basemap, backgroundlayer, basemap, hintergrundkarte) have been unified to baselayer
- Searchbar: custom actions can be configured as buttons at each search result in list of all search results.
- Changes in routing-components in order to improve accessibility.
- The layer pills are now animated, work with the menu and only show the arrow buttons when useful.
- Proxy function handling has been centralized.

### Removed
- The url parameter `TOOLS/[tool-id]` was removed. The `MENU` parameter can be used instead.
- The following NPM packages are removed:
    - dependencies
        - @vue/compiler-sfc
        - rbush
        - rbush-knn
        - vcs-oblique
        - vue-template-compiler
        - vue2-datepicker
        - @vue/compat
    - devDependencies:
        - raf
        - string-replace-loader
        - sinon-chai
        - webpack-visualizer-plugin
- The loader start screen has been removed.
- The layerAttribution control no longer exists. Instead, when a layer that has a layerAttribution is turned on, it is displayed as an alert.
- Several warnings have been removed from alerting as they are unnecessary.
- LayerAttribution is shown only once when the layer has been selected.
- The control `overViewMap` has been removed.
- `styleWMS` is no longer supported.

### Fixed
- Issue #1072: Fixed a problem when launching the portal with addons in version 3.0.0.
- 3D layer tree folder issues have been fixed. Vectortile layer appearing again.
- SpecialWFS search: Bugs related to MultiPolygon and Point handling, result handling, getWKTGeom have been resolved.
- Controls can be shown now on mobile mode.
- Errors in `selectFeatures` have been fixed.
- Printing Bugs with area and line measurements have been fixed in `measure` module.
- Design Bugs of the GFI window have been fixed e.g. the display of arrows.
- Different mobil bugs within `coordToolkit` have been fixed.
- Errors within the menu navigation in combination with different modules have been removed.
- UI: different Issues have been resolved and the design has been generalized.
- Legend display for WFS layer has been fixed.

---

## 2023-03-01 v3.0.0 - alpha1
### Added
- The following NPM packages are added:
    - devDependencies:
        - @babel/plugin-transform-modules-commonjs
        - @vue/devtools-api
        - @vue/compiler-sfc
        - i18next-vue
- A new module `OpenConfig` has been implemented, which can be used to load a new configuration file (config.json) at runtime.
- A new module `News` has been implemented, it displays the recent alerts.
- A new module in menu `CustomMenuElement` has been implemented. It can open a link, display html from config.json or from external file or dispatch an action.
- Modules can now have an attribute `hasMouseMapInteractions`. Only one module that has this attribute set to `true` can be open at the same time.

### Changed
- Parameters moved from config.js to config.json:
  - 'layerIDsToIgnore'
  - 'metaIDsToMerge'
  - 'metaIDsToIgnore'
  - 'layerIDsToStyle'
- The Control-Bar Design

### Deprecated
- Print: The deprecated attribute `mapfishServiceId` has been removed. Use `printServiceId` instead.
- Contact: The deprecated attribute `serviceID` has been removed. Use `serviceId` instead.

### Removed
- The following NPM packages are removed:
    - dependencies
        - @panter/vue-i18next
        - backbone
        - backbone.radio
        - bootstrap-colorpicker
        - bootstrap-datepicker
        - bootstrap-toggle
        - jquery
        - jquery-ui
        - rbush
        - rbush-knn
        - vcs-oblique
        - vue-template-compiler
        - vue2-datepicker
    - devDependencies:
        - eslint-plugin-backbone
        - eslint-plugin-you-dont-need-lodash-underscore
        - jsdoc
        - sinon-chai
