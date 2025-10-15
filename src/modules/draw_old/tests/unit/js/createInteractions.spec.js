import {Select, Modify} from "ol/interaction.js";
import Draw from "ol/interaction/Draw.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import {expect} from "chai";
import sinon from "sinon";
import {createDrawInteraction, createModifyInteraction, createModifyAttributesInteraction, createSelectInteraction} from "@modules/draw_old/js/createInteractions";
import createStyleModule from "@modules/draw_old/js/style/createStyle";

describe("src/modules/draw_old/js/createInteractions.js", () => {
    let layer,
        app;

    beforeEach(() => {
        layer = new VectorLayer({
            source: new VectorSource()
        });
        app = {
            config: {
                globalProperties: {
                    $layer: {
                        visible: true,
                        getVisible: () => app.config.globalProperties.$layer.visible,
                        setVisible: value => {
                            app.config.globalProperties.$layer.visible = value;
                        },
                        getSource: () => {
                            return {
                                getFeatures: () => []
                            };
                        }

                    }}
            }
        };
    });

    it("should create a draw interaction", () => {
        const state = {
                drawType: {id: "drawSquare", geometry: "Circle"},
                layer: layer,
                freeHand: false
            },
            styleSettings = {},
            createStyleStub = sinon.stub(createStyleModule, "createStyle").returns({}),
            drawInteraction = createDrawInteraction(state, styleSettings, app);

        expect(drawInteraction).to.be.an.instanceOf(Draw);
        sinon.assert.calledOnce(createStyleStub);
        sinon.assert.calledWith(createStyleStub, state, styleSettings);

        createStyleStub.restore();
    });

    it("should create a modify interaction", () => {
        const modifyInteraction = createModifyInteraction(layer);

        expect(modifyInteraction).to.be.an.instanceof(Modify);
    });

    it("should create a modify attributes interaction", () => {
        const modifyAttributesInteraction = createModifyAttributesInteraction(layer);

        expect(modifyAttributesInteraction).to.be.an.instanceof(Modify);
    });

    it("should create a select interaction", () => {
        const hitTolerance = 5,
            selectInteraction = createSelectInteraction(layer, hitTolerance);

        expect(selectInteraction).to.be.an.instanceof(Select);
    });
});
