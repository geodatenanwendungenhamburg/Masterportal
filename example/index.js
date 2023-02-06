import "ol/ol.css";

import {Style, Stroke, Fill, Icon} from "ol/style.js";

import * as mpapi from "../src";
import mapsAPI from "../src/maps/api.js";
import rawLayerList from "../src/rawLayerList";
import {initializeStyleList, returnStyleObject} from "../src/vectorStyle/styleList";
import {createStyle} from "../src/vectorStyle/createStyle";

import services from "./config/services.json";
import portalConfig from "./config/portal.json";
import localGeoJSON from "./config/localGeoJSON.js";
import load3DScriptModule from "../src/lib/load3DScript";

function errorCallback (errorEvent) {
    console.error("This is an error event:", errorEvent);
}

//* Add elements to window to play with API in console
window.mpapi = {
    ...mpapi,
    map2D: null,
    map: null
};
//* Fake service that holds client-side prepared geojson; also nice to test automatic transformation since data is in WGS 84
// eslint-disable-next-line no-unused-vars
const hamburgServicesUrl = "https://geodienste.hamburg.de/services-internet.json",
    localService = {
        id: "2002",
        typ: "GeoJSON",
        features: localGeoJSON
    },
    config = {
        ...portalConfig,
        layerConf: services,
        styleConf: "https://geodienste.hamburg.de/lgv-config/style_v3.json"
    },
    // eslint-disable-next-line func-style
    getWfsStyleFunction = function () {
        const styleId = "8712",
            olLayer = window.mpapi.map.getLayers().getArray().find((element) => element.get("id") === "8712"),
            source = olLayer.getSource(),
            styleObject = returnStyleObject(styleId);
        let isClusterFeature = false;

        if (styleObject !== undefined) {
            source.on("featuresloadend", event => {
                event.features.forEach(element => {
                    isClusterFeature = false;
                    element.setStyle(createStyle(styleObject, element, isClusterFeature, config.wfsImgPath));
                });
            });
        }
    };
let map2D = null;

// */
//* Cleans up map before it is re-rendered (happens on every save during dev mode)
document.getElementById(portalConfig.target).innerHTML = "";
// add a click-listener to button, that creates a 3D-map on click
document.getElementById("enable").addEventListener("click", function () {
    if (window.mpapi.map2D === null) {
        window.mpapi.map2D = window.mpapi.map;
    }

    if (window.mpapi.map.mapMode === "3D") {
        window.mpapi.map.setEnabled(false);
        window.mpapi.map = window.mpapi.map2D;
        window.mpapi.map.getView().setRotation(0);
        document.getElementById("layer-visibility").style.display = "none";
    }
    else {
        const lib = portalConfig.cesiumLib ? portalConfig.cesiumLib : "https://geoportal-hamburg.de/mastercode/cesium/1_99/index.js";

        document.getElementById("layer-visibility").style.display = "block";

        load3DScriptModule.load3DScript(lib, function Loaded3DCallback () {
            let tilesetLayer = null;

            const settings3D = {
                    map2D: window.mpapi.map2D,
                    // set some options to Cesium scene
                    cesiumParameter: {
                        fxaa: true,
                        globe: {
                            enableLighting: true,
                            maximumScreenSpaceError: 2,
                            tileCacheSize: 20
                        }
                    }
                },
                map3D = mapsAPI.map.createMap(settings3D, "3D"),
                rawLayerTerrain = rawLayerList.getLayerWhere({id: "4001"}),
                rawLayerTileset = rawLayerList.getLayerWhere({id: "4002"}),
                rawLayerEntities = rawLayerList.getLayerWhere({id: "4003"});

            window.mpapi.map = map3D;
            tilesetLayer = new mpapi.Tileset(rawLayerTileset, window.mpapi.map);
            tilesetLayer.setVisible(true, window.mpapi.map);

            // entities are 2 simple buildings in the park 'planten und blomen' near Tiergartenstraße
            mpapi.entities.createLayer(rawLayerEntities, window.mpapi.map);
            // mpapi.entities.setVisible(true, rawLayerEntities, window.mpapi.map);

            mpapi.terrain.createLayer(rawLayerTerrain, window.mpapi.map);
            mpapi.terrain.setVisible(true, rawLayerTerrain, window.mpapi.map);

            window.mpapi.map.setEnabled(true);
        });
    }
});

// add a click-listener to button, that hides background layer in 3d
document.getElementById("layer-visibility").addEventListener("click", function () {
    map2D.getLayers().forEach(layer => {
        map2D.removeLayer(layer);
    });
});

