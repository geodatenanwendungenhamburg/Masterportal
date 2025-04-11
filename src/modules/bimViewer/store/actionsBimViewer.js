import {
    DistanceMeasurementsMouseControl,
    DistanceMeasurementsPlugin,
    NavCubePlugin,
    Viewer,
    WebIFCLoaderPlugin,
    AnnotationsPlugin,
    LocaleService
} from "@xeokit/xeokit-sdk";
import * as WebIFC from "web-ifc/web-ifc-api.js";
import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import proj4 from "proj4";

const actions = {
    /**
     * Load scene configs from server. Contains multiple scenes each with models, camera settings, sao settings, etc.
     * The sceneConfigsUrl is configured in the portal's config.json
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async loadSceneConfigs ({commit, getters}) {
        return axios
            .get(buildEndpointUrl(getters.sceneConfigsUrl))
            .then(response => commit("setSceneConfigs", response.data));
    },
    /**
     * Set the scene. Initialize the viewer, scene settings, load models, add plugins.
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {viewerCanvas, cubeCanvas, sceneConfig}
     * @returns {void}
     */
    setScene ({commit, dispatch, getters}, payload) {
        // If an instance exists already, clean up first.
        if (
            getters.xeokitIfcViewer &&
            getters.xeokitIfcViewer instanceof Viewer
        ) {
            // Reset tool "Object info" before you destroy the viewer
            dispatch("Modules/BimViewer/ToolObjectInfo/reset", {}, {root: true});

            // Destroy Viewer
            getters.xeokitIfcViewer.destroy();

            // Reset all loaded IFC model instances
            dispatch("resetLoadedIfcModel");
        }
        // Initialize the Viewer
        const navCubeLabels = {
                "front": i18next.t("modules.bimViewer.NavCube.front"),
                "back": i18next.t("modules.bimViewer.NavCube.back"),
                "top": i18next.t("modules.bimViewer.NavCube.top"),
                "bottom": i18next.t("modules.bimViewer.NavCube.bottom"),
                "left": i18next.t("modules.bimViewer.NavCube.left"),
                "right": i18next.t("modules.bimViewer.NavCube.right")
            },
            ifcViewer = new Viewer({
                canvasElement: payload.domElements.viewerCanvas,
                transparent: true,
                localeService: new LocaleService({
                    messages: ["de", "en"].reduce((acc, lang) => {
                        acc[lang] = {NavCube: {...navCubeLabels}};
                        return acc;
                    }, {}),
                    locale: "de"
                })
            }),
            IfcAPI = new WebIFC.IfcAPI(),
            queryString = window.location.search,
            urlParams = new URLSearchParams(queryString);

        // Set Wasm (WebAssembly) path. These bytecode files are loaded via HTTP.
        IfcAPI.SetWasmPath(getters.wasmUrl, true);

        commit("setXeokitIfcAPI", IfcAPI);
        commit("setXeokitIfcViewer", ifcViewer);
        commit("setSceneConfigSelected", payload.sceneConfig);

        dispatch("Modules/BimViewer/ToolSao/setSaoSettings", payload.sceneConfig.saoSettings, {root: true});

        // Arrange the camera
        if (payload.sceneConfig.cameraSettings) {
            ifcViewer.scene.camera.eye = payload.sceneConfig.cameraSettings.eye;
            ifcViewer.scene.camera.look = payload.sceneConfig.cameraSettings.look;
            ifcViewer.scene.camera.up = payload.sceneConfig.cameraSettings.up;
        }
        else {
            // [x,y,z]
            // eye =  position of the camera from the center of the secne's coordinate system
            ifcViewer.scene.camera.eye = [0, 0, 2];
            // look = point in the scene to which the camera points (depending on the eye position)
            ifcViewer.scene.camera.look = [0, 1, 1];
            // up = a camera's up vector defines which direction is considered "up" for the camera
            // If [0,1,0] is set, it means y is up
            ifcViewer.scene.camera.up = [0, 1, 0];
        }

        // Load the models
        // eslint-disable-next-line
        const ifcModels = [];
        let ifcModelPosition = 0;

        commit("setCurrentlyLoadedModels", 0);
        commit("setTotalNumberOfModels", 0);

        IfcAPI.Init().then(() => {
            const ifcLoader = new WebIFCLoaderPlugin(ifcViewer, {
                WebIFC,
                IfcAPI
            });

            commit("setXeokitIfcLoader", ifcLoader);
            commit("setTotalNumberOfModels", payload.sceneConfig.ifcModelList.length);

            payload.sceneConfig.ifcModelList.forEach((url) => {
                // Load models invisible to avoid jumps. After loading the last model, all models are set visible.
                dispatch("loadIfcModel", {
                    url: url,
                    visible: false
                }).then((ifcModel) => {
                    ifcModels.push(ifcModel);

                    ifcModel.on("loaded", () => {
                        ifcModelPosition++;

                        commit("setCurrentlyLoadedModels", ifcModelPosition);

                        // When the last model has been loaded, update the camera and make the models visible.
                        if (payload.sceneConfig.ifcModelList.length === ifcModelPosition) {
                            const
                                annotationCoordinates = urlParams.get("annoCoords"),
                                cameraEye = urlParams.get("cameraEye"),
                                cameraLook = urlParams.get("cameraLook"),
                                cameraUp = urlParams.get("cameraUp"),
                                projection = urlParams.get("annoProj"),
                                showPointer = urlParams.get("showPointer");


                            if (!payload.sceneConfig.cameraSettings) {
                                // [x,y,z]
                                // eye =  position of the camera from the center of the secne's coordinate system
                                ifcViewer.scene.camera.eye = [0, 2, 2];
                                // look = point in the scene to which the camera points (depending on the eye position)
                                ifcViewer.scene.camera.look = [0, 1, 1];
                                // up = a camera's up vector defines which direction is considered "up" for the camera
                                // If [0,1,0] is set, it means y is up
                                ifcViewer.scene.camera.up = [0, 1, 0];

                                dispatch("Modules/BimViewer/ToolSceneFit/fit", null, {root: true});
                            }
                            else {
                                ifcViewer.cameraFlight.jumpTo({
                                    eye: payload.sceneConfig.cameraSettings.eye,
                                    look: payload.sceneConfig.cameraSettings.look,
                                    up: payload.sceneConfig.cameraSettings.up
                                });
                            }

                            ifcModels.forEach((model) => {
                                model.visible = true;
                            });

                            if (annotationCoordinates) {
                                const zoomToPayload = {
                                    annoCoords: annotationCoordinates.split(",").map(Number),
                                    cameraEye: cameraEye.split(",").map(Number),
                                    cameraLook: cameraLook.split(",").map(Number),
                                    cameraUp: cameraUp.split(",").map(Number),
                                    projection: projection,
                                    showPointer: showPointer,
                                    bimViewer: payload.domElements.bimViewer
                                };

                                dispatch("zoomToObject", zoomToPayload);
                            }
                        }
                    });
                });
            });
        });

        // Add plugins

        // Add annotations plugin

        // Clear any refresh interval set by a previously loaded scene
        if (getters.annotationRefreshIntervalID) {
            clearInterval(getters.annotationRefreshIntervalID);
        }

        if (payload.sceneConfig.annotationsJSON?.length > 0) {
            dispatch("addPluginAnnotations", {
                sceneAnnotations: payload.sceneConfig.annotationsJSON,
                bimViewer: payload.domElements.bimViewer
            });

            if (typeof getters.annotationRefreshInterval === "number") {

                const annotationRefreshIntervalID = setInterval(() => {
                    dispatch("addPluginAnnotations", {
                        sceneAnnotations: payload.sceneConfig.annotationsJSON,
                        bimViewer: payload.domElements.bimViewer
                    });
                }, getters.annotationRefreshInterval);

                commit("setAnnotationRefreshIntervalID", annotationRefreshIntervalID);
            }
        }

        // Add nav cube plugin
        dispatch("addPluginNavCube", {
            canvasElement: payload.domElements.cubeCanvas
        });

        // Add distance measurements plugin
        dispatch("addPluginDistanceMeasurements");

        // Close the right side bar
        commit("Modules/BimViewer/setToggleRightSidebar", false, {root: true});
    },
    /**
     * Add nav cube plugin (NavCubePlugin)
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {canvasElement, ifcViewer}
     * @returns {void}
     */
    addPluginNavCube ({commit, getters}, payload) {
        const xeokitPluginNavCube = new NavCubePlugin(getters.xeokitIfcViewer, {
            canvasElement: payload.canvasElement,
            visible: true, // Initially visible (default)
            cameraFly: true, // Fly camera to each selected axis/diagonal
            cameraFitFOV: 45, // How much field-of-view the scene takes once camera has fitted it to view
            cameraFlyDuration: 0.5, // How long (in seconds) camera takes to fly to each new axis/diagonal
            fitVisible: false, // Fit whole scene, including invisible objects (default)
            synchProjection: false, // Keep NavCube in perspective projection, even when camera switches to ortho
            frontColor: "rgb(200,200,200)",
            backColor: "rgb(200,200,200)",
            leftColor: "rgb(200,200,200)",
            rightColor: "rgb(200,200,200)",
            topColor: "rgb(200,200,200)",
            bottomColor: "rgb(200,200,200)"
        });

        commit("setXeokitPluginNavCube", xeokitPluginNavCube);
    },
    /**
     * Add distance measurements plugin (DistanceMeasurementsPlugin)
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    addPluginDistanceMeasurements ({commit, getters}) {
        const
            distanceMeasurements = new DistanceMeasurementsPlugin(getters.xeokitIfcViewer, {
                defaultXLabelEnabled: false,
                defaultXAxisVisible: false,
                defaultYLabelEnabled: false,
                defaultYAxisVisible: false,
                defaultZLabelEnabled: false,
                defaultZAxisVisible: false

            }),
            distanceMeasurementsControl = new DistanceMeasurementsMouseControl(distanceMeasurements);

        commit("setXeokitPluginDistanceMeasurements", distanceMeasurements);
        commit("setXeokitPluginDistanceMeasurementsControl", distanceMeasurementsControl);
    },
    /**
     * Add annotations plugin to load scene annotations from server.
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {sceneAnnotations, bimViewer}
     * @returns {void}
     */
    async addPluginAnnotations ({rootGetters, getters, commit}, payload) {
        // for DIPAS URL parameters need to be added to the json containing the annotations
        const urlParams = new URLSearchParams(window.location.search),
            urlParamsObject = {};

        urlParams.forEach((param, key) => {
            urlParamsObject[key] = param;
        });

        return axios
            .get(buildEndpointUrl(payload.sceneAnnotations, urlParamsObject))
            .then(response => {

                if (getters.xeokitPluginAnnotations) {
                    getters.xeokitPluginAnnotations.clear();
                }

                const
                    isDipas = urlParams.get("dipas") === "true" ?? false,
                    labelHTML = isDipas
                        ? `
                            <div
                                class="xeokit-annotation-label"
                            >
                                <a
                                    class="xeokit-annotation-title"
                                    href="{{link}}"
                                    target="_top"
                                >
                                    <div
                                        class="xeokit-annotation-point"
                                        style="background-color: {{markerBGColor}};"
                                    ></div>

                                    <span>
                                        {{title}}
                                    </span>
                                </a>

                                <div
                                    class="xeokit-annotation-desc"
                                >
                                    {{description}}
                                </div>

                                <a
                                    href="{{link}}"
                                    class="btn xeokit-annotation-more-link"
                                    style="background-color: {{buttonBackgroundColor}}; color: {{buttonTextColor}};"
                                    target="_top"
                                >
                                    ${i18next.t("modules.bimViewer.annotationMoreLink")}
                                </a>
                            </div>
                        `
                        : `
                            <div class="xeokit-annotation-label">
                                <div
                                    class="xeokit-annotation-title"
                                >
                                    {{title}}
                                </div>

                                <div
                                    class="xeokit-annotation-desc"
                                >
                                    {{description}}
                                </div>
                            </div>
                        `,
                    annotationData = response.data,
                    // define AnnotationsPlugin to set a marker at the pickResult position
                    annotations = new AnnotationsPlugin(getters.xeokitIfcViewer, {
                        markerHTML: `
                            <div class="xeokit-annotation-markers" style="background-color: {{markerBGColor}};"></div>
                        `,
                        labelHTML: labelHTML,
                        container: payload.bimViewer
                    });

                annotationData.features?.forEach(feature => {
                    const
                        values = {
                            link: isDipas
                                ? `${document.referrer.split("?")[0].split("#")[0]}#/contribution/${feature.properties.nid}`
                                : "",
                            buttonBackgroundColor: feature.properties.ButtonBackgroundColor ?? "#003063",
                            buttonTextColor: feature.properties.ButtonTextColor ?? "#FFFFFF",
                            title: feature.properties.name,
                            description: feature.properties.description,
                            markerBGColor: feature.properties.CategoryColor ?? "#FF0000"
                        },
                        heightValue = feature.geometry.coordinates[2] ?? 0;

                    let worldPos = [
                        feature.geometry.coordinates[0],
                        heightValue,
                        -feature.geometry.coordinates[1]
                    ];

                    // Reproject annotation coordinates from EPSG 4326 into the projection used by the Masterportal
                    // assuming this is the same the projection as the one used in the bimViewer
                    if (!annotationData.crs && annotationData.crs?.properties?.name !== "EPSG:4326") {
                        const projectedCoords = proj4(
                            "EPSG:4326",
                            rootGetters["Maps/projectionCode"],
                            [
                                feature.geometry.coordinates[0],
                                feature.geometry.coordinates[1]
                            ]
                        );

                        worldPos = [
                            projectedCoords[0],
                            heightValue,
                            projectedCoords[1] * -1
                        ];
                    }

                    annotations.createAnnotation({
                        id: feature.id,
                        worldPos: worldPos,
                        occludable: false,
                        markerShown: true,
                        labelShown: false,
                        values: values
                    });
                });

                // shows or hides the annotation when clicked on the marker
                annotations.on("markerClicked", (annotation) => {
                    const activeLabel = getters.xeokitPluginAnnotationLabelActive,
                        input = getters.xeokitIfcViewer.scene.input;

                    // hide any previously opened label
                    if (activeLabel && activeLabel !== annotation) {
                        activeLabel.setLabelShown(!activeLabel.getLabelShown());
                    }

                    annotation.setLabelShown(!annotation.getLabelShown());

                    if (activeLabel && activeLabel === annotation) {
                        commit("setXeokitPluginAnnotationLabelActive", null);
                    }
                    else {
                        commit("setXeokitPluginAnnotationLabelActive", annotation);
                    }

                    // close the annotation label popup on click in the scene
                    input.on("mouseclicked", () => {
                        annotation.setLabelShown(false);
                        commit("setXeokitPluginAnnotationLabelActive", null);
                    });
                });

                commit("setXeokitPluginAnnotations", annotations);
            });
    },
    /**
     * Pushes an IFC model to the loaded model array
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {ifcModel}
     * @returns {void}
     */
    pushLoadedIfcModel ({commit}, payload) {
        commit("pushLoadedIfcModel", payload.ifcModel);
    },
    /**
     * Reset the loaded IFC model array
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    resetLoadedIfcModel ({commit}) {
        commit("setLoadedIfcModels", []);
    },
    /**
     * Load an IFC model
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {url, visible}
     * @returns {Object} VBOSceneModel instance
     */
    loadIfcModel ({dispatch, getters}, payload) {
        return new Promise((resolve) => {
            const ifcModel = getters.xeokitIfcLoader.load({
                id: payload.url.split("/").reverse()[0],
                src: payload.url,
                excludeTypes: ["IfcSpace"],
                edges: true,
                visible: payload.visible
            });

            dispatch("pushLoadedIfcModel", {
                ifcModel: ifcModel
            });

            resolve(ifcModel);
        });
    },
    /**
     * Zoom to object with given annotation coordinates and camera parameters
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {projection, annoCoords, cameraEye, cameraLook, cameraUp, showPointer, bimViewer}
     * @returns {void}
     */
    zoomToObject ({rootGetters, getters, commit}, payload) {
        let projectedCoords = null;

        if (payload.projection === "EPSG:4326") {
            projectedCoords = proj4(
                "EPSG:4326",
                rootGetters["Maps/projectionCode"],
                [payload.annoCoords[0], payload.annoCoords[1]]
            );
        }

        const heightValue = payload.annoCoords[2] ?? 0,
            canvasPos = projectedCoords
                ? getters.xeokitIfcViewer.camera.projectWorldPos([projectedCoords[0], heightValue, projectedCoords[1] * -1])
                : getters.xeokitIfcViewer.camera.projectWorldPos([
                    payload.annoCoords[0],
                    heightValue,
                    payload.annoCoords[1] < 0 ? payload.annoCoords[1] : payload.annoCoords[1] * -1
                ]),
            pickResult = getters.xeokitIfcViewer.scene.pick({
                canvasPos: canvasPos
            });

        getters.xeokitIfcViewer.scene.camera.eye = payload.cameraEye;
        getters.xeokitIfcViewer.scene.camera.look = payload.cameraLook;
        getters.xeokitIfcViewer.scene.camera.up = payload.cameraUp;

        if (payload.showPointer === "1" || payload.showPointer === "true") {
            const annotations = new AnnotationsPlugin(getters.xeokitIfcViewer, {
                markerHTML: `
                    <div class="xeokit-annotation-markers"></div>
                `,
                container: payload.bimViewer
            });

            annotations.createAnnotation({
                id: "setPosition",
                worldPos: projectedCoords
                    ? [projectedCoords[0], heightValue, projectedCoords[1] * -1]
                    : payload.annoCoords,
                occludable: false,
                markerShown: true
            });

            commit("setPositionPointer", annotations);
        }

        getters.xeokitIfcViewer.cameraFlight.jumpTo({
            aabb: pickResult.entity._aabb
        });
    },
    /* Get the metaobjects for a given objectID
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {objectId}
     * @returns {void}
     */
    getObjectDataForId ({getters}, payload) {
        return getters.xeokitIfcViewer.metaScene.metaObjects[payload.objectId];
    }
};

export default actions;
