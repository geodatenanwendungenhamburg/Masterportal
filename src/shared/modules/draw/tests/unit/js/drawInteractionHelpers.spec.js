import {expect} from "chai";
import sinon from "sinon";
import drawInteraction from "@masterportal/masterportalapi/src/maps/interactions/drawInteraction.js";
import {
    createDrawInteractionContext,
    initializeTooltipElement,
    registerPointerMoveTooltip,
    isMeasurementDrawType,
    isStaticCircleDrawType,
    applyImageSymbolStyle,
    discardNextDrawnFeature
} from "@shared/modules/draw/js/drawInteractionHelpers.js";

describe("src/shared/modules/draw/js/drawInteractionHelpers.js", () => {
    let originalConfig;

    beforeEach(() => {
        originalConfig = globalThis.Config;
        globalThis.Config = {
            wfsImgPath: "/assets/"
        };
        mapCollection.clear();
        mapCollection.addMap({
            id: "ol",
            mode: "2D",
            addOverlay: sinon.spy(),
            removeOverlay: sinon.spy(),
            on: sinon.stub()
        }, "2D");
    });

    afterEach(() => {
        globalThis.Config = originalConfig;
        sinon.restore();
    });

    describe("createDrawInteractionContext", () => {
        it("positive: creates the draw interaction context with map, symbol and tooltip references", () => {
            const source = {},
                fakeInteraction = {id: "interaction"},
                iconList = [{id: "my-symbol", type: "image", value: "icon.svg"}];

            sinon.stub(drawInteraction, "createDrawInteraction").returns(fakeInteraction);

            const result = createDrawInteractionContext("my-symbol", source, iconList);

            expect(drawInteraction.createDrawInteraction.calledOnce).to.be.true;
            expect(drawInteraction.createDrawInteraction.firstCall.args[0]).to.equal("my-symbol");
            expect(drawInteraction.createDrawInteraction.firstCall.args[1]).to.equal(source);
            expect(drawInteraction.createDrawInteraction.firstCall.args[2]).to.equal(iconList);
            expect(drawInteraction.createDrawInteraction.firstCall.args[3]).to.equal("/assets/");
            expect(result.currentDrawInteraction).to.equal(fakeInteraction);
            expect(result.map).to.equal(mapCollection.getMap("2D"));
            expect(result.symbol).to.deep.equal(iconList[0]);
            expect(result.tooltipElement).to.be.instanceOf(HTMLDivElement);
            expect(result.tooltipOverlay).to.exist;
        });

        it("negative: returns an undefined symbol when draw type is not in icon list", () => {
            sinon.stub(drawInteraction, "createDrawInteraction").returns({id: "interaction"});

            const result = createDrawInteractionContext("unknown", {}, []);

            expect(result.symbol).to.be.undefined;
        });
    });

    describe("initializeTooltipElement", () => {
        it("positive: clears tooltip content and hides the element", () => {
            const tooltipElement = document.createElement("div");

            tooltipElement.innerHTML = "old";
            tooltipElement.style.display = "block";

            initializeTooltipElement(tooltipElement);

            expect(tooltipElement.innerHTML).to.equal("");
            expect(tooltipElement.style.display).to.equal("none");
        });

        it("negative: keeps tooltip hidden when it is already reset", () => {
            const tooltipElement = document.createElement("div");

            tooltipElement.innerHTML = "";
            tooltipElement.style.display = "none";

            initializeTooltipElement(tooltipElement);

            expect(tooltipElement.innerHTML).to.equal("");
            expect(tooltipElement.style.display).to.equal("none");
        });
    });

    describe("registerPointerMoveTooltip", () => {
        it("positive: adds overlay and updates tooltip position while pointer moves", () => {
            const addOverlaySpy = sinon.spy(),
                setPositionSpy = sinon.spy(),
                map = {
                    addOverlay: addOverlaySpy,
                    on: sinon.stub().callsFake((eventName, callback) => {
                        callback({dragging: false, coordinate: [1, 2]});
                        return "pointer-key";
                    })
                },
                overlay = {setPosition: setPositionSpy};

            const key = registerPointerMoveTooltip(map, overlay);

            expect(addOverlaySpy.calledOnceWithExactly(overlay)).to.be.true;
            expect(map.on.calledOnce).to.be.true;
            expect(map.on.firstCall.args[0]).to.equal("pointermove");
            expect(setPositionSpy.calledOnceWithExactly([1, 2])).to.be.true;
            expect(key).to.equal("pointer-key");
        });

        it("negative: does not update tooltip position while map is dragged", () => {
            const setPositionSpy = sinon.spy(),
                map = {
                    addOverlay: sinon.spy(),
                    on: sinon.stub().callsFake((eventName, callback) => {
                        callback({dragging: true, coordinate: [3, 4]});
                        return "pointer-key";
                    })
                },
                overlay = {setPosition: setPositionSpy};

            registerPointerMoveTooltip(map, overlay);

            expect(setPositionSpy.called).to.be.false;
        });
    });

    describe("isMeasurementDrawType", () => {
        it("positive: returns true for measurement draw types", () => {
            expect(isMeasurementDrawType("circle")).to.be.true;
            expect(isMeasurementDrawType("line")).to.be.true;
        });

        it("negative: returns false for non measurement draw types", () => {
            expect(isMeasurementDrawType("writeText")).to.be.false;
            expect(isMeasurementDrawType(undefined)).to.be.false;
        });
    });

    describe("isStaticCircleDrawType", () => {
        it("positive: returns true for static circle draw types", () => {
            expect(isStaticCircleDrawType("circle")).to.be.true;
            expect(isStaticCircleDrawType("doubleCircle")).to.be.true;
        });

        it("negative: returns false for non static circle draw types", () => {
            expect(isStaticCircleDrawType("polygon")).to.be.false;
            expect(isStaticCircleDrawType(null)).to.be.false;
        });
    });

    describe("applyImageSymbolStyle", () => {
        it("positive: prepends image path for relative symbol values", () => {
            const feature = {setStyle: sinon.spy()},
                symbol = {value: "symbol.svg", scale: 2};

            applyImageSymbolStyle(feature, symbol);

            expect(feature.setStyle.calledOnce).to.be.true;
            const style = feature.setStyle.firstCall.args[0];

            expect(style.getImage().getSrc()).to.equal("/assets/symbol.svg");
            expect(style.getImage().getScale()).to.equal(2);
        });

        it("negative: keeps absolute symbol values unchanged", () => {
            const feature = {setStyle: sinon.spy()},
                symbol = {value: "/img/symbol.svg"};

            applyImageSymbolStyle(feature, symbol);

            const style = feature.setStyle.firstCall.args[0];

            expect(style.getImage().getSrc()).to.equal("/img/symbol.svg");
            expect(style.getImage().getScale()).to.equal(1);
        });
    });

    describe("discardNextDrawnFeature", () => {
        it("positive: removes the next added feature", () => {
            let callback;
            const feature = {id: "f1"},
                source = {
                    once: sinon.stub().callsFake((eventName, cb) => {
                        callback = cb;
                    }),
                    removeFeature: sinon.spy()
                };

            discardNextDrawnFeature(source);
            callback({feature});

            expect(source.once.calledOnceWithExactly("addfeature", sinon.match.func)).to.be.true;
            expect(source.removeFeature.calledOnceWithExactly(feature)).to.be.true;
        });

        it("negative: does not remove features before addfeature callback runs", () => {
            const source = {
                once: sinon.stub(),
                removeFeature: sinon.spy()
            };

            discardNextDrawnFeature(source);

            expect(source.once.calledOnce).to.be.true;
            expect(source.removeFeature.called).to.be.false;
        });
    });
});
