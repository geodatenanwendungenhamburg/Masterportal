import {expect} from "chai";
import {toHeadingDegrees, resolveHeading, getMarkerDirectionStyle} from "@modules/orientation/utils/directionMarker.js";

describe("src/modules/orientation/utils/directionMarker.js", () => {
    describe("toHeadingDegrees", () => {
        it("converts a positive radian heading into degrees", () => {
            expect(toHeadingDegrees(Math.PI)).to.equal(180);
        });

        it("normalizes a negative radian heading into the 0-360 range", () => {
            expect(toHeadingDegrees(-Math.PI / 2)).to.equal(270);
        });
    });

    describe("resolveHeading", () => {
        it("returns the given heading if it is a finite number", () => {
            expect(resolveHeading(1.23)).to.equal(1.23);
        });

        it("returns null if the heading is not a finite number", () => {
            expect(resolveHeading(undefined)).to.be.null;
            expect(resolveHeading(null)).to.be.null;
            expect(resolveHeading(NaN)).to.be.null;
        });
    });

    describe("getMarkerDirectionStyle", () => {
        it("returns a style object with the heading angle css variable", () => {
            const style = getMarkerDirectionStyle(true, Math.PI);

            expect(style).to.deep.equal({"--marker-heading-angle": "180deg"});
        });

        it("returns an empty object if showDirection is false", () => {
            expect(getMarkerDirectionStyle(false, Math.PI)).to.deep.equal({});
        });

        it("returns an empty object if heading is not a finite number", () => {
            expect(getMarkerDirectionStyle(true, null)).to.deep.equal({});
        });
    });
});
