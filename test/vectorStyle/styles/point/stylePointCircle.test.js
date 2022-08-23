import * as stylePointCircle from "../../../../src/vectorStyle/styles/point/stylePointCircle";
import {Style, Circle} from "ol/style.js";

describe("stylePointCircle.js", () => {
    describe("createCircleStyle", () => {
        const attributes = {
                circleRadius: 15,
                circleFillColor: [10, 200, 100, 0.5],
                circleStrokeColor: [10, 200, 100, 0.5],
                circleStrokeWidth: 1
            },
            clusterAttributes = {
                clusterCircleRadius: 20,
                clusterCircleFillColor: [10, 200, 100, 0.5],
                clusterCircleStrokeColor: [10, 200, 100, 0.5],
                clusterCircleStrokeWidth: 1
            };

        it("should create circle style", () => {
            expect(stylePointCircle.createCircleStyle(attributes, false)).toBeInstanceOf(Style);
            expect(stylePointCircle.createCircleStyle(attributes, false).getImage()).toBeInstanceOf(Circle);
            expect(stylePointCircle.createCircleStyle(attributes, false).getImage().getRadius()).toEqual(15);
        });
        it("should create circle cluster style", () => {
            expect(stylePointCircle.createCircleStyle(clusterAttributes, true)).toBeInstanceOf(Style);
            expect(stylePointCircle.createCircleStyle(clusterAttributes, true).getImage()).toBeInstanceOf(Circle);
            expect(stylePointCircle.createCircleStyle(clusterAttributes, true).getImage().getRadius()).toEqual(20);
        });
    });
});