import {createRegularShapeStyle} from "../../../../src/vectorStyle/styles/point/stylePointRegularShape";
import {Style, RegularShape} from "ol/style.js";

describe("createRegularShapeStyle", function () {
    it("should create RegularShape style", function () {
        const attributes = {
            rsRadius: 10,
            rsRadius2: 10,
            rsPoints: 3,
            rsAngle: 10,
            rotation: 0,
            rsScale: 1,
            rsFillColor: [10, 200, 100, 0.5],
            rsStrokeColor: [10, 200, 100],
            rsStrokeWidth: 5
        };

        expect(createRegularShapeStyle(attributes)).toBeInstanceOf(Style);
        expect(createRegularShapeStyle(attributes).getImage()).toBeInstanceOf(RegularShape);
        expect(createRegularShapeStyle(attributes).getImage().getRadius()).toEqual(10);
        expect(createRegularShapeStyle(attributes).getImage().getPoints()).toEqual(3);
        expect(createRegularShapeStyle(attributes).getImage().getAngle()).toEqual(10);
    });
});