import {expect} from "chai";
import sinon from "sinon";
import {vi} from "vitest";
import {RoutingGeosearchResult} from "@modules/routing/js/classes/routing-geosearch-result.js";
import {fetchRoutingGazetteerGeosearch} from "@modules/routing/js/geosearch/routing-gazetteer-geosearch.js";

describe("src/modules/routing/js/geosearch/routing-gazeteer-geosearch.js", () => {
    let fetch;
    const sampleResponseData = `<?xml version='1.0' encoding="UTF-8"?>
    <wfs:FeatureCollection xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd http://www.opengis.net/gml/3.2 http://schemas.opengis.net/gml/3.2.1/gml.xsd http://www.adv-online.de/namespaces/adv/dog https://geodienste.hamburg.de/HH_WFS_DOG?SERVICE=WFS&amp;VERSION=2.0.0&amp;REQUEST=DescribeFeatureType&amp;OUTPUTFORMAT=text%2Fxml%3B+subtype%3Dgml%2F3.2.1&amp;TYPENAME=dog:Hauskoordinaten&amp;NAMESPACES=xmlns(dog,http%3A%2F%2Fwww.adv-online.de%2Fnamespaces%2Fadv%2Fdog)" xmlns:wfs="http://www.opengis.net/wfs/2.0" timeStamp="2025-12-03T10:28:26Z" xmlns:gml="http://www.opengis.net/gml/3.2" numberMatched="unknown" numberReturned="0">
  <wfs:member>
    <dog:Hauskoordinaten xmlns:dog="http://www.adv-online.de/namespaces/adv/dog" gml:id="HH_HK_328655186">
      <iso19112:geographicIdentifier xmlns:iso19112="http://www.opengis.net/iso19112">ABC-Straße 1, 20354 Hamburg (OT Neustadt)</iso19112:geographicIdentifier>
      <iso19112:geographicExtent xmlns:iso19112="http://www.opengis.net/iso19112">
        <gmd:EX_BoundingPolygon xmlns:gmd="http://www.isotc211.org/2005/gmd">
          <gmd:polygon>
            <gml:Polygon gml:id="HH_HK_328655186_ISO19112_GEOGRAPHICEXTENT" srsName="urn:ogc:def:crs:EPSG::25832">
              <gml:exterior>
                <gml:LinearRing>
                  <gml:posList>565425.325 5934396.620 565425.325 5934446.620 565475.325 5934446.620 565475.325 5934396.620 565425.325 5934396.620</gml:posList>
                </gml:LinearRing>
              </gml:exterior>
            </gml:Polygon>
          </gmd:polygon>
        </gmd:EX_BoundingPolygon>
      </iso19112:geographicExtent>
      <iso19112:position xmlns:iso19112="http://www.opengis.net/iso19112">
        <!--Inlined geometry 'HH_HK_328655186_ISO19112_POSITION'-->
        <gml:Point gml:id="HH_HK_328655186_ISO19112_POSITION" srsName="urn:ogc:def:crs:EPSG::25832">
          <gml:pos>565450.325 5934421.620</gml:pos>
        </gml:Point>
      </iso19112:position>
      <iso19112:gazetteer xmlns:iso19112="http://www.opengis.net/iso19112" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://geodienste.hamburg.de/HH_WFS_DOG?SERVICE=WFS&amp;VERSION=2.0.0&amp;REQUEST=GetFeature&amp;OUTPUTFORMAT=application%2Fgml%2Bxml%3B+version%3D3.2&amp;STOREDQUERY_ID=urn:ogc:def:query:OGC-WFS::GetFeatureById&amp;ID=HH_SIGA_2#HH_SIGA_2"/>
      <iso19112:locationType xmlns:iso19112="http://www.opengis.net/iso19112" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://geodienste.hamburg.de/HH_WFS_DOG?SERVICE=WFS&amp;VERSION=2.0.0&amp;REQUEST=GetFeature&amp;OUTPUTFORMAT=application%2Fgml%2Bxml%3B+version%3D3.2&amp;STOREDQUERY_ID=urn:ogc:def:query:OGC-WFS::GetFeatureById&amp;ID=HH_SILC_1#HH_SILC_1"/>
      <iso19112:parent xmlns:iso19112="http://www.opengis.net/iso19112">ABC-Straße (OT 0108), Hamburg (20354)</iso19112:parent>
      <dog:qualitaet>A</dog:qualitaet>
      <dog:datensatznummer>37142</dog:datensatznummer>
      <dog:land>02</dog:land>
      <dog:regierungsbezirk>1</dog:regierungsbezirk>
      <dog:kreis>03</dog:kreis>
      <dog:gemeinde>108</dog:gemeinde>
      <dog:ortsteil>108</dog:ortsteil>
      <dog:strasse>A0060</dog:strasse>
      <dog:hausnummer>1</dog:hausnummer>
      <dog:hausschluessel>02;1;03;108;0108;A0060;1</dog:hausschluessel>
      <dog:strassenname>ABC-Straße</dog:strassenname>
      <dog:strassenname_normalisiert>ABCSTRASE</dog:strassenname_normalisiert>
      <dog:strassenname_soundex>A122</dog:strassenname_soundex>
      <dog:strassenname_kurz>ABC-Straße</dog:strassenname_kurz>
      <dog:ortsteilname>Neustadt,OT 0108</dog:ortsteilname>
      <dog:ortsteilname_normalisiert>OT0108</dog:ortsteilname_normalisiert>
      <dog:postleitzahl>20354</dog:postleitzahl>
      <dog:postOrtsteil>Neustadt</dog:postOrtsteil>
      <dog:postOrtsteil_normalisiert>NEUSTADT</dog:postOrtsteil_normalisiert>
      <dog:ortsnamePost>Hamburg</dog:ortsnamePost>
      <dog:ortsnamePost_normalisiert>HAMBURG</dog:ortsnamePost_normalisiert>
    </dog:Hauskoordinaten>
  </wfs:member>
</wfs:FeatureCollection>`;

    beforeEach(() => {
        fetch = global.fetch;
        global.fetch = vi.fn(() => Promise.resolve({
            text: () => Promise.resolve(sampleResponseData)})
        );
        sinon.stub(i18next, "t").callsFake((...args) => args);
    });
    afterEach(() => {
        global.fetch = fetch;
        sinon.restore();
    });
    describe("should fetchRoutingGazeteerGeosearch", () => {
        it("should process result correct", async () => {
            const result = await fetchRoutingGazetteerGeosearch("testsearch"),
                expectedResult = [
                    new RoutingGeosearchResult([565450.325, 5934421.620], "ABC-Straße", "25832"),
                    new RoutingGeosearchResult([565450.325, 5934421.620], "ABC-Straße 1", "25832")
                ];

            expect(result).deep.to.eql(expectedResult);
        });
    });
});
