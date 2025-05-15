import getters from "../../../store/gettersBimViewer";
import stateBimViewer from "../../../store/stateBimViewer";
import {expect} from "chai";

describe("src/modules/bimViewer/store/gettersBimViewer.js", () => {
    const stateCopy = {
        type: "bimViewer",
        hasMouseMapInteractions: false,
        description: "common:modules.bimViewer.description",
        icon: "bi-houses",
        name: "common:modules.bimViewer.name",
        supportedDevices: ["Desktop", "Mobile", "Table"],
        supportedMapModes: ["2D", "3D"],
        sceneConfigsUrl: "",
        useTools: true,
        annotationRefreshInterval: null,
        wasmUrl: "./wasm/",
        xeokitViewer: null,
        xeokitIfcLoader: null,
        xeokitGltfLoader: null,
        xeokitXktLoader: null,
        xeokitIfcAPI: null,
        xeokitPluginNavCube: null,
        xeokitPluginTreeView: null,
        xeokitPluginDistanceMeasurements: null,
        xeokitPluginDistanceMeasurementsControl: null,
        xeokitPluginAnnotationLabelActive: null,
        xeokitPluginAnnotations: null,
        loadedModels: [],
        sceneConfigs: [],
        sceneConfigSelected: {},
        toggleRightSidebar: false,
        totalNumberOfModels: 0,
        currentlyLoadedModels: 0,
        annotationRefreshIntervalID: null,
        positionPointer: null,
        bimViewerFullyLoaded: false
    };

    /**
     * Get a diff of missing properties
     * @param {Object} newObj the store getters
     * @param {Object} oldObj Current state copy
     * @param {Object} stateImport The state (see imports)
     * @param {String} strNew Name/key of the getters
     * @param {String} strOld Name/key of the state copy in this test
     * @returns {Object} list of missing properties
     */
    function getDiffStatus (objNew, objOld, stateImport, strNew = "getters", strOld = "stateCopy") {
        const diff = {
            [strOld]: {},
            [strNew]: {}
        };

        for (const key in objOld) {
            if (!Object.prototype.hasOwnProperty.call(objNew, key)) {
                diff[strOld][key] = "missing or removed in " + strNew;
            }
        }

        for (const key in objNew) {
            if (!Object.prototype.hasOwnProperty.call(objOld, key)) {
                if (stateImport[key] === undefined) {
                    continue;
                }

                diff[strNew][key] = "missing or removed in " + strOld;
            }
        }

        return diff;
    }

    it("Compares the state properties", async function () {
        const
            lenCopy = Object.keys(stateCopy).length,
            lenOrig = Object.keys(getters).length,
            diffResult = getDiffStatus(getters, stateCopy, stateBimViewer, "getters", "stateCopy");

        let mesg = "Error";

        if (lenCopy !== lenOrig) {
            mesg += " " + JSON.stringify(diffResult);
        }

        expect(Object.keys(diffResult.getters).length + Object.keys(diffResult.stateCopy).length, mesg).to.eql(0);
    });

    // generic test 4 all properties in bimViewer state via getters
    Object.keys(stateCopy).forEach(prop => {
        it("Compares the default state property: " + prop, async function () {
            const state = {
                    [prop]: stateCopy[prop]
                },
                checkValue = getters[prop](state);

            if (typeof stateCopy[prop] === "function") {
                // not part of the state properties, probably in getters as prop or function
                return;
            }

            expect(checkValue).to.eql(stateCopy[prop]);
        });
    });

});
