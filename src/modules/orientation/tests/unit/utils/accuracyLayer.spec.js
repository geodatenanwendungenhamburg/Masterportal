import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import {Circle} from "ol/geom.js";
import {
    createAccuracyFeature,
    initAccuracyLayer,
    updateAccuracyGeometry,
    clearAccuracyGeometry,
    removeAccuracyLayer
} from "@modules/orientation/utils/accuracyLayer.js";

describe("src/modules/orientation/utils/accuracyLayer.js", () => {
    describe("createAccuracyFeature", () => {
        it("creates an ol/Feature instance", () => {
            const feature = createAccuracyFeature();

            expect(feature).to.be.instanceOf(Feature);
        });
    });

    describe("initAccuracyLayer", () => {
        let mapMock;

        beforeEach(() => {
            mapMock = {addLayer: sinon.stub()};
        });

        it("creates and adds a new accuracy layer if none exists yet", () => {
            const accuracyFeature = createAccuracyFeature(),
                result = initAccuracyLayer({accuracyFeature, accuracyLayer: null, map: mapMock});

            expect(result.accuracyLayer).to.exist;
            expect(mapMock.addLayer.calledOnceWith(result.accuracyLayer)).to.be.true;
        });

        it("returns the existing layer without creating a new one", () => {
            const existingLayer = {id: "existing"},
                result = initAccuracyLayer({accuracyFeature: createAccuracyFeature(), accuracyLayer: existingLayer, map: mapMock});

            expect(result.accuracyLayer).to.equal(existingLayer);
            expect(mapMock.addLayer.called).to.be.false;
        });
    });

    describe("updateAccuracyGeometry", () => {
        it("transforms and sets the accuracy geometry if enabled and geolocation available", () => {
            const accuracyFeature = createAccuracyFeature(),
                accuracyGeometry = new Circle([100, 200], 5),
                geolocation = {getAccuracyGeometry: () => accuracyGeometry};

            updateAccuracyGeometry({
                showAccuracy: true,
                geolocation,
                projectionCode: "EPSG:4326",
                accuracyFeature
            });

            expect(accuracyFeature.getGeometry()).to.exist;
        });

        it("does nothing if showAccuracy is false", () => {
            const accuracyFeature = createAccuracyFeature();
            const initialGeometry = new Circle([0, 0], 1);

            accuracyFeature.setGeometry(initialGeometry);

            updateAccuracyGeometry({
                showAccuracy: false,
                geolocation: {getAccuracyGeometry: sinon.stub()},
                projectionCode: "EPSG:4326",
                accuracyFeature
            });

            expect(accuracyFeature.getGeometry()).to.equal(initialGeometry);
        });

        it("does nothing if geolocation is null", () => {
            const accuracyFeature = createAccuracyFeature();
            const initialGeometry = new Circle([0, 0], 1);

            accuracyFeature.setGeometry(initialGeometry);

            updateAccuracyGeometry({
                showAccuracy: true,
                geolocation: null,
                projectionCode: "EPSG:4326",
                accuracyFeature
            });

            expect(accuracyFeature.getGeometry()).to.equal(initialGeometry);
        });
    });

    describe("clearAccuracyGeometry", () => {
        it("removes the listener and clears the feature geometry", () => {
            const accuracyFeature = createAccuracyFeature(),
                listener = sinon.stub(),
                geolocation = {un: sinon.stub()};

            accuracyFeature.setGeometry(new Circle([0, 0], 1));

            clearAccuracyGeometry({geolocation, accuracyFeature, listener});

            expect(geolocation.un.calledOnceWith("change:accuracyGeometry", listener)).to.be.true;
            expect(accuracyFeature.getGeometry()).to.be.null;
        });

        it("still clears the feature geometry if geolocation is null", () => {
            const accuracyFeature = createAccuracyFeature();

            accuracyFeature.setGeometry(new Circle([0, 0], 1));

            clearAccuracyGeometry({geolocation: null, accuracyFeature, listener: sinon.stub()});

            expect(accuracyFeature.getGeometry()).to.be.null;
        });
    });

    describe("removeAccuracyLayer", () => {
        it("removes the given accuracy layer from the map", () => {
            const mapMock = {removeLayer: sinon.stub()},
                accuracyLayer = {id: "layer"};

            removeAccuracyLayer({accuracyLayer, map: mapMock});

            expect(mapMock.removeLayer.calledOnceWith(accuracyLayer)).to.be.true;
        });

        it("does nothing if accuracyLayer is null", () => {
            const mapMock = {removeLayer: sinon.stub()};

            removeAccuracyLayer({accuracyLayer: null, map: mapMock});

            expect(mapMock.removeLayer.called).to.be.false;
        });
    });
});
