import {expect} from "chai";

import mutations from "@modules/measure/store/mutationsMeasure.js";

const {addFeature, addUnlistener, removeFeature, setCustomName, removeCustomName} = mutations;

describe("src/modules/measure/store/mutationsMeasure", function () {
    describe("addFeature", function () {
        it("adds LineString measurements to lines object by key", function () {
            const lines = {0: {}, 1: {}, 2: {}},
                state = {
                    selectedGeometry: "LineString",
                    lines
                };

            addFeature(state, {ol_uid: "id"});

            expect(state.lines).not.to.equal(lines);
            expect(state.lines).to.deep.equal({0: {}, 1: {}, 2: {}, id: {ol_uid: "id"}});
        });


        it("adds Polygon measurements to polygon object by key", function () {
            const polygons = {0: {}, 1: {}, 2: {}},
                state = {
                    selectedGeometry: "Polygon",
                    polygons
                };

            addFeature(state, {ol_uid: "id"});

            expect(state.polygons).not.to.equal(polygons);
            expect(state.polygons).to.deep.equal({0: {}, 1: {}, 2: {}, id: {ol_uid: "id"}});
        });
    });


    describe("addUnlistener", function () {
        it("adds payload as last element to new spread array", function () {
            const unlisteners = [0, 1, 2],
                state = {unlisteners};

            addUnlistener(state, 3);

            expect(state.unlisteners).not.to.equal(unlisteners);
            expect(state.unlisteners).to.deep.equal([0, 1, 2, 3]);
        });
    });

    describe("removeFeature", function () {
        it("removes feature from lines and polygons by normalized ID", function () {
            const state = {
                lines: {"123": {ol_uid: "123"}, "456": {ol_uid: "456"}},
                polygons: {"789": {ol_uid: "789"}},
                customNames: {"123": "My Line", "789": "My Polygon"}
            };

            removeFeature(state, "123");

            expect(state.lines).to.deep.equal({"456": {ol_uid: "456"}});
            expect(state.customNames).to.deep.equal({"789": "My Polygon"});
        });
    });

    describe("setCustomName", function () {
        it("sets a custom name for a feature", function () {
            const state = {
                customNames: {}
            };

            setCustomName(state, {featureId: "123", name: "Custom Name"});

            expect(state.customNames).to.deep.equal({"123": "Custom Name"});
        });

        it("updates an existing custom name", function () {
            const state = {
                customNames: {"123": "Old Name"}
            };

            setCustomName(state, {featureId: "123", name: "New Name"});

            expect(state.customNames).to.deep.equal({"123": "New Name"});
        });
    });

    describe("removeCustomName", function () {
        it("removes a custom name for a feature", function () {
            const state = {
                customNames: {"123": "Custom Name", "456": "Another Name"}
            };

            removeCustomName(state, "123");

            expect(state.customNames).to.deep.equal({"456": "Another Name"});
        });

        it("does nothing if custom name does not exist", function () {
            const state = {
                customNames: {"123": "Custom Name"}
            };

            removeCustomName(state, "999");

            expect(state.customNames).to.deep.equal({"123": "Custom Name"});
        });
    });
});
