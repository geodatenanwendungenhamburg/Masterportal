import sinon from "sinon";
import {expect} from "chai";

import * as actions from "@modules/draw_old/store/actions/actionsDownload.js";

import {KML, GeoJSON, GPX} from "ol/format.js";
import Feature from "ol/Feature.js";
import Line from "ol/geom/LineString.js";
import Point from "ol/geom/Point.js";
import Polygon from "ol/geom/Polygon.js";
import proj4 from "proj4";
import transform from "@modules/draw_old/js/download/transform.js";

describe("src/modules/draw/store/actions/actionsDownload.js", () => {
    let dispatch, state, commit;

    beforeEach(() => {

        dispatch = sinon.spy();
        commit = sinon.spy();
        proj4.defs("EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("convertFeatures", () => {
        // As these don't need to be transformed for this test, they are already in EPSG:4326
        beforeEach(() => {
            const line = new Line([
                    [11.553402467114491, 48.18048612894288],
                    [11.575007532544808, 48.18114662023035],
                    [11.581260790292623, 48.18657710798541]
                ]),
                point = new Point([11.557298950358712, 48.19011266676286]),
                polygon = new Polygon([[
                    [11.549606597773037, 48.17285700012215],
                    [11.600757126507961, 48.179280978813836],
                    [11.57613610823175, 48.148267667042006],
                    [11.549606597773037, 48.17285700012215]
                ]]);

            state = {
                download: {
                    features: [line, point, polygon].map(geometry => new Feature({geometry}))
                }
            };
            sinon.stub(transform, "transformCoordinates").callsFake(function (arg) {
                return arg.getCoordinates();
            });
        });

        it("should convert features to a KML String", async () => {
            expect(await actions.convertFeatures({state, dispatch, commit}, new KML({extractStyles: true}))).to.equal(
                "<kml xmlns=\"http://www.opengis.net/kml/2.2\" xmlns:gx=\"http://www.google.com/kml/ext/2.2\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd\"><Document><Placemark><LineString><coordinates>11.553402467114491,48.18048612894288 11.575007532544808,48.18114662023035 11.581260790292623,48.18657710798541</coordinates></LineString></Placemark><Placemark><Point><coordinates>11.557298950358712,48.19011266676286</coordinates></Point></Placemark><Placemark><Polygon><outerBoundaryIs><LinearRing><coordinates>11.549606597773037,48.17285700012215 11.600757126507961,48.179280978813836 11.57613610823175,48.148267667042006 11.549606597773037,48.17285700012215</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>"
            );
        });
        it("should convert features to a GeoJSON String", async () => {
            expect(await actions.convertFeatures({state, dispatch, commit}, new GeoJSON())).to.eql(
                "{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[11.553402467114491,48.18048612894288],[11.575007532544808,48.18114662023035],[11.581260790292623,48.18657710798541]]},\"properties\":null},{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[11.557298950358712,48.19011266676286]},\"properties\":null},{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[11.549606597773037,48.17285700012215],[11.600757126507961,48.179280978813836],[11.57613610823175,48.148267667042006],[11.549606597773037,48.17285700012215]]]},\"properties\":null}]}"
            );
        });
        it("should convert features to a GPX String", async () => {
            expect(await actions.convertFeatures({state, dispatch, commit}, new GPX())).to.equal(
                "<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"OpenLayers\"><rte><rtept lat=\"48.18048612894288\" lon=\"11.553402467114491\"/><rtept lat=\"48.18114662023035\" lon=\"11.575007532544808\"/><rtept lat=\"48.18657710798541\" lon=\"11.581260790292623\"/></rte><wpt lat=\"48.19011266676286\" lon=\"11.557298950358712\"/></gpx>"
            );
        });
        it("should only convert point and line features to a GPX String and trigger the notSupportedAlert alert", async () => {
            const notSupportedAlert = {
                category: "error",
                content: i18next.t("common:modules.draw_old.download.notSupportedGeometryType", {geometry: "Polygon"}),
                displayClass: "error"
            };

            expect(await actions.convertFeatures({state, dispatch, commit}, new GPX())).to.equal(
                "<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"OpenLayers\"><rte><rtept lat=\"48.18048612894288\" lon=\"11.553402467114491\"/><rtept lat=\"48.18114662023035\" lon=\"11.575007532544808\"/><rtept lat=\"48.18657710798541\" lon=\"11.581260790292623\"/></rte><wpt lat=\"48.19011266676286\" lon=\"11.557298950358712\"/></gpx>"
            );
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.eql("Alerting/addSingleAlert");
            expect(dispatch.firstCall.args[1]).to.eql(notSupportedAlert);
        });
        it("should convert features to an empty GPX String and trigger a alert", async () => {
            const allGeometryTypesNotSupported = {
                    category: "error",
                    content: i18next.t("common:modules.draw_old.download.allGeometryTypesNotSupported", {geometry: "Polygon"}),
                    displayClass: "error"
                },
                polygon = new Polygon([[
                    [11.549606597773037, 48.17285700012215],
                    [11.600757126507961, 48.179280978813836],
                    [11.57613610823175, 48.148267667042006],
                    [11.549606597773037, 48.17285700012215]
                ]]);

            state = {
                download: {
                    features: [polygon].map(geometry => new Feature({geometry}))
                }
            };

            expect(await actions.convertFeatures({state, dispatch, commit}, new GPX())).to.equal(
                "<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"OpenLayers\"/>"
            );
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.eql("Alerting/addSingleAlert");
            expect(dispatch.firstCall.args[1]).to.eql(allGeometryTypesNotSupported);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.eql("setDownloadFeaturesNotSupported");
            expect(commit.firstCall.args[1]).to.eql(true);
        });
    });
    describe("validateFileName", () => {
        beforeEach(() => {
            state = {
                download: {
                    fileName: "",
                    selectedFormat: ""
                }
            };
        });
        it("should return an empty String if the fileName as well as the selectedFormat are both not set yet", () => {
            expect(actions.validateFileName({state})).to.equal("");
        });
        it("should return the filename including the suffix of the file format", () => {
            state.download = {
                fileName: "foo",
                selectedFormat: "bar"
            };
            expect(actions.validateFileName({state})).to.equal("foo.bar");
        });
        it("should return the filename including the suffix of the file format if the user has added it to the filename on input", () => {
            state.download = {
                fileName: "foo.bar",
                selectedFormat: "bar"
            };
            expect(actions.validateFileName({state})).to.equal("foo.bar");
        });
        it("should return an empty String if the format but not the filename is set", () => {
            state.download.selectedFormat = "bar";
            expect(actions.validateFileName({state})).to.equal("");
        });
        it("should return an empty String if the fileName but not the format is set", () => {
            state.download.fileName = "foo";
            expect(actions.validateFileName({state})).to.equal("");

        });
    });
});
