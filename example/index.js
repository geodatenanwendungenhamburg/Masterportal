import "ol/ol.css";

import {Style, Stroke, Fill, Icon} from "ol/style.js";

import * as mpapi from "../src";
import abstractAPI from "../abstraction/api.js";
import {getLayerWhere} from "../src/rawLayerList";

import services from "./config/services.json";
import portalConfig from "./config/portal.json";
import localGeoJSON from "./config/localGeoJSON.js";
import {load3DScript} from "../src/lib/load3DScript";
import {getLayerWhere} from "../src/rawLayerList";

//* Add elements to window to play with API in console
window.mpapi = {
    ...mpapi,
    map2D: null,
    map: null
};
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
        document.getElementById("layer-visibility").style.display = "none";
        ["1001", "2001", "2002", "1002", "3001"].forEach(id => window.mpapi.map.addLayer(id));
    }
    else {
        const lib = portalConfig.cesiumLib ? portalConfig.cesiumLib : "https://geoportal-hamburg.de/mastercode/cesium/1_88/Cesium.js";

        document.getElementById("layer-visibility").style.display = "block";

        load3DScript(lib, function Loaded3DCallback () {
            let terrainLayer = null, tilesetLayer, rawLayerTileset;
            const toRemove = ["2001", "2002", "1002", "3001"];         

            layers2D.forEach(layer => {
                const layerId = layer?.id || layer?.values_?.id;
                if(toRemove.find(id => id === layerId)){
                    map2D.removeLayer(layer);
                }               
            });

            const settings3D = {
                    "map2D": window.mpapi.map2D
                },
                map3D = abstractAPI.map.createMap(settings3D, "3D"),
                rawLayerTerrain = getLayerWhere({id: "4001"}),
                rawLayerTileset = getLayerWhere({id: "4002"}),
                scene = map3D.getCesiumScene();
            
             //set some options to Cesium scene
             scene.globe.enableLighting = true;
             scene.globe.tileCacheSize = 20;
             scene.globe.maximumScreenSpaceError =2;
             scene.fxaa = true;
             scene.highDynamicRange = false;
             scene.pickTranslucentDepth = true;

            window.mpapi.map = map3D;
            tilesetLayer = new mpapi.Tileset(rawLayerTileset, window.mpapi.map);
            tilesetLayer.setVisible(true, window.mpapi.map);

            window.mpapi.map.setEnabled(true);

            terrainLayer = mpapi.terrain.createLayer(rawLayerTerrain, window.mpapi.map);           
            terrainLayer.setVisible(true, rawLayerTerrain, window.mpapi.map);

        });
    }
});

// add a click-listener to button, that hides background layer in 3d
document.getElementById("layer-visibility").addEventListener("click", function () {
    map2D.getLayers().forEach(layer => {
        map2D.removeLayer(layer);
    });
});

//* Fake service that holds client-side prepared geojson; also nice to test automatic transformation since data is in WGS 84
// eslint-disable-next-line no-unused-vars
const hamburgServicesUrl = "http://geoportal-hamburg.de/lgv-config/services-internet.json",
    localService = {
        id: "2002",
        typ: "GeoJSON",
        features: localGeoJSON
    },
    config = {
        ...portalConfig,
        layerConf: services
    },
    map2D = abstractAPI.map.createMap(config, "2D"),
    layers2D = [];

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
            src: "https://img.icons8.com/windows/50/000000/building.png",
            scale: 0.5,
            opacity: 1
        })
    });

    return [icon];
};

services.find(({id}) => id === "3001").style = styleWfs;
// */

//* SYNCHRONOUS EXAMPLE: layerConf is known
window.mpapi.map = map2D;

["2001", "2002", "1002", "3001"].forEach(id => window.mpapi.map.addLayer(id));
map2D.getLayers().forEach(layer => {
    layers2D.push(layer);       
});

map2D.getLayers().forEach(layer => {
    layers2D.push(layer);       
});

// */

/* ASYNCHRONOUS EXAMPLE 1: work with layerConf callback
document.getElementById("enable").style.display = "none";
mpapi.rawLayerList.initializeLayerList(
    hamburgServicesUrl,
    conf => {
        window.mpapi.map = abstractAPI.map.createMap({
            ...portalConfig,
            layerConf: conf,
            layers: null
        }, "2D");
        ["6357", "6074"].forEach(
            id => window.mpapi.map.addLayer(id)
        );
    }
);
//*/

/* ASYNCHRONOUS EXAMPLE 2: work with createMap callback
document.getElementById("enable").style.display = "none";
window.mpapi.map = abstractAPI.map.createMap(
    {...portalConfig, layerConf: hamburgServicesUrl, layers: [
        { id: "6357" },
        { id: "453", transparency: 50 }
    ]}, "2D",
    {
        callback: () =>
            ["6074"].forEach(
                id => window.mpapi.map.addLayer(id)
            )
    }
);
//*/

/* SEARCH FUNCTION EXAMPLE
// You may e.g. copy this code to the browser's console to run a search.

window.mpapi.search("Eiffe",  {
    map: window.mpapi.map,
    zoom: true,
    zoomToParams: {duration: 1000, maxZoom: 8},
    searchStreets: true
}).then(x => console.log(x)).catch(e => console.error(e))

window.mpapi.search("Mümmelmannsberg 72",  {
    map: window.mpapi.map,
    zoom: true,
    zoomToParams: {duration: 1000, maxZoom: 8},
    searchAddress: true
}).then(x => console.log(x)).catch(e => console.error(e))

//*/
