import OLCesium from "olcs/OLCesium.js";
import VectorSynchronizer from "olcs/VectorSynchronizer.js";
import FixedOverlaySynchronizer from "./3dUtils/fixedOverlaySynchronizer.js";
import WMSRasterSynchronizer from "./3dUtils/wmsRasterSynchronizer.js";
import {transform, get} from "ol/proj.js";

let mapIdCounter = 0;

/**
 * Sets the cesium scene defaults from the config.js
 * @param {Cesium.scene} scene Cesium scene.
 * @param {Object} config optional configuration parameters.
 * @returns {void}
 */
function setCesiumSceneDefaults (scene, config) {
    let params;

    if (Object.prototype.hasOwnProperty.call(config, "cesiumParameter")) {
        params = config.cesiumParameter;
        if (params?.fog) {
            scene.fog.enabled = params.fog?.enabled ? params.fog.enabled : scene.fog.enabled;
            scene.fog.density = params.fog?.density ? parseFloat(params.fog.density) : scene.fog.density;
            scene.fog.screenSpaceErrorFactor = params.fog?.screenSpaceErrorFactor ? parseFloat(params.fog.screenSpaceErrorFactor) : scene.fog.screenSpaceErrorFactor;
        }

        scene.globe.tileCacheSize = params?.tileCacheSize ? parseInt(params.tileCacheSize, 10) : scene.globe.tileCacheSize;
        scene.globe.maximumScreenSpaceError = params?.maximumScreenSpaceError ? params.maximumScreenSpaceError : scene.globe.maximumScreenSpaceError;
        scene.shadowMap.maximumDistance = 5000.0;
        scene.shadowMap.darkness = 0.6;
        scene.shadowMap.size = 2048;
        scene.fxaa = params?.fxaa ? params.fxaa : scene.fxaa;
        scene.globe.enableLighting = params?.enableLighting ? params.enableLighting : scene.globe.enableLighting;
        scene.highDynamicRange = false;
        scene.pickTranslucentDepth = true;
        scene.camera.enableTerrainAdjustmentWhenLoading = true;
    }
}

/**
 * Sets the camera parameters either from config or from an trigger.
 * @param {Object} params Params.
 * @param {Object} map3D olcs map.
 * @param {Cesium} cesium cesium.
 * @returns {void}
 */
export function setCameraParameter (params, map3D, cesium) {
    let camera,
        destination,
        orientation;

    // if the cameraPosition is given, directly set the cesium camera position, otherwise use olcesium Camera
    if (map3D && params.cameraPosition) {
        camera = map3D.getCesiumScene().camera;
        destination = cesium.Cartesian3.fromDegrees(params.cameraPosition[0], params.cameraPosition[1], params.cameraPosition[2]);
        orientation = {
            heading: cesium.Math.toRadians(parseFloat(params.heading)),
            pitch: cesium.Math.toRadians(parseFloat(params.pitch)),
            roll: cesium.Math.toRadians(parseFloat(params.roll))
        };

        camera.setView({
            destination,
            orientation
        });
    }
    else if (map3D !== undefined && params !== null) {
        camera = map3D.getCamera();
        if (params?.tilt) {
            camera.setTilt(parseFloat(params.tilt));
        }
        if (params?.heading) {
            camera.setHeading(parseFloat(params.heading));
        }
        if (params?.altitude) {
            camera.setAltitude(parseFloat(params.altitude));
        }
    }
}

/**
 * Reacts to 3D click event in cesium scene.
 * @param {Event} event The cesium event.
 * @returns {Function} Returns the callbackfunction with click informations.
 */