map2D = mapsAPI.map.createMap(config, "2D", {errorCallback});
services.push(localService);
// */

//* geojson styling function call to override default styling and special wfs styling
mpapi.geojson.setCustomStyles({
    MultiPolygon: new Style({
        stroke: new Stroke({
            width: 2,
            color: "#000000"
        }),
        fill: new Fill({
            color: "#FFFFFF55"
        })
    })
});

// eslint-disable-next-line
const styleWfs = function (feature, resolution) {
    const icon = new Style({
        image: new Icon({
            crossOrigin: "anonymous",
            src: "https://img.icons8.com/windows/50/000000/building.png",
            scale: 0.5,
            opacity: 1
        })
    });

    return [icon];
};

services.find(({id}) => id === "3001").style = styleWfs;
// */


// eslint-disable-next-line
const styleOaf = function (feature, resolution) {
    const icon = new Style({
        image: new Icon({
            crossOrigin: "anonymous",
            src: "https://geodienste.hamburg.de/lgv-config/img/gymnasien.svg",
            scale: 0.5,
            opacity: 1
        })
    });

    return [icon];
};

services.find(({id}) => id === "5001").style = styleOaf;

//* SYNCHRONOUS EXAMPLE: layerConf is known
window.mpapi.map = map2D;

["2001", "2002", "1002", "3001", "5001"].forEach(id => window.mpapi.map.addLayer(id, {errorCallback}));

// ping all layers
services
    .map(service => ({
        ping: mpapi.ping(service),
        service
    }))
    .forEach(({ping, service}) => ping
        // eslint-disable-next-line no-console
        .then(statusCode => console.log(`Service ${service.id} pinged; returned ${statusCode}.`))
        .catch(console.error));

// */

/* ASYNCHRONOUS EXAMPLE 1: work with layerConf callback
document.getElementById("enable").style.display = "none";
mpapi.rawLayerList.initializeLayerList(hamburgServicesUrl,
    conf => {
        window.mpapi.map = mapsAPI.map.createMap({
            ...portalConfig,
            layerConf: conf,
            layers: null
        }, "2D");
        ["6357", "6074"].forEach(id => window.mpapi.map.addLayer(id));
    });
//*/

/* ASYNCHRONOUS EXAMPLE 2: work with createMap callback
document.getElementById("enable").style.display = "none";
window.mpapi.map = mapsAPI.map.createMap({
    ...portalConfig, layerConf: hamburgServicesUrl, layers: [
        {id: "6357"},
        {id: "453", transparency: 50}
    ]}, "2D",
{
    callback: () => ["6074"].forEach(id => window.mpapi.map.addLayer(id))
});
//*/

/* SEARCH FUNCTION EXAMPLE
// You may e.g. copy this code to the browser's console to run a search.

window.mpapi.search("Eiffe", {
    map: window.mpapi.map,
    zoom: true,
    zoomToParams: {duration: 1000, maxZoom: 8},
    searchStreets: true
}).then(x => console.log(x)).catch(e => console.error(e));

window.mpapi.search("Mümmelmannsberg 72", {
    map: window.mpapi.map,
    zoom: true,
    zoomToParams: {duration: 1000, maxZoom: 8},
    searchAddress: true
}).then(x => console.log(x)).catch(e => console.error(e));

//*/

/* VECTOR TILE EXAMPLE */
/*
document.getElementById("enable").style.display = "none";
map2D.getLayers().forEach(layer => {
    map2D.removeLayer(layer);
});

const vtStyleUrl = "https://dev.adv-smart.de/styles/playground/masterportal_test1.json";

fetch(vtStyleUrl)
    .then(response => response.json())
    .then(style => {
        const vtLayer = window.mpapi.map.addLayer("6001");

        mpapi.vectorTile.setStyle(vtLayer, style);
    });
//*/

/* WMTS example */
/*
map2D.getLayers().forEach(layer => {
    map2D.removeLayer(layer);
});
window.mpapi.map.addLayer("7001");
window.mpapi.map.addLayer("7002");
window.mpapi.map.addLayer("7003");
*/

/* VectorStyle example */
// Example for using the vectorStyle that is now implemented in the masterportalAPI.
// Hardcoded to show the school layer "8712" as a wfs.
// For better visibility adding of the other layers, especially "5001", should be commented out.
initializeStyleList({}, config, config.layers, undefined, (styleList, error) => {
    if (error) {
        console.error("Die Datei " + config.styleConf + " konnte nicht geladen werden!");
    }
    return styleList;
});
getWfsStyleFunction();
