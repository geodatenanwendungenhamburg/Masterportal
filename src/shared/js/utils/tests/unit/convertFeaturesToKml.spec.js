import {expect} from "chai";
import {getIconUrl} from "@shared/js/utils/convertFeaturesToKml.js";
import * as constants from "@modules/draw_old/store/constantsDraw.js";

describe("src/shared/js/utils/convertFeaturesToKml.js", () => {
    let assetsPathOrig,
        originOrig;

    beforeAll(() => {
        assetsPathOrig = global.MASTERPORTAL_ASSETS_PATH;
        originOrig = window.location.origin;
        global.window = {
            location: {
                origin: "https://localhost:8080"
            }
        };
        global.MASTERPORTAL_ASSETS_PATH = "/src/assets/img";
    });

    afterAll(() => {
        global.MASTERPORTAL_ASSETS_PATH = assetsPathOrig;
        window.location.origin = originOrig;
    });

    describe("getIconUrl", () => {
        it("should return the url to the icons depending on the color", () => {
            for (let index = 0; index < constants.colorOptions.length; index++) {
                const colorOption = constants.colorOptions[index],
                    color = colorOption.color,
                    expected = `${window.location.origin}${MASTERPORTAL_ASSETS_PATH}/tools/draw/circle_${color}.svg`;

                expect(getIconUrl(colorOption.value)).to.be.equals(expected);
            }
        });

    });
});
