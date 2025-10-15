import {expect} from "chai";
import sinon from "sinon";
import getters from "@modules/shareView/store/gettersShareView";
import shareViewState from "@modules/shareView/store/stateShareView";

describe("src/modules/shareView/store/gettersShareView.js", () => {
    let rootGetters,
        circular;

    const testLocation = "https://test.de/app.html?existingKey=existingValue&layerids=abc123";

    beforeEach(() => {
        rootGetters = {
            layerUrlParams: [
                {id: "layer1", visibility: true},
                {id: "highlight_point_layer", visibility: true, isDynamic: true},
                {id: "layer2", visibility: false}
            ],
            "Maps/urlParams": "zoom=5&center=10,10",
            "Menu/urlParams": {
                main: {
                    currentComponent: shareViewState.type,
                    attributes: {some: "value"}
                },
                secondary: {
                    currentComponent: "borisComponent",
                    attributes: {other: "value"}
                }
            }
        };

        const jsdom = new URL(testLocation);

        global.location = {
            origin: jsdom.origin,
            pathname: jsdom.pathname,
            search: jsdom.search
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should return a URL with MENU and LAYERS parameters, and remove filtered components", () => {
        const url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url),
            menu = JSON.parse(parsed.searchParams.get("MENU")),
            ignoredKeys = ["layerids"];

        expect(parsed.searchParams.has("MENU")).to.be.true;
        expect(parsed.searchParams.has("LAYERS")).to.be.true;


        expect(menu.main.currentComponent).to.equal("root");
        expect(menu.main.attributes).to.be.undefined;

        expect(menu.secondary.currentComponent).to.equal("root");
        expect(menu.secondary.attributes).to.be.undefined;

        expect(parsed.searchParams.get("LAYERS")).to.equal(JSON.stringify(rootGetters.layerUrlParams));
        expect(parsed.searchParams.get("existingKey")).to.equal("existingValue");


        ignoredKeys.forEach(key => {
            expect(parsed.searchParams.has(key)).to.be.false;
        });
    });

    it("should keep custom component names if not in the ignore list", () => {
        rootGetters["Menu/urlParams"].main.currentComponent = "otherComponent";

        const url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url),
            menu = JSON.parse(parsed.searchParams.get("MENU"));

        expect(menu.main.currentComponent).to.equal("otherComponent");
        expect(menu.main.attributes).to.deep.equal({some: "value"});
    });

    it("should filter out legacy URL parameters", () => {
        global.location.search = "?layerids=abc123&visibility=true&transparency=50&map/mdid=xyz456&existingKey=testValue";

        const url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url),
            legacyKeys = ["layerids", "visibility", "transparency", "map/mdid"];

        legacyKeys.forEach(key => {
            expect(parsed.searchParams.has(key)).to.be.false;
        });

        expect(parsed.searchParams.get("existingKey")).to.equal("testValue");
    });

    it("should remove invalid attributes from MENU and log an error", () => {
        circular = {};
        circular.self = circular;

        rootGetters["Menu/urlParams"].main.currentComponent = "customComponent";
        rootGetters["Menu/urlParams"].main.attributes = {circular};

        const errorSpy = sinon.spy(console, "error"),
            url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url),
            menu = JSON.parse(parsed.searchParams.get("MENU"));

        expect(menu.main.attributes).to.be.undefined;
        expect(errorSpy.calledOnce).to.be.true;
        expect(errorSpy.firstCall.args[0]).to.include("Parsing the attributes of the module");
    });
});
