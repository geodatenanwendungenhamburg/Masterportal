import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";
import validateGltfUris from "../utils/validateGltfUris";
import proj4 from "proj4";
import generateUniqueModelId from "../utils/generateUniqueModelId";

let
    XeoKitSdk = null,
    WebIFC = null;

const actions = {
    /**
     * Initialize BIM Viewer by dynamically loading the required node packages.
     * This is required to ensure, that separate js files are generated and
     * loaded during the webpack build process.
     *
     * @returns {void}
     */
    async initializeBimViewer ({dispatch}) {
        XeoKitSdk = await dispatch("loadXeokitSdk");
        WebIFC = await import(/* webpackChunkName: "bim-viewer_web-ifc-api" */ "web-ifc/web-ifc-api.js");
    },

    /**
     * Load XeoKit SDK dynamically from an URL.
     *
     * @param {Object} context actions context object.
     * @returns {Promise<Object>}
     */
    async loadXeokitSdk ({rootGetters}) {
        return new Promise((resolve) => {
            const script = document.createElement("script");

            script.type = "module";
            script.textContent = `
                import * as XeoKitSdk from '${rootGetters.xeoKitSdkLibrary}';
                window.XeoKitSdk = XeoKitSdk;
                window.__xeokitSdkLoaded = true;
            `;
            document.head.appendChild(script);

            // Poll for the global variable to be set
            // eslint-disable-next-line
            const checkLoaded = () => {
                if (window.__xeokitSdkLoaded && window.XeoKitSdk) {
                    resolve(window.XeoKitSdk);
                }
                else {
                    setTimeout(checkLoaded, 50);
                }
            };

            checkLoaded();
        });
    },
    /**
     * Load scene configs from server. Contains multiple scenes each with models, camera settings, sao settings, etc.
     * The sceneConfigsUrl is configured in the portal's config.json
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async loadSceneConfigs ({commit, getters}) {
        const timestamp = Date.now();

        return axios
            .get(buildEndpointUrl(getters.sceneConfigsUrl, {"t": timestamp}))
            .then(response => commit("setSceneConfigs", response.data));
    },
    /**
     * Set the scene. Initialize the viewer, scene settings, load models, add plugins.
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {viewerCanvas, cubeCanvas, treeViewContainerElement, sceneConfig}
     * @returns {void}
     */
    setScene ({commit, dispatch, getters, reject}, payload) {
        // If an instance exists already, clean up first.
        if (
            getters.xeokitViewer &&
            getters.xeokitViewer instanceof XeoKitSdk.Viewer
        ) {
            // Reset tool "Object info" before you destroy the viewer
            dispatch("Modules/BimViewer/ToolObjectInfo/reset", {}, {root: true});

            // Destroy Viewer
            getters.xeokitViewer.destroy();

            // Reset all loaded IFC model instances
            commit("setLoadedModels", []);
        }

        // Initialize the Viewer
        const
            {Viewer, WebIFCLoaderPlugin, GLTFLoaderPlugin, XKTLoaderPlugin, LocaleService} = XeoKitSdk,
            navCubeLabels = {
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

        // Fix for annotation rendering outside of canvas, set occlusion tests to 1 tick (default 20 ticks)
        xeokitViewer.scene.ticksPerOcclusionTest = 1;

        // Set Wasm (WebAssembly) path. These bytecode files are loaded via HTTP.
        IfcAPI.SetWasmPath(getters.wasmUrl, true);

        commit("setXeokitIfcAPI", IfcAPI);
        commit("setXeokitViewer", xeokitViewer);
        commit("setSceneConfigSelected", payload.sceneConfig);

        dispatch("Modules/BimViewer/ToolSao/setSaoSettings", payload.sceneConfig.saoSettings, {root: true});

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

            if (!payload.sceneConfig.modelList.length) {
                // If there are no models, we just update the camera settings.
                dispatch("adjustSceneCamera", {
                    cameraSettings: payload.sceneConfig.cameraSettings ?? null
                });
            }
            else {
                payload.sceneConfig.modelList.forEach((url) => {
                    const fileNameSplit = url.split("."),
                        fileExtension = fileNameSplit.length > 0 ? fileNameSplit[fileNameSplit.length - 1].toLowerCase() : "";

                    if (!["ifc", "xkt", "gltf"].includes(fileExtension)) {
                        console.error("Invalid file extension: ", fileExtension);
                    }

                    dispatch("loadModel", {
                        url: url,
                        visible: true,
                        type: fileExtension
                    }).then((theModel) => {
                        theModel.on("loaded", () => {
                            modelPosition++;

                            dispatch("addMetaInformationToModel", theModel);

                            commit("setCurrentlyLoadedModels", modelPosition);

                            dispatch("adjustSceneCamera", {
                                cameraSettings: payload.sceneConfig.cameraSettings ?? null
                            });

                            // When the last model has been loaded, update the camera.
                            if (payload.sceneConfig.modelList.length === modelPosition) {
                                const
                                    annotationCoordinates = urlParams.get("annoCoords"),
                                    cameraEye = urlParams.get("cameraEye"),
                                    cameraLook = urlParams.get("cameraLook"),
                                    cameraUp = urlParams.get("cameraUp"),
                                    projection = urlParams.get("annoProj"),
                                    showPointer = urlParams.get("showPointer");

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
                    }).catch((error) => {
                        reject(error);
                    });
                });
            }

            commit("setBimViewerFullyLoaded", true);
        });

        // Add nav cube plugin
        dispatch("addPluginNavCube", {
            canvasElement: payload.domElements.cubeCanvas
        });

        // Add distance measurements plugin
        dispatch("addPluginDistanceMeasurements");

        // Add plugin to show BCF data (BIM Collaboration Format)
        dispatch("addPluginBCFViewpoints");

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
        const
            {TreeViewPlugin} = XeoKitSdk,
            xeokitPluginTreeView = new TreeViewPlugin(getters.xeokitViewer, {
                containerElement: payload.domElement,
                autoExpandDepth: 1,
                sortNodes: false,
                hierarchy: "containment",
                pruneEmptyNodes: true,
                autoAddModels: true
            });

        getters.xeokitViewer.scene.on("modelUnloaded", (modelId) => {
            if (getters.xeokitViewer.metaScene.metaModels[modelId]) {
                xeokitPluginTreeView.removeModel(modelId);
            }
        });

        // Handle clicks in TreeView. Click on a "folder" just zooms to the object,
        // click on single object zooms to the object and selects it.
        xeokitPluginTreeView.on("nodeTitleClicked", (event) => {
            const
                viewer = getters.xeokitViewer,
                scene = viewer.scene,
                selectedObjectIds = [],
                rootObjectId = event.treeViewNode.objectId;

            commit("ToolObjectInfo/setModeObjectInfoActive", true);

            // Collect all objectIds under this objectId
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

                // Set only the selected object
                scene.setObjectsXRayed(selectedObjectIds, false);
                scene.setObjectsSelected(selectedObjectIds, true);

                commit("ToolObjectInfo/setPickedObjectId", rootObjectId);
                commit("ToolObjectInfo/setModeObjectInfoPickedObjects", Object.values(scene.selectedObjects));
                commit("Modules/BimViewer/setToggleRightSidebar", true, {root: true});

                xeokitPluginTreeView.showNode(selectedObjectIds[0]);

                viewer.cameraFlight.flyTo({
                    aabb: scene.getAABB(selectedObjectIds),
                    duration: 0.5
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
        const
            {NavCubePlugin} = XeoKitSdk,
            xeokitPluginNavCube = new NavCubePlugin(getters.xeokitViewer, {
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
     * Add BCF - BIM Collaboration Format - plugin (BCFViewpointsPlugin)
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    addPluginBCFViewpoints ({commit, getters}) {
        const {BCFViewpointsPlugin} = XeoKitSdk;

        commit("setXeokitPluginBCFViewpoints", new BCFViewpointsPlugin(getters.xeokitViewer));
    },
    /**
     * Add distance measurements plugin (DistanceMeasurementsPlugin)
     *
     * @param {Object} context actions context object.
     * @returns {void}
     */
    addPluginDistanceMeasurements ({commit, getters}) {
        const
            {DistanceMeasurementsMouseControl, DistanceMeasurementsPlugin} = XeoKitSdk,
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
        const
            {AnnotationsPlugin} = XeoKitSdk,
            // for DIPAS URL parameters need to be added to the json containing the annotations
            urlParams = new URLSearchParams(window.location.search),
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
     * Load an IFC, XKT or glTF model
     *
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {url, visible, type: ifc|xkt|gltf}
     * @returns {Object} VBOSceneModel instance
     */
    loadModel ({dispatch, getters, rootGetters}, payload) {
        const loaders = {
                ifc: getters.xeokitIfcLoader,
                xkt: getters.xeokitXktLoader,
                gltf: getters.xeokitGltfLoader
            },
            modelLoader = loaders[payload.type],
            viewer = rootGetters["Modules/BimViewer/xeokitViewer"],
            scene = viewer?.scene;

        if (!modelLoader) {
            return Promise.reject(new Error("No loader found for type: " + payload.type));
        }

        // In case a model with the same objects as already loaded objects is loaded again
        // any selections must be cleared prior to loading the model again.
        scene.setObjectsSelected(scene.selectedObjects, false);
        dispatch("Modules/BimViewer/ToolObjectInfo/reset", {}, {root: true});

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
                            }).then((loadedModel) => {
                                if (payload.type === "ifc" || payload.type === "xkt") {
                                    dispatch("addMetaInformationToModel", loadedModel);
                                }
                                resolve(loadedModel);
                            }).catch((err) => {
                                reject(err);
                            });
                        })
                        .catch(err => {
                            reject(err);
                        });
                }
                else {
                    const loadedModel = modelLoader.load({
                        id: generateUniqueModelId(
                            payload.url.split("/").reverse()[0],
                            getters.loadedModels.map((item) => item.sceneModel.id)
                        ),
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
                if (payload.type === "gltf") {
                    validateGltfUris(payload.url)
                        .then(() => {
                            dispatch("loadFromBlob", {
                                ...payload,
                                blob: payload.url,
                                modelLoader: modelLoader
                            }).then((loadedModel) => {
                                resolve(loadedModel);
                            }).catch((err) => {
                                reject(err);
                            });
                        }).catch((err) => {
                            dispatch("Alerting/addSingleAlert", {
                                category: "error",
                                content: err.message || "Invalid glTF file."
                            }, {root: true});

                            reject(err);
                        });
                }
                else {
                    // for IFC/XKT...
                    dispatch("loadFromBlob", {
                        ...payload,
                        blob: payload.url,
                        modelLoader: modelLoader
                    }
                    ).then((loadedModel) => {
                        if (payload.type === "ifc" || payload.type === "xkt") {
                            dispatch("addMetaInformationToModel", loadedModel);
                        }
                        resolve(loadedModel);
                    }
                    ).catch((err) => {
                        reject(err);
                    });
                }
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
    zoomToObject ({rootGetters, getters, commit, dispatch}, payload) {
        let projectedCoords = null;

        if (payload.projection === "EPSG:4326") {
            projectedCoords = proj4(
                "EPSG:4326",
                rootGetters["Maps/projectionCode"],
                [payload.annoCoords[0], payload.annoCoords[1]]
            );
        }

        const
            {AnnotationsPlugin} = XeoKitSdk,
            heightValue = payload.annoCoords[2] ?? 0,
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

        dispatch("adjustSceneCamera", {
            cameraSettings: {
                eye: payload.cameraEye,
                look: payload.cameraLook,
                up: payload.cameraUp
            }
        });

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

        getters.xeokitViewer.cameraFlight.flyTo({
            aabb: pickResult.entity._aabb,
            duration: 0.5
        });
    },
    /**
     * Destroy the model
     * @param {Object} context actions context object.
     * @param {string} modelId objectId to destroy
     */
    destroyModel ({commit, rootGetters, getters, dispatch}, modelId) {
        const
            model = getters.loadedModels.find(item => item.sceneModel.id === modelId),
            selectedObjectId = rootGetters["Modules/BimViewer/ToolObjectInfo/pickedObjectId"],
            modelObjectIsSelected = model.sceneModel.objects[selectedObjectId] ?? false;

        model.sceneModel.destroy();

        commit("removeFromLoadedModels", modelId);

        if (modelObjectIsSelected) {
            dispatch("Modules/BimViewer/ToolObjectInfo/reset", getters.loadedModels.length === 0, {root: true});
        }
        else if (getters.loadedModels.length === 0) {
            dispatch("Modules/BimViewer/ToolObjectInfo/reset", true, {root: true});
        }
    },
    /**
     * Fly to the complete model
     * @param {Object} context actions context object.
     * @param {string} modelId root modelId to fly to
     */
    flyToCompleteModel ({getters}, modelId) {
        const model = getters.loadedModels.find(item => item.sceneModel.id === modelId);

        getters.xeokitViewer.cameraFlight.flyTo({
            aabb: getters.xeokitViewer.scene.getAABB(Object.keys(model.sceneModel.objects)),
            duration: 0.5
        });
    },
    /**
     * Set the loaded model xRayed or not
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters
     * @param {String} payload.modelId Model ID
     * @param {Boolean} payload.isXRayed Active or not
     */
    setLoadedModelXRayed ({getters}, payload) {
        const model = getters.loadedModels.find(item => item.sceneModel.id === payload.modelId);

        getters.xeokitViewer.scene.setObjectsXRayed(
            Object.keys(model.sceneModel.objects),
            payload.isXRayed
        );

        model.extraSettings.xRayed = payload.isXRayed ? 1 : 0;
    },
    /**
     * Set the loaded model invisible or not
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters
     * @param {String} payload.modelId Model ID
     * @param {Boolean} payload.isVisible Active or not
     */
    setLoadedModelVisible ({getters}, payload) {
        const model = getters.loadedModels.find(item => item.sceneModel.id === payload.modelId);

        getters.xeokitViewer.scene.setObjectsVisible(
            Object.keys(model.sceneModel.objects),
            payload.isVisible
        );

        model.extraSettings.visible = payload.isVisible ? 1 : 0;
    },
    /**
     * Refresh the "visible" and "xRayed" state for each of the loaded models
     * Required for the sidebar "Object Structure / Models tab"
     * @param {Object} context actions context object.
     */
    refreshLoadedModelExtraSettings ({getters}) {
        getters.loadedModels.forEach(loadedModel => {
            const modelObjects = loadedModel.sceneModel.objects;

            let
                // Fully visible: 1, Not visible: 0, Partially visible: -1
                visibleState = null,
                // Fully xRayed: 1, Not xRayed: 0, Partially xRayed: -1
                xRayedState = null;

            for (const id in modelObjects) {
                if (!Object.prototype.hasOwnProperty.call(modelObjects, id)) {
                    continue;
                }

                const modelObject = modelObjects[id];

                if (visibleState === null) {
                    visibleState = modelObject.visible;
                }
                else if (
                    visibleState !== -1
                    && visibleState !== modelObject.visible
                ) {
                    visibleState = -1;
                }

                if (xRayedState === null) {
                    xRayedState = modelObject.xrayed;
                }
                else if (
                    xRayedState !== -1
                    && xRayedState !== modelObject.xrayed
                ) {
                    xRayedState = -1;
                }

                // Early return for performance optimization
                if (
                    visibleState === -1
                    && xRayedState === -1
                ) {
                    break;
                }
            }

            // Assign visible state
            if (visibleState === true) {
                loadedModel.extraSettings.visible = 1;
            }
            else if (visibleState === false) {
                loadedModel.extraSettings.visible = 0;
            }
            else {
                loadedModel.extraSettings.visible = -1;
            }

            // Assign xRayed state
            if (xRayedState === true) {
                loadedModel.extraSettings.xRayed = 1;
            }
            else if (xRayedState === false) {
                loadedModel.extraSettings.xRayed = 0;
            }
            else {
                loadedModel.extraSettings.xRayed = -1;
            }
        });
    },
    /**
     * Handle model loader events.
     * @param {Object} context actions context object.
     * @param {*} payload { loadedModel, resolve, reject}
     */
    handleModelLoaderEvents ({commit}, payload) {
        payload.loadedModel.on("loaded", async () => {
            commit("pushLoadedModel", payload.loadedModel);
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
                try {
                    const arrayBuffer = e.target.result,
                        loadedModel = payload.modelLoader.load({
                            id: payload.url.name.split("/").reverse()[0],
                            [payload.type]: arrayBuffer,
                            edges: true,
                            visible: payload.visible
                        });

                    loadedModel.on("error", (err) => {
                        reject(err);
                    });

                    await dispatch("handleModelLoaderEvents", {
                        loadedModel: loadedModel,
                        resolve: resolve,
                        reject: reject
                    });

                    spinner.processes--;
                }
                catch (err) {
                    spinner.processes--;
                    reject(err);
                }
            };

            reader.onerror = function (err) {
                console.error("Error reading blob:", err);
                spinner.processes--;
                reject(err);
            };

            reader.readAsArrayBuffer(payload.blob);
        });
    },
    /**
     * Add meta information to the loaded model.
     * @param {Object} context actions context object.
     * @param {Object} payload loadedModel {id}
     * @returns {void}
     */
    addMetaInformationToModel ({getters, dispatch}, payload) {
        const api = getters.xeokitIfcAPI,
            modelId = payload.id,
            fileName = api.GetHeaderLine(modelId, WebIFC.FILE_NAME), // FILE_NAME
            schema = api.GetHeaderLine(modelId, WebIFC.FILE_SCHEMA); // FILE_SCHEMA

        // following request will give additional Header-Information for the model
        // headerInfo = api.GetHeaderLine(modelId, WebIFC.FILE_DESCRIPTION), // FILE_DESCRIPTION
        getters.xeokitViewer.metaScene.metaModels[modelId].schema = schema?.arguments[0][0].value;
        getters.xeokitViewer.metaScene.metaModels[modelId].author = fileName?.arguments[2][0].value;
        getters.xeokitViewer.metaScene.metaModels[modelId].createdAt = fileName?.arguments[1].value;
        getters.xeokitViewer.metaScene.metaModels[modelId].ifcModelSchemaId = api.modelSchemaList.length - 1;

        dispatch("buildRelAggregatesMap", getters.xeokitViewer.metaScene.metaModels[modelId].ifcModelSchemaId);
    },
    /**
     * Load a BCF viewpoint file (BIM Collaboration Format)
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters {url}
     * @returns {void}
     */
    async loadBCF ({dispatch, getters}, payload) {
        const
            scene = getters.xeokitViewer.scene,
            spinner = scene.canvas.spinner;

        try {
            spinner.processes++;

            const
                json = await new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);

                    reader.readAsText(payload.url);
                }),
                bcfData = JSON.parse(json);

            getters.xeokitPluginBCFViewpoints.setViewpoint(bcfData);
        }
        catch (error) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("modules.bimViewer.tools.downloadBCFViewpointJson.errorInvalidFile")
            }, {root: true});
        }
        finally {
            spinner.processes--;
        }
    },
    /**
     * Adjust the camera by given camera settings from scenes.json, or by default values.
     * If the default camera settings are applied, we use ToolSceneFit/fit to fit the models.
     * @param {Object} context actions context object.
     * @param {Object} payload Passed parameters
     * @param {Object|null} payload.cameraSettings Settings for the camera, null or {eye, look, up}.
     * @returns {void}
     */
    adjustSceneCamera ({getters, dispatch}, payload) {
        const camera = getters.xeokitViewer.scene.camera;

        if (payload.cameraSettings) {
            // Use given camera settings
            camera.eye = payload.cameraSettings.eye;
            camera.look = payload.cameraSettings.look;
            camera.up = payload.cameraSettings.up;
        }
        else {
            // Use default camera settings
            camera.eye = [0.5, 1.77, 1.9];
            camera.look = [1.6, 0.09, -0.05];
            camera.up = [0.16, 0.86, -0.4];

            // Fit objects in scene
            dispatch("Modules/BimViewer/ToolSceneFit/fit", null, {root: true});
        }
    },
    /**
     * Builds a map of relationships between parent and child objects in an IFC model.
     * This function processes IFCRELAGGREGATES relationships to establish a mapping
     * between child object IDs and their corresponding parent object IDs.
     *
     * @param {Object} context - The Vuex actions context object.
     * @param {Object} context.getters - Vuex getters object.
     * @param {Function} context.commit - Vuex commit function to update state.
     * @param {string} ifcModelId - The xeokit internal ID of the IFC model to process.
     */
    buildRelAggregatesMap ({getters, commit}, ifcModelId) {
        const relAggregatesMap = getters.relAggregatesMap,
            rels = getters.xeokitIfcAPI.GetLineIDsWithType(ifcModelId, WebIFC.IFCRELAGGREGATES);

        for (let i = 0; i < rels.size(); i++) {
            const relID = rels.get(i),
                rel = getters.xeokitIfcAPI.GetLine(ifcModelId, relID),
                parent = getters.xeokitIfcAPI.GetLine(ifcModelId, rel.RelatingObject.value),
                parentId = parent.GlobalId.value;

            for (const related of rel.RelatedObjects) {
                const child = getters.xeokitIfcAPI.GetLine(ifcModelId, related.value),
                    childId = child.GlobalId.value;

                relAggregatesMap[childId] = parentId;
            }
        }

        commit("setRelAggregatesMap", relAggregatesMap);
    }
};

export default actions;
