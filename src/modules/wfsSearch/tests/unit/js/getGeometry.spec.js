import {expect} from "chai";
import getGeometry from "@modules/wfsSearch/js/getGeometry";

describe("src/modules/wfsSearch/js/getGeometry.js", () => {
    let results,
        row = {};

    /**
     * Creates results and row.
     * @param {Object} attributes the attributes
     * @returns {void}
     */
    function createResultAndRow (attributes) {
        const feature = {
            get: (key)=> {
                return attributes[key];
            }
        };

        results.push(feature);

        Object.entries(attributes).forEach(([key, value]) => {
            row[key] = value;
        });
    }

    describe("getGeometry", () => {

        it("one result entry with geometry Point", () => {
            results = [];
            createResultAndRow({"geometry": "Point"});
            const geom = getGeometry(results, row);

            expect(geom).to.equal("Point");
        });

        it("one result entry with geom Point", () => {
            results = [];
            createResultAndRow({"geom": "Point"});
            const geom = getGeometry(results, row);

            expect(geom).to.equal("Point");
        });

        it("more result entries, geometry Polygon", () => {
            results = [];
            createResultAndRow({name: "Name1", geometry: "Point"});
            createResultAndRow({name: "Name2", geometry: "Polygon"});
            row = {name: "Name2"};

            const geom = getGeometry(results, row);

            expect(geom).to.equal("Polygon");
        });

        it("more result entries, geom Polygon", () => {
            results = [];
            createResultAndRow({name: "Name1", geom: "Point"});
            createResultAndRow({name: "Name2", geom: "Polygon"});
            row = {name: "Name2"};
            const geom = getGeometry(results, row);

            expect(geom).to.equal("Polygon");
        });

        it("more result entries, no comparison return geom", () => {
            results = [];
            createResultAndRow({name: "Name1", geom: "Point"});
            createResultAndRow({name: "Name2", geom: "Polygon"});
            row = {name: "Name3", geom: "Polygon"};

            const geom = getGeometry(results, row);

            expect(geom).to.equal("Polygon");
        });

        it("more result entries, no comparison return geometry", () => {
            results = [];
            createResultAndRow({name: "Name1", geom: "Point"});
            createResultAndRow({name: "Name2", geom: "Polygon"});
            row = {name: "Name3", geometry: "Polygon"};

            const geom = getGeometry(results, row);

            expect(geom).to.equal("Polygon");
        });

        it("more result entries, with comparison return null", () => {
            results = [];
            createResultAndRow({name: "Name1", geom: "Point"});
            createResultAndRow({name: "Name2", geom: "Polygon"});
            row = {name: "Name3"};

            const geom = getGeometry(results, row);

            expect(geom).to.equal(null);
        });
    });


});
