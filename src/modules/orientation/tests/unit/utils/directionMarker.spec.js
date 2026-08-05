import {expect} from "chai";
import {
    toHeadingDegrees,
    resolveHeading,
    getMarkerDirectionStyle
} from "@modules/controls/orientation/utils/directionMarker.js";

describe("src/modules/controls/orientation/utils/directionMarker.js", () => {
    describe("toHeadingDegrees", () => {
        it("converts PI/2 radians to 90 degrees", () => {
            expect(toHeadingDegrees(Math.PI / 2)).to.equal(90);
        });

        it("wraps negative radians to 0-360 range", () => {
            expect(toHeadingDegrees(-Math.PI / 2)).to.equal(270);
        });
    });

    describe("resolveHeading", () => {
        it("returns heading when finite", () => {
            expect(resolveHeading(1.5)).to.equal(1.5);
        });

        it("returns null when heading is null", () => {
            expect(resolveHeading(null)).to.be.null;
        });
    });

    describe("getMarkerDirectionStyle", () => {
        it("returns empty object when showDirection is false", () => {
            expect(getMarkerDirectionStyle(false, Math.PI / 2)).to.deep.equal({});
        });

        it("returns empty object when heading is null", () => {
            expect(getMarkerDirectionStyle(true, null)).to.deep.equal({});
        });

        it("returns style object with correct angle for valid heading and showDirection true", () => {
            const style = getMarkerDirectionStyle(true, Math.PI / 2);

            expect(style).to.have.property("--marker-heading-angle");
            expect(style["--marker-heading-angle"]).to.equal("90deg");
        });

        it("returns style object with wrapped angle for negative heading", () => {
            const style = getMarkerDirectionStyle(true, -Math.PI / 2);

            expect(style["--marker-heading-angle"]).to.equal("270deg");
        });
    });
});
