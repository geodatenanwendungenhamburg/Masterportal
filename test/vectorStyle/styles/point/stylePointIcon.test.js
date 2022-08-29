import * as stylePointIcon from "../../../../src/vectorStyle/styles/point/stylePointIcon";
import {Style, Icon} from "ol/style.js";

describe("stylePointIcon.js", () => {
    describe("getRotationValue", function () {
        it("should return correct rotation value", function () {
            expect(stylePointIcon.getRotationValue({isDegree: true, value: "90"})).toEqual(1.5707963267948966);
            expect(stylePointIcon.getRotationValue({isDegree: false, value: "10"})).toEqual(10);
            expect(stylePointIcon.getRotationValue()).toEqual(0);
        });
        it("should return correct rotation value from an object path", function () {
            const featureValues = {
                geometryName: "geom",
                id: "DE.HH.UP_GESUNDHEIT_KRANKENHAEUSER_2",
                angle: 45
            };

            expect(stylePointIcon.getRotationValue({isDegree: false, value: "@angle"}, featureValues)).toEqual(45);
        });
    });
    describe("createIconStyle", () => {
        const attributes = {
                imagePath: "/imagePath",
                imageName: "bild.svg",
                imageWidth: 10,
                imageHeight: 20,
                imageScale: 1,
                imageOffsetX: 0,
                imageOffsetY: 0,
                imageOffsetXUnit: "px",
                imageOffsetYUnit: "px",
                rotation: 0
            },
            clusterAttributes = {
                clusterImageName: "bild.svg",
                clusterImageWidth: 10,
                clusterImagePath: "/imagePath",
                clusterImageHeight: 20,
                clusterImageScale: 1
            },
            feature = {
                getProperties: () => {
                    return {
                        name: "singleFeature",
                        id: "123"
                    };
                }
            },
            clusteredFeature = {
                get: () => {
                    return [
                        {
                            name: "singleFeature1",
                            id: "123"
                        },
                        {
                            name: "singleFeature2",
                            id: "456"
                        }
                    ];
                }
            };

        it("should create icon point style", () => {
            expect(stylePointIcon.createIconStyle(attributes, feature, false)).toBeInstanceOf(Style);
            expect(stylePointIcon.createIconStyle(clusterAttributes, clusteredFeature, true)).toBeInstanceOf(Style);
            expect(stylePointIcon.createIconStyle(attributes, feature, false).getImage()).toBeInstanceOf(Icon);
            expect(stylePointIcon.createIconStyle(attributes, feature, false).getImage().getScale()).toEqual(1);
        });
        it("should create cluster icon point style", () => {
            expect(stylePointIcon.createIconStyle(clusterAttributes, clusteredFeature, true)).toBeInstanceOf(Style);
            expect(stylePointIcon.createIconStyle(clusterAttributes, clusteredFeature, true).getImage()).toBeInstanceOf(Icon);
        });
    });

    describe("createSVGStyle", function () {
        it("should create icon point style", function () {
            expect(stylePointIcon.createSVGStyle("test")).toBeInstanceOf(Style);
            expect(stylePointIcon.createSVGStyle("test").getImage()).toBeInstanceOf(Icon);
            expect(stylePointIcon.createSVGStyle("test").getImage().getSrc()).toEqual("data:image/svg+xml;charset=utf-8,test");
        });
    });
});