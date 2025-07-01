import sinon from "sinon";
import {expect} from "chai";

import transform from "@modules/draw_old/js/download/transform";
import store from "@appstore/index.js";

import Circle from "ol/geom/Circle";
import Line from "ol/geom/LineString";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import proj4 from "proj4";

afterEach(() => {
    sinon.restore();
});

describe("src/modules/draw/js/download/transform.js", () => {
    beforeEach(() => {

        store.getters = {
            "Maps/projection": {
                getCode: () => "EPSG:25832"
            }
        };
        store.dispatch = sinon.spy();
        proj4.defs("EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    });


    describe("transformCoordinates", () => {
        it("should transform point coordinates from EPSG:25832 to EPSG:4326", () => {
            const geometry = new Point([690054.1273707711, 5340593.1785796825]);

            expect(transform.transformCoordinates(geometry)).to.eql(
                [11.557298950390026, 48.19011285902384]
            );
            expect(store.dispatch.notCalled).to.be.true;
        });
        it("should transform line coordinates from EPSG:25832 to EPSG:4326", () => {
            const geometry = new Line([
                [689800.1275079311, 5339513.679162612],
                [691403.501642109, 5339640.679094031],
                [691848.0014020792, 5340259.803759704]
            ]);

            expect(transform.transformCoordinates(geometry)).to.eql(
                [
                    [11.553402467145743, 48.1804863212112],
                    [11.57500753257633, 48.18114681249815],
                    [11.581260790324238, 48.18657730024906]
                ]
            );
            expect(store.dispatch.notCalled).to.be.true;
        });
        it("should transform polygon coordinates from EPSG:25832 to EPSG:4326", () => {
            const geometry = new Polygon([[
                [689546.127645091, 5338656.429625526],
                [693324.3756048371, 5339497.804171184],
                [691609.8765306666, 5335989.431065706],
                [689546.127645091, 5338656.429625526]
            ]]);

            expect(transform.transformCoordinates(geometry)).to.eql(
                [[
                    [11.549606597804212, 48.17285719239628],
                    [11.600757126539783, 48.17928117108303],
                    [11.57613610826325, 48.1482678593347],
                    [11.549606597804212, 48.17285719239628]
                ]]
            );
            expect(store.dispatch.notCalled).to.be.true;
        });
        it("should not transform the geometry if it is neither a Line, Point or Polygon and return an empty Array", () => {
            const geometry = new Circle([690054.1273707711, 5340593.1785796825], 5);

            expect(transform.transformCoordinates(geometry)).to.eql([]);
            expect(store.dispatch.calledOnce).to.be.true;
            /* NOTE: i18next isn't actually working in tests yet, so here undefined
            * is compared with undefined - works, but has limited meaning */
            // expect(dispatch.calledWith("Alerting/addSingleAlert", i18next.t("common:modules.download.unknownGeometry", {geometry: geometry.getType()}))).to.be.true;
        });
    });
});
