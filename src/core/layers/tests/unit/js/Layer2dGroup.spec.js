import {expect} from "chai";
import sinon from "sinon";
import {Group as LayerGroup} from "ol/layer.js";
import VectorLayer from "ol/layer/Vector.js";
import layerFactory from "@core/layers/js/layerFactory";
import Layer2d from "@core/layers/js/layer2d";
import Layer2dGroup from "@core/layers/js/layer2dGroup";

describe("src/core/js/layers/Layer2dGroup.js", () => {
    let warn,
        attributes,
        layerWMS,
        layerWMS2,
        layerWMS3,
        layerFactorySpy,
        updateLayerValuesStub;

    beforeEach(() => {
        warn = sinon.spy();
        updateLayerValuesStub = sinon.stub();
        sinon.stub(console, "warn").callsFake(warn);
        layerFactorySpy = sinon.stub(layerFactory, "createLayer")
            .callsFake((props) => {
                return {
                    attributes: props,
                    getLayer: () => {
                        return new VectorLayer();
                    },
                    getLayerSource: sinon.stub(),
                    updateLayerValues: updateLayerValuesStub
                };
            });
        layerWMS = {
            id: "WMS",
            name: "layerWMS",
            typ: "WMS"
        };
        layerWMS2 = {
            id: "WMS2",
            name: "layerWMS2",
            typ: "WMS"
        };
        layerWMS3 = {
            id: "WMS3",
            name: "layerWMS3",
            typ: "WMS",
            autoRefresh: 50000
        };
        attributes = {
            id: "1,2",
            name: "groupLayer",
            typ: "GROUP",
            type: "layer",
            children: [
                layerWMS,
                layerWMS2
            ]
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("createLayer", () => {
        it("new Layer2dGroup without children shall call warn", () => {
            attributes.children = undefined;
            const groupLayer = new Layer2dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(warn.calledOnce).to.be.true;
        });
        it("new Layer2dGroup with attributes should create an layer with 2 grouped layers in source", () => {
            const groupLayer = new Layer2dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(groupLayer.getLayer()).to.be.an.instanceof(LayerGroup);
            expect(warn.notCalled).to.be.true;
            expect(layerFactorySpy.calledTwice).to.be.true;
            expect(layerFactorySpy.firstCall.args[0]).to.include(layerWMS);
            expect(layerFactorySpy.firstCall.args[1]).to.be.deep.equals("2D");
            expect(layerFactorySpy.secondCall.args[0]).to.include(layerWMS2);
            expect(layerFactorySpy.secondCall.args[1]).to.be.deep.equals("2D");
            expect(groupLayer.getLayer().getSource().length).to.be.equals(2);
        });
        it("should pass the autoRefresh attribute to children without autoRefresh", () => {
            const attrsWithAutoRefresh = {
                    ...attributes,
                    autoRefresh: 50000
                },
                groupLayer = new Layer2dGroup(attrsWithAutoRefresh, layerFactory);

            expect(groupLayer.getLayerSource()[0].attributes.autoRefresh).to.equal(50000);
            expect(groupLayer.getLayerSource()[1].attributes.autoRefresh).to.equal(50000);
        });
        it("should keep the autoRefresh attribute of children with autoRefresh", () => {
            const attrsWithAutoRefresh = {
                    ...attributes,
                    autoRefresh: 100000,
                    children: [
                        layerWMS3
                    ]
                },
                groupLayer = new Layer2dGroup(attrsWithAutoRefresh, layerFactory);

            expect(groupLayer.getLayerSource()[0].attributes.autoRefresh).to.equal(50000);
        });
        it("should pass the visibility attribute to children", () => {
            const attrsWithVisibility = {
                    ...attributes,
                    visibility: true
                },
                groupLayer = new Layer2dGroup(attrsWithVisibility, layerFactory);

            expect(groupLayer.getLayerSource()[0].attributes.visibility).to.be.true;
            expect(groupLayer.getLayerSource()[1].attributes.visibility).to.be.true;
        });
    });

    describe("updateLayerValues", () => {
        it("should update the values of the group", () => {
            const groupLayer = new Layer2dGroup(attributes, layerFactory);

            expect(groupLayer.getLayer().getVisible()).to.be.true;

            groupLayer.updateLayerValues({
                ...attributes,
                visibility: false
            });

            expect(groupLayer.getLayer().getVisible()).to.be.false;
        });
        it("should update the visibility of children", () => {
            const groupLayer = new Layer2dGroup(attributes, layerFactory);

            groupLayer.updateLayerValues(attributes);

            expect(updateLayerValuesStub.callCount).to.equal(2);
        });
    });

    describe("setLayerSource", () => {
        it("setLayerSource shall be called on creation", () => {
            const groupLayer = new Layer2dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(groupLayer.getLayer()).to.be.an.instanceof(LayerGroup);
            expect(warn.notCalled).to.be.true;
            expect(groupLayer.layerSource.length).to.be.equals(2);
        });
    });

    describe("getLayerSource", () => {
        it("getLayerSource shall return 2 grouped layers", () => {
            const groupLayer = new Layer2dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(groupLayer.getLayer()).to.be.an.instanceof(LayerGroup);
            expect(warn.notCalled).to.be.true;
            expect(groupLayer.getLayerSource().length).to.be.equals(2);
        });
    });

    describe("addErrorListener", () => {
        it("addErrorListener shall call addErrorListener at each grouped layer on creation", () => {
            const addErrorListenerSpy = sinon.spy(Layer2d.prototype, "addErrorListener"),
                groupLayer = new Layer2dGroup(attributes, layerFactory);

            expect(groupLayer).not.to.be.undefined;
            expect(groupLayer.getLayer()).to.be.an.instanceof(LayerGroup);
            expect(warn.notCalled).to.be.true;
            expect(addErrorListenerSpy.calledTwice).to.be.true;

        });
    });
});
