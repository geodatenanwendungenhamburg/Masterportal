import load3DScript from "@masterportal/masterportalapi/src/lib/load3DScript";
import api from "@masterportal/masterportalapi/src/maps/api";
import {expect} from "chai";
import sinon from "sinon";

import {initializeMaps, load3DMap, create3DMap} from "@core/maps/js/maps";
import store from "@appstore";


describe("src/core/js/maps/maps.js", () => {
    let load3DScriptSpy,
        origGetters;

    before(() => {
        origGetters = store.getters;
    });

    beforeEach(() => {
        global.Cesium = {
            JulianDate: {
                fromIso8601: sinon.spy(() => "mocked JulianDate from ISO"),
                fromDate: sinon.spy(() => "mocked JulianDate from Date")
            }
        };

        mapCollection.clear();
        load3DScriptSpy = sinon.spy(load3DScript, "load3DScript");
        sinon.stub(store, "dispatch").callsFake(() => {
            return Promise.resolve();
        });
        store.getters = {
            cesiumLibrary: "path_to_cesium_library",
            controlsConfig: {
                button3d: true,
                expandable: {}
            },
            "Maps/mode": "2D"
        };
    });

    afterEach(() => {
        store.getters = origGetters;
        sinon.restore();
    });

    describe("initializeMaps", () => {
        it("2D map should exists after createMaps and if button3d is configured, Cesium is loaded", () => {
            const portalConfig = {
                    portal: "config"
                },
                configJs = {
                    config: "js"
                };

            initializeMaps(portalConfig, configJs);

            expect(mapCollection.getMap("2D")).to.be.not.undefined;
            expect(load3DScriptSpy.calledOnce).to.be.true;
        });
        it("2D map should exists after createMaps and if button3d is not configured, Cesium is not loaded", () => {
            const portalConfig = {
                    portal: "config"
                },
                configJs = {
                    config: "js"
                };

            store.getters.controlsConfig.button3d = undefined;
            initializeMaps(portalConfig, configJs);

            expect(mapCollection.getMap("2D")).to.be.not.undefined;
            expect(load3DScriptSpy.notCalled).to.be.true;
        });
        it("loads 3D map when button3d is configured in controlsConfig.expandable", () => {
            const portalConfig = {
                    portal: "config"
                },
                configJs = {
                    config: "js"
                };

            store.getters.controlsConfig.button3d = false;
            store.getters.controlsConfig.expandable.button3d = true;

            initializeMaps(portalConfig, configJs);

            expect(mapCollection.getMap("2D")).to.be.not.undefined;
            expect(load3DScriptSpy.calledOnce).to.be.true;
        });

        it("does not load 3D map if button3d is not configured in either controlsConfig or controlsConfig.expandable", () => {
            const portalConfig = {
                    portal: "config"
                },
                configJs = {
                    config: "js"
                };

            store.getters.controlsConfig.button3d = false;
            store.getters.controlsConfig.expandable.button3d = false;

            initializeMaps(portalConfig, configJs);

            expect(mapCollection.getMap("2D")).to.be.not.undefined;
            expect(load3DScriptSpy.notCalled).to.be.true;
        });
    });

    describe("load3DMap", () => {
        it("should trigger the masterportalapi function load3DScript", () => {
            const configJs = {
                config: "js"
            };

            load3DMap(configJs);

            expect(load3DScriptSpy.calledOnce).to.be.true;
            expect(load3DScriptSpy.firstCall.args[0]).to.equals("path_to_cesium_library");
            expect(typeof load3DScriptSpy.firstCall.args[1]).to.equals("function");
        });
    });

    describe("create3DMap", () => {
        it("should set center and zoom if no url parameter set for center and 3D camera parameter are configured", () => {
            const map3d = {
                    setEnabled: sinon.spy()
                },
                setZoomSpy = sinon.spy(),
                setCenterSpy = sinon.spy(),
                mapView = {
                    setZoom: setZoomSpy,
                    setCenter: setCenterSpy
                },
                viewSpy = sinon.stub(mapCollection, "getMapView").returns(mapView);


            store.getters.map3dParameter = {
                camera: {}
            };
            store.getters["Maps/initialZoom"] = 7;
            store.getters["Maps/initialCenter"] = [564028.7954571751, 5934555.967867207];
            sinon.stub(api.map, "createMap").returns(map3d);


            create3DMap();

            expect(viewSpy.firstCall.args[0]).to.equals("2D");
            expect(setZoomSpy.firstCall.args[0]).to.equals(7);
            expect(setCenterSpy.firstCall.args[0]).to.deep.equals([564028.7954571751, 5934555.967867207]);
        });
        it("should set the map to center if the url parameter center exists and 3D camera parameter are configured", () => {
            const map3d = {
                    setEnabled: sinon.spy()
                },
                setZoomSpy = sinon.spy(),
                setCenterSpy = sinon.spy(),
                mapView = {
                    setZoom: setZoomSpy,
                    setCenter: setCenterSpy
                },
                viewSpy = sinon.stub(mapCollection, "getMapView").returns(mapView);

            store.getters.map3dParameter = {
                camera: {}
            };
            store.state.urlParams.CENTER = [564028.7954571751, 5934555.967867207];
            sinon.stub(api.map, "createMap").returns(map3d);

            create3DMap();

            expect(viewSpy.firstCall.args[0]).to.equals("2D");
            expect(setCenterSpy.firstCall.args[0]).to.deep.equals([564028.7954571751, 5934555.967867207]);
        });
        it("should set the map to center if the url parameter MAPS/center exists and 3D camera parameter are configured", () => {
            const map3d = {
                    setEnabled: sinon.spy()
                },
                setZoomSpy = sinon.spy(),
                setCenterSpy = sinon.spy(),
                mapView = {
                    setZoom: setZoomSpy,
                    setCenter: setCenterSpy
                },
                viewSpy = sinon.stub(mapCollection, "getMapView").returns(mapView);

            store.getters.map3dParameter = {
                camera: {}
            };
            store.state.urlParams.MAPS = JSON.stringify({"center": [567773.339990154, 5933469.927044973], "mode": "2D", "zoom": 10});
            sinon.stub(api.map, "createMap").returns(map3d);


            create3DMap();

            expect(viewSpy.firstCall.args[0]).to.equals("2D");
            expect(setCenterSpy.firstCall.args[0]).to.deep.equals([564028.7954571751, 5934555.967867207]);
        });

        it("should use the current system time if no shadowTime is configured", () => {
            const map3d = {setEnabled: sinon.spy()},
                setZoomSpy = sinon.spy(),
                setCenterSpy = sinon.spy(),
                mapView = {setZoom: setZoomSpy, setCenter: setCenterSpy};

            Cesium.JulianDate.fromIso8601.resetHistory();
            Cesium.JulianDate.fromDate.resetHistory();


            sinon.stub(mapCollection, "getMapView").withArgs("2D").returns(mapView);

            store.getters.map3dParameter = {camera: {}};

            sinon.stub(api.map, "createMap").callsFake(options => {
                options.shadowTime();
                return map3d;
            });

            create3DMap();

            expect(Cesium.JulianDate.fromDate.calledOnce).to.be.true;
            expect(Cesium.JulianDate.fromIso8601.notCalled).to.be.true;
        });
    });
});
