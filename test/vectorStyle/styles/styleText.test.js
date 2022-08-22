import TextStyleModel from "../../../src/vectorStyle/styles/styleText";
import {Text} from "ol/style.js";

describe("styleText", () => {
    const feature = {
            geometryName: "geom",
            id: "DE.HH.UP_GESUNDHEIT_KRANKENHAEUSER_2",
            get: () => {
                return [1, 2, 3];
            },
            getProperties: () => {
                return feature;
            }
        },
        style = {
            type: "icon",
            clusterType: "icon",
            legendValue: "Krankenhaus",
            imageName: "krankenhaus.png"
        },
        isClustered = false,
        styleTextClass = new TextStyleModel(feature, style, isClustered);

    styleTextClass.initialize(feature, style, isClustered);

    describe("initialize", function () {
        it("returns an instance of openlayers style", () => {
            expect(typeof styleTextClass.initialize).toBe("function");
        });
    });

    describe("getStyle", function () {
        it("returns an instance of openlayers style", () => {
            expect(styleTextClass.getStyle()).toBeInstanceOf(Text);
        });
    });

    describe("createClusteredTextStyle", function () {
        it("returns an instance of openlayers style", () => {
            expect(styleTextClass.createClusteredTextStyle()).toBeInstanceOf(Text);
        });
    });

    describe("createLabeledTextStyle", function () {
        it("returns an instance of openlayers style", () => {
            expect(styleTextClass.createLabeledTextStyle()).toBeInstanceOf(Text);
        });
    });
});
