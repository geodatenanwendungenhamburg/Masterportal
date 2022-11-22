# masterportalapi

The masterportalAPI is an API to include and show map-content on your webpage. It's based on OpenLayers and extended with functions to easily use configuration and infrastructure files from the masterportal, a feature-rich mapping app developed by geowerkstatt hamburg. It also provides the creation of a 3d map by using olcs and cesium. Check masterportal.org for further information.

## Usage

Install the masterportalAPI in your project with ``npm install masterportalapi``. The project does not have a default export, but various named exports. Generate and check the documentation as described below for details.

If you want to create a 3d map, you have to provide the peer dependency cesium.

By importing the project by module name like ``import ... from "masterportalAPI"``, most bundlers and bundler configurations will include the whole masterportalAPI. If you only need a subset of the provided functions and want to keep your build clean, directly import the needed functions like ``import {createMap} from "masterportalAPI/src/map.js``.

## Error Handling

1. Error event callback: The methods `createMap` and `addLayer` both optionally accept error event callbacks that are called with OpenLayers error events (tileloaderror, imageloaderror, featuresloaderror, error).
2. Ping: A method that returns a Promise. This resolves to the status code of the layer's GetCapabilities request, which can be used to decide if the service is reachable and usable at all.

Both methods may be required for useful user feedback. For example, a WMS may answer a tile request with 404 if no tile is available for a region, but may be fully available within its specification. This may throw an error while the service itself is available as specified. It is up to the using implementation how to react, how often to ping, and so on.

## Scripts

|Script|Effect|
|-|-|
|``npm run example``|Starts a dev server with a running example. Please mind that the page seen is _not_ part of the masterportalAPI, but merely an environment for manual testing. Change code within ``./example/index.js`` to try things. Free hot reloading thanks to parcel.|
|``npm run generate-jsdoc``|Generates the project documentation within the folder ``./docs``.|
|``npm test``|Runs all tests. Prints code coverage to console.|
|``npm run test:watch``|Runs all tests in watch mode. Good practive to let this run during development in a separate terminal. |

## About Babel

The Babel dev dependencies are purely added for development tests and jest tests. Babel is required for testing since Node does not support ES6 in .js files so far.
