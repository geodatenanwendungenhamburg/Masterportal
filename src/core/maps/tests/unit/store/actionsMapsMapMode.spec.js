import {expect} from "chai";
import Map from "ol/Map.js";
import sinon from "sinon";
import View from "ol/View.js";
import proj4 from "proj4";

import actions from "@core/maps/store/actionsMapsMapMode.js";

const {
    changeMapMode,
    activateMap2d,
    activateMap3d,
    checkInitial3dCenterPositionChange
} = actions;

describe("src/core/maps/store/actionsMapsMapMode.js", () => {
    let commit,
        dispatch,
        getters,
        map2d,
        map3d,
        rootState,
        setEnabled3DSpy;

    beforeEach(() => {
        proj4.defs("EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
        setEnabled3DSpy = sinon.spy();
        commit = sinon.spy();
        dispatch = sinon.spy();
        getters = sinon.spy();
        rootState = {
            portalConfig: {
                map: {}
            }
        };

        mapCollection.clear();
        map2d = new Map({
            id: "ol",
            mode: "2D",
            view: new View()
        });

        map3d = {
            id: "olcs",
            mode: "3D",
            setEnabled: setEnabled3DSpy
        };

        mapCollection.addMap(map2d, "2D");
        mapCollection.addMap(map3d, "3D");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("changeMapMode", () => {
        it("Should dispatch activateMap3d, if change from 2D to 3D map mode", () => {
            const targetMode = "3D";

            getters = {
                mode: "2D"
            };

            changeMapMode({dispatch, getters}, targetMode);

            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args).to.deep.equals(["unregisterMapListener"]);
            expect(dispatch.secondCall.args).to.deep.equals(["activateMap3d"]);
        });

        it("Should dispatch activateMap2d, if change from 3D to 2D map mode", () => {
            const targetMode = "2D";

            getters = {
                mode: "3D"
            };

            changeMapMode({dispatch, getters}, targetMode);

            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args).to.deep.equals(["registerMapListener"]);
            expect(dispatch.secondCall.args).to.deep.equals(["activateMap2d"]);
        });

        it("Should dispatch do not called, if the current and target map mode are the same", () => {
            const targetMode = "2D";

            getters = {
                mode: "2D"
            };
            changeMapMode({dispatch, getters}, targetMode);
            expect(dispatch.notCalled).to.be.true;
        });
    });

    describe("activateMap2d", () => {
        it("should trigger mapView animation", () => {
            activateMap2d({commit});
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args).to.deep.equals(["setMode", "2D"]);
            expect(setEnabled3DSpy.calledOnce).to.be.true;
        });
    });

    describe("activateMap3d", () => {
        it("should commit 3D to mode", ()=> {
            activateMap3d({commit, dispatch, rootState});

            expect(dispatch.calledOnce).to.be.true;
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args).to.deep.equals(["setMode", "3D"]);
        });

        it("should not commit 3D to mode, if map3d doesn't exist", () => {
            mapCollection.clear();
            activateMap3d({commit, dispatch, rootState});

            expect(dispatch.calledOnce).to.be.true;
            expect(commit.notCalled).to.be.true;
            expect(rootState.portalConfig.map.startingMapMode).to.equals("3D");
        });
    });
    describe("checkInitial3dCenterPositionChange", () => {
        let rootGetters,
            warnSpy;

        beforeEach(() => {
            rootGetters = {
                "Maps/initialCenter": [1, 2],
                "Maps/initialZoom": 6,
                "Maps/center": [2, 3],
                "Maps/zoom": 6,
                "Maps/projection": {
                    getCode: sinon.stub().returns("EPSG:25832")
                },
                map3dParameter: {
                    camera: {
                        cameraPosition: [1, 2, 3],
                        offset: ""
                    }
                }
            };
            warnSpy = sinon.spy();
            sinon.stub(console, "warn").callsFake(warnSpy);
        });

        it("with offset with comma, change position", () => {
            rootGetters.map3dParameter.camera.offset = "-0,5";
            checkInitial3dCenterPositionChange({commit, dispatch, rootGetters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.be.equals("useCameraPosition");
            expect(commit.firstCall.args[1]).to.be.an("Array");
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.be.equals("Maps/setCamera");
            expect(dispatch.firstCall.args[1]).to.deep.equals(rootGetters.map3dParameter);
        });

        it("with offset with point, change position", () => {
            rootGetters.map3dParameter.camera.offset = "-0.5";
            checkInitial3dCenterPositionChange({commit, dispatch, rootGetters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.be.equals("useCameraPosition");
            expect(commit.firstCall.args[1]).to.be.an("Array");
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.be.equals("Maps/setCamera");
            expect(dispatch.firstCall.args[1]).to.deep.equals(rootGetters.map3dParameter);
        });

        it("with offset NAN use 0, change position", () => {
            rootGetters.map3dParameter.camera.offset = "- 0.5";
            checkInitial3dCenterPositionChange({commit, dispatch, rootGetters});

            expect(warnSpy.calledOnce).to.be.true;
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.be.equals("useCameraPosition");
            expect(commit.firstCall.args[1]).to.be.an("Array");
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.be.equals("Maps/setCamera");
            expect(dispatch.firstCall.args[1]).to.deep.equals(rootGetters.map3dParameter);
        });

        it("no offset, do not change position", ()=> {
            checkInitial3dCenterPositionChange({commit, dispatch, rootGetters});

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;
        });

        it("with offset empty string, do not change position", () => {
            rootGetters.map3dParameter.camera.offset = "";
            checkInitial3dCenterPositionChange({commit, dispatch, rootGetters});

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;
        });

        it("with offset false, do not change position", () => {
            rootGetters.map3dParameter.camera.offset = false;
            checkInitial3dCenterPositionChange({commit, dispatch, rootGetters});

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;
        });
    });
});
