import axios from "axios";
import store from "@appstore/index.js";
import {expect} from "chai";
import sinon from "sinon";
import {fetchTSRDirections} from "@modules/routing/js/tsr/routing-vroom-directions";

describe("src/modules/routing/js/tsr/routing-vroom-directions.js", () => {
    beforeEach(() => {
        sinon.stub(i18next, "t").callsFake((...args) => args);
        store.getters = {
            restServiceById: () => {
                return {url: "tmp"};
            }
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("should fetchRoutingvroomDirections", () => {
        it("should process result correct", async () => {

            sinon.stub(axios, "post").returns(
                new Promise(resolve => resolve({
                    data: {
                        "code": 0,
                        "summary":
                                {
                                    "cost": 2708,
                                    "unassigned": 0,
                                    "service": 0,
                                    "duration": 2708,
                                    "waiting_time": 0,
                                    "priority": 0,
                                    "distance": 28867,
                                    "violations": [],
                                    "computing_times": {
                                        "loading": 44,
                                        "solving": 0,
                                        "routing": 10
                                    }
                                },
                        "unassigned": [],
                        "routes": [
                            {
                                "vehicle": 0,
                                "cost": 2708,
                                "service": 0,
                                "duration": 2708,
                                "waiting_time": 0,
                                "priority": 0,
                                "distance": 28867,
                                "steps": [
                                    {
                                        "type": "start",
                                        "location": [9.925667170861074, 53.57724902156595],
                                        "service": 0,
                                        "waiting_time": 0,
                                        "arrival": 0,
                                        "duration": 0,
                                        "violations": [],
                                        "distance": 0
                                    }, {
                                        "type": "job",
                                        "location": [9.930501037064506, 53.56080114079553],
                                        "id": 0,
                                        "service": 0,
                                        "waiting_time": 0,
                                        "job": 0,
                                        "arrival": 650,
                                        "duration": 650,
                                        "violations": [],
                                        "distance": 3608
                                    }, {
                                        "type": "job",
                                        "location": [9.92998997378153, 53.5374975437505],
                                        "id": 1,
                                        "service": 0,
                                        "waiting_time": 0,
                                        "job": 1,
                                        "arrival": 1774,
                                        "duration": 1774,
                                        "violations": [],
                                        "distance": 16470
                                    }, {
                                        "type": "end",
                                        "location": [9.9255885381530, 53.518742878540],
                                        "service": 0,
                                        "waiting_time": 0,
                                        "arrival": 2708,
                                        "duration": 2708,
                                        "violations": [],
                                        "distance": 28867
                                    }
                                ],
                                "violations": [],
                                "geometry": "yh_fIgcr{@sBqJaA{DIC@_@CiAEe@E_@YyAM]QYWUYSGGOUK[E}"
                            }
                        ]
                    }
                }
                )
                )
            );
            const result = await fetchTSRDirections({
                coordinates: [
                    [9.915050996498364, 53.54439987794555],
                    [9.920459536396748, 53.54430485938602]
                ],
                transformCoordinatesToLocal: coords => coords
            });

            expect(result.distance).deep.to.equal(28867);
            expect(result.duration).deep.to.equal(2708);
        });
    });

    it("should throw error 404", async () => {
        sinon.stub(axios, "post").returns(
            new Promise((_, reject) => reject({
                response: {
                    status: 404
                }
            }))
        );

        try {
            await fetchTSRDirections({
                coordinates: [
                    [9.898359331514978, 53.581468685130446],
                    [9.896306608318595, 53.58267323348021]
                ],
                transformCoordinatesToLocal: coords => coords
            });
            // should not reach here
            expect(true).to.be.false;
        }
        catch (error) {
            expect(error.message).equal("common:modules.routing.errors.noRouteFound");
        }
    });

    it("should throw unreachable point error", async () => {

        const coordinates = [
            [10.213645727260518, 51.38555222959108],
            [10.216914023843442, 51.384482245544675]
        ];

        sinon.stub(axios, "post").returns(
            new Promise((_, reject) => reject({
                response: {
                    status: 999,
                    data: {code: 3}
                }
            }))
        );

        try {
            await fetchTSRDirections({
                coordinates: coordinates,
                transformCoordinatesToLocal: coords => coords
            });
            // should not reach here
            expect(true).to.be.false;
        }
        catch (error) {
            expect(error.message).equal("common:modules.routing.tsr.errors.unreachablePoint");
        }
    });

    it("should throw other error", async () => {

        const coordinates = [
            [10.213645727260518, 51.38555222959108],
            [10.216914023843442, 51.384482245544675]
        ];

        sinon.stub(axios, "post").returns(
            new Promise((_, reject) => reject({
                response: {
                    status: 999,
                    data: {
                        code: 1
                    }
                }
            }))
        );

        try {
            await fetchTSRDirections({
                coordinates: coordinates,
                transformCoordinatesToLocal: coords => coords
            });
            // should not reach here
            expect(true).to.be.false;
        }
        catch (error) {
            expect(error.message).equal("common:modules.routing.errors.errorRouteFetch");
        }
    });
});

