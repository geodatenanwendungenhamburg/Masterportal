import {expect} from "chai";
import sinon from "sinon";
import {createCustomPositionMarker, removeCustomPositionMarker} from "@modules/orientation/utils/customPositionMarker.js";

describe("src/modules/orientation/utils/customPositionMarker.js", () => {
    let mapMock, originalMapCollection;

    beforeEach(() => {
        mapMock = {
            addOverlay: sinon.stub(),
            removeOverlay: sinon.stub()
        };
        originalMapCollection = globalThis.mapCollection;
        globalThis.mapCollection = {
            getMap: sinon.stub().returns(mapMock)
        };
    });

    afterEach(() => {
        globalThis.mapCollection = originalMapCollection;
        sinon.restore();
    });

    describe("createCustomPositionMarker", () => {
        it("creates an overlay at the given position and adds it to the 2D map", () => {
            const overlay = createCustomPositionMarker([100, 200]);

            expect(mapMock.addOverlay.calledOnce).to.be.true;
            expect(mapMock.addOverlay.firstCall.args[0]).to.equal(overlay);
            expect(overlay.getPosition()).to.deep.equal([100, 200]);
        });

        it("still creates an overlay if no position is given", () => {
            const overlay = createCustomPositionMarker(undefined);

            expect(mapMock.addOverlay.calledOnce).to.be.true;
            expect(overlay.getPosition()).to.be.undefined;
        });
    });

    describe("removeCustomPositionMarker", () => {
        it("removes the given overlay from the 2D map", () => {
            const overlay = createCustomPositionMarker([1, 2]);

            removeCustomPositionMarker(overlay);

            expect(mapMock.removeOverlay.calledOnceWith(overlay)).to.be.true;
        });

        it("does nothing if no overlay is given", () => {
            removeCustomPositionMarker(null);

            expect(mapMock.removeOverlay.called).to.be.false;
        });
    });
});
