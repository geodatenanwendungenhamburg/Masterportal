import * as stylePointCircle from "../../../../src/vectorStyle/styles/point/stylePointCircle";
import {Style, Circle} from "ol/style.js";

describe("stylePointCircle.js", () => {
    describe("createCirclePointStyle", () => {
        const attributes = {
            circleRadius: 15,
            circleFillColor: [10, 200, 100, 0.5],
            circleStrokeColor: [10, 200, 100, 0.5],
            circleStrokeWidth: 1
        };

        it("should create circle style", () => {
            expect(stylePointCircle.createCirclePointStyle(attributes)).toBeInstanceOf(Style);
            expect(stylePointCircle.createCirclePointStyle(attributes).getImage()).toBeInstanceOf(Circle);
            expect(stylePointCircle.createCirclePointStyle(attributes).getImage().getRadius()).toEqual(15);
        });
    });

    describe("createCircleClusterStyle", () => {
        const clusterAttributes = {
            clusterCircleRadius: 20,
            clusterCircleFillColor: [10, 200, 100, 0.5],
            clusterCircleStrokeColor: [10, 200, 100, 0.5],
            clusterCircleStrokeWidth: 1
        };

        it("should create circle cluster style", () => {
            expect(stylePointCircle.createCircleClusterStyle(clusterAttributes)).toBeInstanceOf(Style);
            expect(stylePointCircle.createCircleClusterStyle(clusterAttributes).getImage()).toBeInstanceOf(Circle);
            expect(stylePointCircle.createCircleClusterStyle(clusterAttributes).getImage().getRadius()).toEqual(20);
        });
    });

});