function reactTo3DClickEvent (event) {
    const scene = this.scene,
        ray = scene.camera.getPickRay(event.position),
        cartesian = scene.globe.pick(ray, scene),
        mapProjection = this.map3D.getOlView().getProjection();
    let height,
        coords,
        cartographic,
        distance,
        resolution,
        transformedCoords,
        transformedPickedPosition,
        pickedPositionCartesian,
        cartographicPickedPosition,
        clickObject;

    if (cartesian) {
        if (document.querySelector(".nav li")?.classList.contains("open")) {
            document.querySelector(".nav li").classList.remove("open");
        }
        cartographic = scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        coords = [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
        height = scene.globe.getHeight(cartographic);
        if (height) {
            coords = coords.concat([height]);
        }

        distance = Cesium.Cartesian3.distance(cartesian, scene.camera.position);
        resolution = this.map3D.getCamera().calcResolutionForDistance(distance, cartographic.latitude);
        transformedCoords = transform(coords, get("EPSG:4326"), mapProjection);
        transformedPickedPosition = null;

        if (scene.pickPositionSupported) {
            pickedPositionCartesian = scene.pickPosition(event.position);
            if (pickedPositionCartesian) {
                cartographicPickedPosition = scene.globe.ellipsoid.cartesianToCartographic(pickedPositionCartesian);
                transformedPickedPosition = transform([Cesium.Math.toDegrees(cartographicPickedPosition.longitude), Cesium.Math.toDegrees(cartographicPickedPosition.latitude)], get("EPSG:4326"), mapProjection);
                transformedPickedPosition.push(cartographicPickedPosition.height);
            }
        }
        clickObject = {
            map3D: this,
            position: event.position,
            pickedPosition: transformedPickedPosition,
            coordinate: transformedCoords,
            latitude: coords[0],
            longitude: coords[1],
            resolution: resolution,
            originalEvent: event
        };
    }
    return this.callback(clickObject);
}

/**
 * Logic to listen to click events in 3D mode.
 * @param {Object} map3DObject Contains the scene, 3D map and a callback function.
 * @returns {void}
 */
function handle3DEvents (map3DObject) {
    let eventHandler;

    if (Cesium) {
        eventHandler = new Cesium.ScreenSpaceEventHandler(map3DObject.scene.canvas);
        eventHandler.setInputAction(reactTo3DClickEvent.bind(map3DObject), Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
}

/**
 * Creates a 3D-map.
 * @param {object} [settings] The settings for the 3D-map.
 * @param {module:ol/PluggableMap~PluggableMap} [settings.map2D] The 2D-Map
 * @param {Cesium.JulianDate} [settings.shadowTime] The shadow time in julian date format if undefined olcs default is Cesium.JulianDate.now().
 * @returns {module:OLCesium} the 3d-map
 */
export function createMap (settings) {
    const map3D = new OLCesium({
        map: settings.map2D,
        time: settings.shadowTime ? settings.shadowTime : undefined,
        sceneOptions: {
            shadows: false
        },
        stopOpenLayersEventsPropagation: true,
        createSynchronizers: (olMap, scene) => {
            return [new WMSRasterSynchronizer(olMap, scene), new VectorSynchronizer(olMap, scene), new FixedOverlaySynchronizer(olMap, scene)];
        }
    });

    map3D.id = `map3D_${mapIdCounter++}`;
    map3D.mapMode = "3D";

    return map3D;
}

/**
 * Prepares the camera and listens to camera changed events.
 * @param {Cesium.scene} scene Cesium scene.
 * @param {Object} urlParams optional urlParams for camera.
 * @param {Object} map3D olcs map.
 * @param {Object} config optional configuration parameters.
 * @param {Cesium} cesium optional cesium.
 * @returns {Cesium.scene.camera} Cesium camera.
 */
export function prepareCamera (scene, urlParams, map3D, config, cesium) {
    const camera = scene.camera;
    let cameraParameter = Object.prototype.hasOwnProperty.call(config, "cameraParameter") ? config.cameraParameter : {};

    cameraParameter = urlParams?.altitude ? Object.assign(cameraParameter || {}, {altitude: urlParams?.altitude}) : cameraParameter;
    cameraParameter = urlParams?.heading ? Object.assign(cameraParameter || {}, {heading: urlParams?.heading}) : cameraParameter;
    cameraParameter = urlParams?.tilt ? Object.assign(cameraParameter || {}, {tilt: urlParams?.tilt}) : cameraParameter;

    if (Object.keys(cameraParameter).length > 0) {
        setCameraParameter(cameraParameter, map3D, cesium);
    }
    return camera;
}

/**
 * Prepares the cesium scene.
 * @param {Object} map3DObject Contains the scene, 3D map and a callback function.
 * @param {Object} config optional configuration parameters.
 * @returns {void}
 */
export function prepareScene (map3DObject, config) {
    handle3DEvents(map3DObject);
    setCesiumSceneDefaults(map3DObject.scene, config);
}
