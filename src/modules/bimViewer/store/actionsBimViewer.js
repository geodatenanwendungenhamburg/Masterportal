import {
    WebIFCLoaderPlugin,
    GLTFLoaderPlugin,
    XKTLoaderPlugin,
    DistanceMeasurementsMouseControl,
    DistanceMeasurementsPlugin,
    NavCubePlugin,
    Viewer,
    AnnotationsPlugin,
    LocaleService,
    TreeViewPlugin
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
     * @param {Object} payload Passed parameters {viewerCanvas, cubeCanvas, treeViewContainerElement, sceneConfig}
     * @returns {void}
     */
    setScene ({commit, dispatch, getters}, payload) {
        // If an instance exists already, clean up first.
        if (
            getters.xeokitViewer &&
            getters.xeokitViewer instanceof Viewer
        ) {
            // Reset tool "Object info" before you destroy the viewer
            dispatch("Modules/BimViewer/ToolObjectInfo/reset", {}, {root: true});

            // Destroy Viewer
            getters.xeokitViewer.destroy();

            // Reset all loaded IFC model instances
            dispatch("resetLoadedModels");
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
            xeokitViewer = new Viewer({
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
        commit("setXeokitViewer", xeokitViewer);
        commit("setSceneConfigSelected", payload.sceneConfig);

        dispatch("Modules/BimViewer/ToolSao/setSaoSettings", payload.sceneConfig.saoSettings, {root: true});

        // Arrange the camera
        if (payload.sceneConfig.cameraSettings) {
            xeokitViewer.scene.camera.eye = payload.sceneConfig.cameraSettings.eye;
            xeokitViewer.scene.camera.look = payload.sceneConfig.cameraSettings.look;
            xeokitViewer.scene.camera.up = payload.sceneConfig.cameraSettings.up;
        }
        else {
            // [x,y,z]
            // eye =  position of the camera from the center of the secne's coordinate system
            xeokitViewer.scene.camera.eye = [0, 0, 2];
            // look = point in the scene to which the camera points (depending on the eye position)
            xeokitViewer.scene.camera.look = [0, 1, 1];
            // up = a camera's up vector defines which direction is considered "up" for the camera
            // If [0,1,0] is set, it means y is up
            xeokitViewer.scene.camera.up = [0, 1, 0];
        }

        // Load the models
        // eslint-disable-next-line
        const modelList = [];
        let modelPosition = 0;

        commit("setCurrentlyLoadedModels", 0);
        commit("setTotalNumberOfModels", 0);

        // Add tree view plugin
        dispatch("addPluginTreeView", {
            domElement: payload.domElements.treeViewContainerElement
        });

        IfcAPI.Init().then(() => {
            const ifcLoader = new WebIFCLoaderPlugin(xeokitViewer, {
                    WebIFC,
                    IfcAPI
                }),
                gltfLoader = new GLTFLoaderPlugin(xeokitViewer),
                xktLoader = new XKTLoaderPlugin(xeokitViewer);

            commit("setXeokitIfcLoader", ifcLoader);
            commit("setXeokitGltfLoader", gltfLoader);
            commit("setXeokitXktLoader", xktLoader);

            commit("setTotalNumberOfModels", payload.sceneConfig.modelList.length);

            payload.sceneConfig.modelList.forEach((url) => {
                const fileNameSplit = url.split("."),
                    fileExtension = fileNameSplit.length > 0 ? fileNameSplit[fileNameSplit.length - 1].toLowerCase() : "";

                if (!["ifc", "xkt", "gltf"].includes(fileExtension)) {
                    console.error("Invalid file extension: ", fileExtension);
                }

                // Load models invisible to avoid jumps. After loading the last model, all models are set visible.
                dispatch("loadModel", {
                    url: url,
                    visible: false,
                    type: fileExtension
                }).then((theModel) => {
                    modelList.push(theModel);

                    theModel.on("loaded", () => {
                        modelPosition++;

                        commit("setCurrentlyLoadedModels", modelPosition);

                        // When the last model has been loaded, update the camera and make the models visible.
                        if (payload.sceneConfig.modelList.length === modelPosition) {
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
                                xeokitViewer.scene.camera.eye = [0, 2, 2];
                                // look = point in the scene to which the camera points (depending on the eye position)
                                xeokitViewer.scene.camera.look = [0, 1, 1];
                                // up = a camera's up vector defines which direction is considered "up" for the camera
                                // If [0,1,0] is set, it means y is up
                                xeokitViewer.scene.camera.up = [0, 1, 0];

                                dispatch("Modules/BimViewer/ToolSceneFit/fit", null, {root: true});
                            }
                            else {
                                xeokitViewer.cameraFlight.jumpTo({
                                    eye: payload.sceneConfig.cameraSettings.eye,
                                    look: payload.sceneConfig.cameraSettings.look,
                                    up: payload.sceneConfig.cameraSettings.up
                                });
                            }

                            modelList.forEach((model) => {
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
                        }
                    });
                });
            });
        });

        // Add nav cube plugin
        dispatch("addPluginNavCube", {
            canvasElement: payload.domElements.cubeCanvas
        });

        // Add distance measurements plugin
        dispatch("addPluginDistanceMeasurements");

        // Close the right sidebar
        commit("Modules/BimViewer/setToggleRightSidebar", false, {root: true});
    },
    /**
     * Add tree view plugin (TreeViewPlugin)
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {domElement}
     * @returns {void}
     */
    addPluginTreeView ({commit, getters}, payload) {
        const xeokitPluginTreeView = new TreeViewPlugin(getters.xeokitViewer, {
            containerElement: payload.domElement,
            autoExpandDepth: 1,
            sortNodes: false,
            hierarchy: "containment",
            pruneEmptyNodes: false,
            autoAddModels: true
        });

        xeokitPluginTreeView.on("nodeTitleClicked", (event) => {
            const
                viewer = getters.xeokitViewer,
                scene = viewer.scene,
                selectedObjectIds = [],
                isElement = event.treeViewNode.children.length === 0;

            if (!isElement) {
                return;
            }

            commit("ToolObjectInfo/setModeObjectInfoActive", true);

            event.treeViewPlugin.withNodeTree(event.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                    selectedObjectIds.push(treeViewNode.objectId);
                }
            });

            scene.setObjectsSelected(scene.objectIds, false);
            scene.setObjectsXRayed(scene.objectIds, false);

            if (event.treeViewNode.objectId !== getters["ToolObjectInfo/pickedObjectId"]) {
                // Reset all objects of the current scene
                scene.setObjectsXRayed(scene.objectIds, true);
                scene.setObjectsVisible(scene.objectIds, true);

                // Set only the selected object
                scene.setObjectsXRayed(selectedObjectIds, false);
                scene.setObjectsSelected(selectedObjectIds, true);

                commit("ToolObjectInfo/setPickedObjectId", selectedObjectIds[0]);
                commit("ToolObjectInfo/setModeObjectInfoPickedObjects", Object.values(scene.selectedObjects));
                commit("Modules/BimViewer/setToggleRightSidebar", true, {root: true});

                xeokitPluginTreeView.showNode(selectedObjectIds[0]);

                viewer.cameraFlight.flyTo({
                    aabb: scene.getAABB(selectedObjectIds),
                    duration: 0.5,
                    fitFOV: 30
                });
            }
            else {
                commit("ToolObjectInfo/setPickedObjectId", "");
                commit("ToolObjectInfo/setModeObjectInfoPickedObjects", []);
                commit("Modules/BimViewer/setToggleRightSidebar", false, {root: true});

                xeokitPluginTreeView.unShowNode();
            }
        });

        commit("setXeokitPluginTreeView", xeokitPluginTreeView);
    },
    /**
     * Add nav cube plugin (NavCubePlugin)
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {canvasElement}
     * @returns {void}
     */
    addPluginNavCube ({commit, getters}, payload) {
        const xeokitPluginNavCube = new NavCubePlugin(getters.xeokitViewer, {
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
            distanceMeasurements = new DistanceMeasurementsPlugin(getters.xeokitViewer, {
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
                    annotations = new AnnotationsPlugin(getters.xeokitViewer, {
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
                        input = getters.xeokitViewer.scene.input;

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
     * @param {Object} payload Passed parameters {theModel}
     * @returns {void}
     */
    pushLoadedModel ({commit}, payload) {
        commit("pushLoadedModel", payload.theModel);
    },
    /**
     * Reset the loaded IFC model array
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    resetLoadedModels ({commit}) {
        commit("setLoadedModels", []);
    },
    /**
     * Load an IFC, XKT or glTF model
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {url, visible, type: ifc|xkt|gltf}
     * @returns {Object} VBOSceneModel instance
     */
    loadModel ({dispatch, getters}, payload) {
        const loaders = {
                ifc: getters.xeokitIfcLoader,
                xkt: getters.xeokitXktLoader,
                gltf: getters.xeokitGltfLoader
            },
            modelLoader = loaders[payload.type];

        if (!modelLoader) {
            return Promise.reject(new Error("No loader found for type: " + payload.type));
        }

        return new Promise((resolve, reject) => {
            if (typeof payload.url === "string") {
                if (payload.url.startsWith("blob:")) {
                    fetch(payload.url)
                        .then(response => response.blob())
                        .then(async (blob) => {
                            await dispatch("loadFromBlob", {
                                ...payload,
                                blob: blob,
                                modelLoader: modelLoader
                            })
                                .then((loadedModel) => {
                                    resolve(loadedModel);
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        })
                        .catch(err => {
                            reject(err);
                        });
                }
                else {
                    const loadedModel = modelLoader.load({
                        id: payload.url.split("/").reverse()[0],
                        src: payload.url,
                        excludeTypes: ["IfcSpace"],
                        edges: true,
                        visible: payload.visible
                    });

                    dispatch("handleModelLoaderEvents", {
                        loadedModel: loadedModel,
                        resolve: resolve,
                        reject: reject
                    });
                }
            }
            else if (payload.url instanceof Blob) {
                dispatch("loadFromBlob", {
                    ...payload,
                    blob: payload.url,
                    modelLoader: modelLoader
                })
                    .then((loadedModel) => {
                        resolve(loadedModel);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
            else {
                reject(new Error("Invalid payload.url type. Expect string or Blob"));
            }
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
                ? getters.xeokitViewer.camera.projectWorldPos([projectedCoords[0], heightValue, projectedCoords[1] * -1])
                : getters.xeokitViewer.camera.projectWorldPos([
                    payload.annoCoords[0],
                    heightValue,
                    payload.annoCoords[1] < 0 ? payload.annoCoords[1] : payload.annoCoords[1] * -1
                ]),
            pickResult = getters.xeokitViewer.scene.pick({
                canvasPos: canvasPos
            });

        getters.xeokitViewer.scene.camera.eye = payload.cameraEye;
        getters.xeokitViewer.scene.camera.look = payload.cameraLook;
        getters.xeokitViewer.scene.camera.up = payload.cameraUp;

        if (payload.showPointer === "1" || payload.showPointer === "true") {
            const annotations = new AnnotationsPlugin(getters.xeokitViewer, {
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

        getters.xeokitViewer.cameraFlight.jumpTo({
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
        return getters.xeokitViewer.metaScene.metaObjects[payload.objectId];
    },
    /**
     * Update the hierarchy property of the TreeView plugin
     *
     * @param {Object} context actions context object.
     * @param {string} hierarchyType Type of hierarchy (containment|storeys|types)
     * @returns {void}
     */
    updateXeokitPluginTreeViewHierarchyType ({commit}, hierarchyType) {
        commit("updateXeokitPluginTreeViewHierarchyType", hierarchyType);
    },
    /**
     * Handle model loader events.
     * @param {Object} context actions context object.
     * @param {*} payload { loadedModel, resolve, reject}
     */
    handleModelLoaderEvents ({dispatch}, payload) {
        payload.loadedModel.on("loaded", async () => {
            await dispatch("pushLoadedModel", {theModel: payload.loadedModel});
            payload.resolve(payload.loadedModel);
        });

        payload.loadedModel.on("error", (err) => {
            payload.reject(err);
        });
    },
    /**
     * Load from Blob.
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {url, type, visible, blob, modelLoader}
     * @returns {Object} VBOSceneModel instance
     */
    loadFromBlob ({dispatch, getters}, payload) {
        return new Promise((resolve, reject) => {
            const
                reader = new FileReader(),
                spinner = getters.xeokitViewer.scene.canvas.spinner;

            spinner.processes++;

            reader.onload = async function (e) {
                const arrayBuffer = e.target.result,
                    loadedModel = payload.modelLoader.load({
                        id: payload.url.name.split("/").reverse()[0],
                        [payload.type]: arrayBuffer,
                        edges: true,
                        visible: payload.visible
                    });

                await dispatch("handleModelLoaderEvents", {
                    loadedModel: loadedModel,
                    resolve: resolve,
                    reject: reject
                });
                spinner.processes--;
            };

            reader.onerror = function (err) {
                console.error("Error reading blob:", err);
                spinner.processes--;
                reject(err);
            };

            reader.readAsArrayBuffer(payload.blob);
        });
    }
};

export default actions;
