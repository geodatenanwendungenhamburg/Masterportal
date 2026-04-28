import {expect} from "chai";
import sinon from "sinon";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import scaleOutOfRangeMixin from "@shared/mixins/scaleOutOfRangeMixin.js";

describe("scaleOutOfRangeMixin", () => {
    const containerName = "MrObject";
    let mixin, context, i18nArgs, conf, setVisibleSpy;

    beforeEach(() => {
        mixin = scaleOutOfRangeMixin(containerName);
        conf = {};

        context = {
            [containerName]: {id: "1337-42", details: "arbitrary"},
            $t: sinon.stub().callsFake((key, args) => {
                i18nArgs = {key, args};
                return i18nArgs;
            }),
            scale: 5000,
            mode: "2D",
            conf,
            layerConfigById: sinon.stub().returns(conf)
        };
        setVisibleSpy = sinon.spy();
        sinon.stub(layerCollection, "getLayerById").callsFake(() => {
            return {
                layer: {
                    setVisible: setVisibleSpy
                },
                attributes: {}
            };
        });

        sinon.stub(rawLayerList, "getLayerWhere");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("computed#rawLayers", () => {
        it("returns found raw layers", () => {
            rawLayerList.getLayerWhere
                .withArgs({id: "1337"}).returns({id: "1337", stuff: "lots"})
                .withArgs({id: "42"}).returns({id: "42", stuff: "loads"});
            expect(mixin.computed.rawLayers.call(context)).to.deep.equal([{id: "1337", stuff: "lots"}, {id: "42", stuff: "loads"}]);
        });

        it("skips unknown layers", () => {
            rawLayerList.getLayerWhere
                .withArgs({id: "1337"}).returns(null)
                .withArgs({id: "42"}).returns({id: "42", stuff: "lots"});
            expect(mixin.computed.rawLayers.call(context)).to.deep.equal([{id: "42", stuff: "lots"}]);
        });

        it("returns an empty array if the container id is undefined", () => {
            context[containerName].id = undefined;
            expect(mixin.computed.rawLayers.call(context)).to.deep.equal([]);
        });
    });

    describe("computed#rawLayersScaleBoundaries", () => {
        it("returns overarching minScale and maxScale across layers", () => {
            context.rawLayers = [
                {minScale: "1000", maxScale: "8000"},
                {minScale: "5000", maxScale: "6000"},
                {minScale: "2000", maxScale: "10000"}
            ];
            context.layerConfigById = sinon.stub().returns(null);
            expect(mixin.computed.rawLayersScaleBoundaries.call(context)).to.deep.equal([1000, 10000]);
        });

        it("skips unparsable and/or missing values", () => {
            context.rawLayers = [
                {},
                {minScale: "NaN", maxScale: "5000"},
                {minScale: "500"},
                {},
                {maxScale: "and large fries with extra mayonnaise"},
                {minScale: "1000", maxScale: "10000"},
                {}
            ];
            context.layerConfigById = sinon.stub().returns(null);
            expect(mixin.computed.rawLayersScaleBoundaries.call(context)).to.deep.equal([500, 10000]);
        });

        it("returns [undefined, undefined] if no scales are available", () => {
            context.rawLayers = [{}, {}, {}];
            expect(mixin.computed.rawLayersScaleBoundaries.call(context)).to.deep.equal([undefined, undefined]);
        });

        it("returns [undefined, undefined] if no layers are available", () => {
            context.rawLayers = [];
            expect(mixin.computed.rawLayersScaleBoundaries.call(context)).to.deep.equal([undefined, undefined]);
        });
    });

    describe("computed#tooltipText", () => {
        it("returns full tooltip when both minScale and maxScale are defined", () => {
            context.rawLayersScaleBoundaries = [1000, 10000];
            mixin.computed.tooltipText.call(context);
            expect(i18nArgs).to.deep.equals(
                {
                    "args": {
                        "maxScale": "1: 10.000",
                        "minScale": "1: 1.000"
                    },
                    "key": "common:modules.layerTree.invisibleLayer"
                }
            );
        });

        it("returns another tooltip if only maxScale is defined", () => {
            context.rawLayersScaleBoundaries = [undefined, 10000];
            mixin.computed.tooltipText.call(context);
            expect(i18nArgs).to.deep.equals(
                {
                    "args": {
                        "maxScale": "1: 10.000"
                    },
                    "key": "common:modules.layerTree.invisibleLayerMaxScale"
                }
            );
        });

        it("returns another tooltip if only minScale is defined", () => {
            context.rawLayersScaleBoundaries = [10000, undefined];
            mixin.computed.tooltipText.call(context);
            expect(i18nArgs).to.deep.equals(
                {
                    "args": {
                        "minScale": "1: 10.000"
                    },
                    "key": "common:modules.layerTree.invisibleLayerMinScale"
                }
            );
        });

        it("returns empty string if neither is defined", () => {
            context.rawLayersScaleBoundaries = [undefined, undefined];
            expect(mixin.computed.tooltipText.call(context)).to.equal("");
            expect(context.$t.called).to.be.false;
        });

        it("returns tooltip from container minScale/maxScale if rawLayersScaleBoundaries are not available", () => {
            context[containerName].minScale = "1000";
            context[containerName].maxScale = "10000";
            context.rawLayersScaleBoundaries = [undefined, undefined];
            context.scales = [500, 1000, 10000, 20000, 100000];

            mixin.computed.tooltipText.call(context);

            expect(i18nArgs).to.deep.equals({
                args: {
                    minScale: "1: 1.000",
                    maxScale: "1: 10.000"
                },
                key: "common:modules.layerTree.invisibleLayer"
            });
        });
    });

    describe("computed#scaleIsOutOfRange - 2D", () => {
        it("returns true when the scale is too small", () => {
            context.rawLayersScaleBoundaries = [7500, 10000];
            context.scale = 5000;
            context.rawLayers = [
                {minScale: "7500", maxScale: "10000"}
            ];
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.true;
        });

        it("returns true when the scale is too large", () => {
            context.rawLayersScaleBoundaries = [1000, 2500];
            context.scale = 5000;
            context.rawLayers = [
                {minScale: "1000", maxScale: "2500"}
            ];
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.true;
        });

        it("returns false when within range", () => {
            context.rawLayersScaleBoundaries = [1000, 10000];
            context.scale = 5000;
            context.rawLayers = [
                {minScale: "1000", maxScale: "10000"}
            ];
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.false;
        });

        it("uses container minScale/maxScale if rawLayers do not contain scale boundaries", () => {
            context[containerName].minScale = "1000";
            context[containerName].maxScale = "2500";
            context.scale = 5000;
            context.rawLayers = [
                {id: "1337"}
            ];

            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.true;
        });
    });

    describe("computed#scaleIsOutOfRange - 3D", () => {
        it("conf.maxScale is set, is mapMode = 3D, is not in scale -> set 2D layer visible to false", () => {
            conf.attributes = {};
            conf.attributes.is3DLayer = false;
            conf.visibility = true;
            context.mode = "3D";
            context.rawLayersScaleBoundaries = [0, 10000];
            context.scales = [500, 1000, 10000, 20000, 100000];
            context.scale = 20000;
            context.rawLayers = [
                {minScale: "0", maxScale: "10000"}
            ];
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.true;
            expect(setVisibleSpy.calledOnce).to.be.true;
            expect(setVisibleSpy.firstCall.args[0]).to.be.false;
        });

        it("conf.maxScale is set, is mapMode = 3D, is not in scale -> set 3D layer visible to false", () => {
            conf.attributes = {};
            conf.attributes.is3DLayer = true;
            conf.visibility = true;
            context.mode = "3D";
            context.rawLayersScaleBoundaries = [0, 10000];
            context.scales = [500, 1000, 10000, 20000, 100000];
            context.scale = 20000;
            context.rawLayers = [
                {minScale: "0", maxScale: "10000"}
            ];
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.true;
            expect(setVisibleSpy.calledOnce).to.be.true;
            expect(setVisibleSpy.firstCall.args[0]).to.be.false;
        });

        it("conf.maxScale is set, is mapMode = 3D, is in scale -> set 2D layer visible to true", () => {
            conf.attributes = {};
            conf.attributes.is3DLayer = false;
            conf.visibility = true;
            context.mode = "3D";
            context.rawLayersScaleBoundaries = [0, 10000];
            context.scales = [500, 1000, 10000, 20000, 100000];
            context.scale = 5000;
            context.rawLayers = [
                {minScale: "0", maxScale: "10000"}
            ];
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.false;
            expect(setVisibleSpy.calledOnce).to.be.true;
            expect(setVisibleSpy.firstCall.args[0]).to.be.true;
        });

        it("conf.maxScale is set, is mapMode = 3D, is in scale -> set 3D layer visible to true", () => {
            conf.attributes = {};
            conf.attributes.is3DLayer = true;
            conf.visibility = true;
            context.mode = "3D";
            context.rawLayersScaleBoundaries = [0, 10000];
            context.scales = [500, 1000, 10000, 20000, 100000];
            context.scale = 5000;
            context.rawLayers = [
                {minScale: "0", maxScale: "10000"}
            ];
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.false;
            expect(setVisibleSpy.calledOnce).to.be.true;
            expect(setVisibleSpy.firstCall.args[0]).to.be.true;
        });

    });

    it("in 3D sets visibility even if conf.visibility is undefined", () => {
        conf.minScale = "0";
        conf.maxScale = "10000";
        conf.attributes = {is3DLayer: false};
        context.mode = "3D";
        context.scale = 20000;
        context.rawLayers = [
            {id: "1337", minScale: "0", maxScale: "10000"}
        ];

        expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.true;
        expect(setVisibleSpy.calledOnce).to.be.true;
        expect(setVisibleSpy.firstCall.args[0]).to.be.false;
    });


});
