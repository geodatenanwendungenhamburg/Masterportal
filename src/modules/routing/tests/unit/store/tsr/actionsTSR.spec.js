import sinon from "sinon";
import {expect} from "chai";
import actionsTSR from "@modules/routing/store/tsr/actionsTSR";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import {RoutingWaypoint} from "@modules/routing/js/classes/routing-waypoint";
import {RoutingTSRDirections} from "@modules/routing/js/classes/routing-directions-tsr";
import {RoutingGeosearchResult} from "@modules/routing/js/classes/routing-geosearch-result";
import tsrWaypointsLayer from "@modules/routing/js/map/tsr/waypoints/tsrWaypointsLayer";
import axios from "axios";

describe("src/modules/routing/store/directions/actionsTSR.js", () => {

    let state, commitSpy, commit, dispatchSpy, dispatch, dispatchMocks, getters, rootState, waypoints, wgs84Coordinates, tsrWaypointSource, routingTSRResult, routeFeature, startPoint, waypoint1, waypoint2, endPoint, tsrRouteSource;

    beforeEach(() => {
        sinon.stub(i18next, "t").callsFake((...args) => args);

        sinon.stub(axios, "post").returns(
            new Promise((_, reject) => reject({
                response: {
                    status: 404
                }
            }))
        );

        tsrWaypointSource = new VectorSource();
        tsrRouteSource = new VectorSource();

        routeFeature = new Feature({
            geometry: new LineString([[8.1, 51.1], [8.2, 51.2]])
        });

        startPoint = new RoutingWaypoint({index: 0, source: tsrWaypointSource});
        startPoint.setCoordinates([8, 51]);
        startPoint.setIndexDirectionsLineString(0);

        waypoint1 = new RoutingWaypoint({index: 1, source: tsrWaypointSource});
        waypoint1.setCoordinates([9, 52]);
        waypoint1.setIndexDirectionsLineString(1);

        waypoint2 = new RoutingWaypoint({index: 2, source: tsrWaypointSource});
        waypoint2.setCoordinates([9.1, 52.1]);
        waypoint2.setIndexDirectionsLineString(2);

        endPoint = new RoutingWaypoint({index: 3, source: tsrWaypointSource});
        endPoint.setCoordinates([8, 80]);
        endPoint.setIndexDirectionsLineString(3);

        waypoints = [startPoint, waypoint1, waypoint2, endPoint];
        wgs84Coordinates = waypoints.map(point => point.getCoordinates());

        routingTSRResult = new RoutingTSRDirections({
            distance: 12.34,
            duration: 61234,
            lineString: [[8.1, 51.1], [8.15, 51.15], [8.16, 51.26], [8.2, 51.2]],
            lineStringWaypointIndex: [0, 1, 2, 3],
            steps: [
                {
                    type: "start",
                    location: [8, 51]
                },
                {
                    type: "job",
                    location: [9.1, 52.1],
                    id: 0
                    // index: 2 in state.waypoints
                },
                {
                    type: "job",
                    location: [9, 52],
                    id: 1
                    // index: 1 in state.waypoints
                },
                {
                    type: "end",
                    location: [8, 80]
                }
            ]

        });

        commitSpy = sinon.spy();
        commit = (...args) => {
            commitSpy(...args);
            return undefined;
        };
        dispatchSpy = sinon.spy();
        dispatchMocks = {
            fetchTSR: routingTSRResult,
            getTSRCoordinatesWgs84: wgs84Coordinates,
            getRouteFeature: routeFeature
        };
        dispatch = (...args) => {
            dispatchSpy(...args);
            if (args[0] === "Modules/Routing/transformCoordinatesLocalToWgs84Projection") {
                return args[1];
            }
            else if (args[0] === "Modules/Routing/transformCoordinatesWgs84ToLocalProjection") {
                return args[1];
            }
            else if (args[0] === "Modules/Routing/fetchTextByCoordinates") {
                return new RoutingGeosearchResult([args[1].coordinates[0], args[1].coordinates[1]], "test");
            }
            return dispatchMocks[args[0]];
        };
        getters = {
            tsrCoordinates: wgs84Coordinates,
            waypoints: waypoints,
            tsrRouteSource: tsrRouteSource
        };

        rootState = {
            Maps: {
                mode: "2D"
            },
            Modules: {
                Routing: {}
            }
        };

        mapCollection.clear();
        mapCollection.addMap({
            mode: "2D",
            getView: () => ({
                fit: () => sinon.spy()
            }),
            addLayer: sinon.spy(),
            removeLayer: sinon.spy()
        }, "2D");

        state = {
            settings: {
                speedProfile: "HGV",
                preference: "SHORTEST"
            },
            waypoints: waypoints,
            tsrRouteSource: new VectorSource({
                features: [
                    routeFeature
                ]
            }),
            tsrWaypointSource: tsrWaypointSource,
            tsrWaypointsLayer: tsrWaypointsLayer,
            tsrWaypointsDrawInteraction: new Draw({
                source: "",
                type: "Point",
                geometryFunction: undefined
            }),
            addStartEndPoint: 1,
            tsrDistance: "",
            tsrDuration: ""
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should findTSR", async () => {
        const mock = document.createElement("div");
        let hours = 0,
            minutes = 0;

        sinon.stub(document, "getElementById").withArgs("mp-body-secondaryMenu").returns(mock);

        await actionsTSR.findTSR({state, getters, commit, dispatch, rootState});

        hours = Math.floor(routingTSRResult.duration / 3600);
        minutes = Math.floor((routingTSRResult.duration / 60) % 60);

        if ((hours || minutes) === 0) {
            minutes = "01";
        }

        expect(commitSpy.args).to.deep.equal([
            ["setIsLoadingDirections", true],
            ["setTsrDistance", (routingTSRResult.distance / 1000.0).toFixed(2) + " km"],
            ["setTsrDuration", hours + " h " + minutes + " min"],
            ["setTsrDirections", routingTSRResult],
            ["setIsLoadingDirections", false]
        ]);
        expect(dispatchSpy.args).to.deep.equal([
            ["getTSRCoordinatesWgs84"],
            ["getRouteFeature"],
            ["resetTSRResults"],
            ["fetchTSR", {wgs84Coords: wgs84Coordinates, instructions: true}],
            ["getTSRCoordinatesWgs84"],
            ["assignWaypointOrder", routingTSRResult]
        ]);
    });

    it("should resetTSRResults", async () => {
        await actionsTSR.resetTSRResults({state, getters, commit, dispatch, rootState});

        expect(commitSpy.args).to.deep.equal([
            ["setTsrDirections", null]
        ]);

        expect(dispatchSpy.args).to.deep.equal([
            ["getRouteFeature"]
        ]);
    });

    it("should getRouteFeature", async () => {
        const result = await actionsTSR.getRouteFeature({state, getters, commit, dispatch, rootState});

        expect(result).equal(routeFeature);
    });

    it("should getTSRCoordinatesWgs84", async () => {
        const directionsCoordinatesWgs84 = await actionsTSR.getTSRCoordinatesWgs84({state, getters, commit, dispatch, rootState});

        expect(dispatchSpy.args).to.deep.equal(
            getters.tsrCoordinates.map(coords => ["Modules/Routing/transformCoordinatesLocalToWgs84Projection", coords, {root: true}])
        );

        expect(directionsCoordinatesWgs84).to.deep.equal(getters.tsrCoordinates);
    });

    it("should initTSR without mapListenerAdded", async () => {
        state.mapListenerAdded = false;
        state.tsrRouteLayer = true;
        state.tsrWaypointsLayer = true;
        state.tsrElevationLayer = true;
        await actionsTSR.initTSR({state, getters, commit, dispatch, rootState});
        expect(dispatchSpy.args).to.deep.equal([
            ["initWaypoints"],
            ["createTSRWaypointsModifyInteractionListener"],
            ["Maps/addLayer", true, {root: true}],
            ["Maps/addLayer", true, {root: true}],
            ["Maps/addLayer", true, {root: true}],
            ["createInteractionFromMapInteractionMode"]
        ]);

        expect(commitSpy.args).to.deep.equal([
            ["setMapListenerAdded", true]
        ]);
    });

    it("should initTSR with mapListenerAdded", async () => {
        state.mapListenerAdded = true;
        state.tsrRouteLayer = true;
        state.tsrWaypointsLayer = true;
        state.tsrElevationLayer = true;

        await actionsTSR.initTSR({state, getters, commit, dispatch, rootState});

        expect(dispatchSpy.args).to.deep.equal([
            ["initWaypoints"],
            ["Maps/addLayer", true, {root: true}],
            ["Maps/addLayer", true, {root: true}],
            ["Maps/addLayer", true, {root: true}],
            ["createInteractionFromMapInteractionMode"]
        ]);
    });

    it("should createInteractionFromMapInteractionMode with mapInteractionMode 'WAYPOINTS'", async () => {
        state.mapInteractionMode = "WAYPOINTS";
        await actionsTSR.createInteractionFromMapInteractionMode({state, getters, commit, dispatch, rootState});

        expect(dispatchSpy.args).to.deep.equal([
            ["createTSRWaypointsDrawInteraction"]
        ]);
    });

    it("should closeTSR", async () => {
        await actionsTSR.closeTSR({state, getters, commit, dispatch, rootState});

        expect(dispatchSpy.args).to.deep.equal([
            ["removeMapInteractions"]
        ]);
    });

    describe("should addWaypoint", () => {
        it("without index", async () => {
            state.addStartEndPoint = 1;
            const waypoint = await actionsTSR.addWaypoint({state, getters, commit, dispatch, rootState}, {});

            expect(waypoints.length).equal(5);
            expect(waypoints[3]).equal(waypoint);
        });

        it("with index", async () => {
            const waypoint = await actionsTSR.addWaypoint({state, getters, commit, dispatch, rootState}, {
                index: 5
            });

            expect(waypoints.length).equal(5);
            expect(waypoints[3]).equal(waypoint);
        });

        it("with index in middle", async () => {
            const waypoint = await actionsTSR.addWaypoint({state, getters, commit, dispatch, rootState}, {
                index: 1
            });

            expect(waypoints.length).equal(5);
            expect(waypoints[3]).equal(waypoint);
        });

        it("with feature", async () => {
            const featurePoint = new Feature({
                    geometry: new Point([10, 10])
                }),
                waypoint = await actionsTSR.addWaypoint({state, getters, commit, dispatch, rootState}, {
                    feature: featurePoint
                });

            expect(waypoints.length).equal(5);
            expect(waypoints[3]).equal(waypoint);
        });

        it("with feature and waypoint without coordinates", async () => {
            waypoints[0].setCoordinates([]);

            state.tsrWaypointsSource = {
                removeFeature: sinon.spy()
            };

            const featurePoint = new Feature({
                    geometry: new Point([10, 10])
                }),
                waypoint = await actionsTSR.addWaypoint({state, getters, commit, dispatch, rootState}, {
                    feature: featurePoint
                });

            // equals 5 (new point is added) because the empty waypoint is the startpoint and it is not activated
            expect(waypoints.length).equal(5);
            expect(waypoints[3]).equal(waypoint);
        });

        it("with coordinates and fromExtern", async () => {
            state.tsrWaypointsSource = {
                addFeature: sinon.spy()
            };
            const waypoint = await actionsTSR.addWaypoint({state}, {
                index: 2,
                feature: null, displayName: "name",
                coordinates: [1, 2],
                fromExtern: true
            });

            expect(waypoints.length).equal(5);
            expect(waypoints[3]).equal(waypoint);
        });

        it("should not display default text in endpoint input field", async () => {
            // displays no displayName if last coordinate field is filled
            await actionsTSR.getTSRCoordinatesWgs84({state, getters, dispatch});
            expect(state.waypoints[state.waypoints.length - 1].displayName).equal(undefined);
        });

        it("should add startpoint with coordinates", async () => {
            state.addStartEndPoint = 0;
            const featurePoint = new Feature({
                geometry: new Point([10, 10])
            });

            actionsTSR.addWaypoint({state, getters, commit, dispatch, rootState}, {feature: featurePoint});

            expect(waypoints.length).equal(4);
            expect(waypoints[0].coordinates).to.deep.equal(featurePoint.getGeometry().getCoordinates());
        });

        it("should add endpoint with coordinates", async () => {
            state.addStartEndPoint = 2;
            const featurePoint = new Feature({
                geometry: new Point([10, 10])
            });

            actionsTSR.addWaypoint({state, getters, commit, dispatch, rootState}, {feature: featurePoint});

            expect(waypoints.length).equal(4);

            expect(waypoints[3].coordinates).to.deep.equal(featurePoint.getGeometry().getCoordinates());
        });
    });

    describe("should removeWaypoint", () => {
        it("with more than 2 waypoints", async () => {
            const firstWaypoint = new RoutingWaypoint({index: 0, source: tsrWaypointSource}),
                secondWaypoint = new RoutingWaypoint({index: 1, source: tsrWaypointSource}),
                thirdWaypoint = new RoutingWaypoint({index: 2, source: tsrWaypointSource});

            state.waypoints = [firstWaypoint, secondWaypoint, thirdWaypoint];
            await actionsTSR.removeWaypoint({state, getters, commit, dispatch, rootState}, {
                index: 1
            });

            expect(state.waypoints.length).equal(2);
            expect(thirdWaypoint.getIndex()).equal(1);
            expect(state.waypoints.includes(secondWaypoint)).to.be.false;

            expect(dispatchSpy.args).to.deep.equal([]);
        });

        it("with more than 2 waypoints and reload", async () => {
            const firstWaypoint = new RoutingWaypoint({index: 0, source: tsrWaypointSource}),
                secondWaypoint = new RoutingWaypoint({index: 1, source: tsrWaypointSource}),
                thirdWaypoint = new RoutingWaypoint({index: 2, source: tsrWaypointSource});

            state.waypoints = [firstWaypoint, secondWaypoint, thirdWaypoint];
            await actionsTSR.removeWaypoint({state, getters, commit, dispatch, rootState}, {
                index: 1,
                reload: true
            });

            expect(state.waypoints.length).equal(2);
            expect(thirdWaypoint.getIndex()).equal(1);
            expect(state.waypoints.includes(secondWaypoint)).to.be.false;
        });
        it("should remove first and last point if equal", async () => {

            const firstWaypoint = new RoutingWaypoint({index: 0, source: tsrWaypointSource, coordinates: [1, 2]}),
                secondWaypoint = new RoutingWaypoint({index: 1, source: tsrWaypointSource}),
                thirdWaypoint = new RoutingWaypoint({index: 2, source: tsrWaypointSource, coordinates: [1, 2]});

            state.waypoints = [firstWaypoint, secondWaypoint, thirdWaypoint];
            await actionsTSR.removeWaypoint({state, getters, commit, dispatch, rootState}, {
                index: 0,
                reload: true
            });

            expect(state.waypoints.length).equal(3);
            expect(thirdWaypoint.getIndex()).equal(2);
            expect(state.waypoints.includes(secondWaypoint)).to.be.true;
            expect(state.waypoints[0].getCoordinates()).to.deep.equal(state.waypoints[2].getCoordinates());
        });

    });

    describe("reset", () => {
        it("should dispatch 'removeWaypoint' at every waypoint - delete waypoint fromExtern", async () => {
            const firstWaypoint = new RoutingWaypoint({index: 0, source: tsrWaypointSource}),
                secondWaypoint = new RoutingWaypoint({index: 1, source: tsrWaypointSource}),
                thirdWaypoint = new RoutingWaypoint({index: 2, source: tsrWaypointSource, fromExtern: true});

            getters.waypoints = [firstWaypoint, secondWaypoint, thirdWaypoint];
            getters.tsrRouteSource = {
                getFeatures: sinon.stub().returns([])
            };
            await actionsTSR.reset({getters, commit, dispatch});
            expect(dispatchSpy.callCount).equal(3);
            expect(dispatchSpy.firstCall.args[0]).to.be.equals("removeWaypoint");
            expect(dispatchSpy.firstCall.args[1]).to.be.deep.equals({index: 2});
            expect(dispatchSpy.secondCall.args[0]).to.be.equals("removeWaypoint");
            expect(dispatchSpy.secondCall.args[1]).to.be.deep.equals({index: 1});
            expect(dispatchSpy.thirdCall.args[0]).to.be.equals("removeWaypoint");
            expect(dispatchSpy.thirdCall.args[1]).to.be.deep.equals({index: 0});
            expect(commitSpy.callCount).equal(1);
            expect(commitSpy.firstCall.args[0]).to.be.equals("setTsrDirections");
            expect(commitSpy.firstCall.args[1]).to.be.null;
            expect(getters.tsrRouteSource.getFeatures.callCount).equal(1);
        });
    });

    it("should initWaypoints", async () => {
        state.waypoints = [];
        await actionsTSR.initWaypoints({state, getters, commit, dispatch, rootState});

        expect(dispatchSpy.args).to.deep.equal([
            ["addWaypoint", {index: 0}],
            ["addWaypoint", {index: 1}]
        ]);
    });

    it("should initWaypoints - if one extern waypoint exists make only one new waypoint", async () => {
        state.waypoints = [{
            index: 0,
            feature: null,
            displayName: "name",
            coordinates: [1, 2],
            fromExtern: true
        }];
        await actionsTSR.initWaypoints({state, getters, commit, dispatch, rootState});

        expect(dispatchSpy.args).to.deep.equal([
            ["addWaypoint", {index: 1}]
        ]);
    });

    it("should onTSRWaypointsDrawEnd", async () => {
        const featurePoint = new Feature({
            geometry: new Point([10, 10])
        });

        await actionsTSR.onTSRWaypointsDrawEnd({state, getters, commit, dispatch, rootState}, {
            feature: featurePoint
        });

        expect(dispatchSpy.args).to.deep.equal([
            ["Modules/Routing/transformCoordinatesLocalToWgs84Projection", [10, 10], {root: true}],
            ["Modules/Routing/fetchTextByCoordinates", {coordinates: [10, 10]}, {root: true}],
            ["addWaypoint", {feature: featurePoint, displayName: "test"}]
        ]);
    });

    it("should removeMapInteractions", async () => {
        await actionsTSR.removeMapInteractions({state, getters, commit, dispatch, rootState});

        expect(dispatchSpy.args).to.deep.equal([
            ["removeTSRWaypointsDrawInteraction"]
        ]);
    });

    it("should order waypoints correctly", async () => {
        await actionsTSR.assignWaypointOrder({dispatch, state}, routingTSRResult);

        // check if waypoints have a correct index attribute.
        // the order is ascending because the waypoints are sorted  by
        // index in the end of assignWaypointOrder
        expect(state.waypoints[0].index).to.equal(0);
        expect(state.waypoints[1].index).to.equal(1);
        expect(state.waypoints[2].index).to.equal(2);
        expect(state.waypoints[3].index).to.equal(3);
    });

    it("should calculate round trip", async () => {
        const emptyWaypoint = new RoutingWaypoint({index: 2, source: tsrRouteSource});

        // create state.waypoints with two waypoints and last point is empty
        state.waypoints = [startPoint, waypoint1, emptyWaypoint];

        await actionsTSR.getTSRCoordinatesWgs84({state, getters, dispatch});

        // due to faking i18next, the display name is stored in an array
        expect(state.waypoints[state.waypoints.length - 1].displayName[0]).equal("common:modules.routing.tsr.tsrEndpoint");
        expect(state.waypoints[0].getCoordinates()).to.deep.equal(state.waypoints[2].getCoordinates());
    });
});
