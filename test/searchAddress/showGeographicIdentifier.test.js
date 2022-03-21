import {setShowGeographicIdentifier, getShowGeographicIdentifier} from "../../src/searchAddress";
import defaults from "../../src/defaults";

describe("searchAddress", () => {
    describe("setShowGeographicIdentifier/showGeographicIdentifier", () => {
        it("showGeographicIdentifier url can be setted and getted, is initially default", () => {
            const initialState = getShowGeographicIdentifier();

            expect(initialState).toEqual(defaults.showGeographicIdentifier);
            setShowGeographicIdentifier(true);
            expect(getShowGeographicIdentifier()).toEqual(true);
            setShowGeographicIdentifier(initialState);
        });

        it("setting showGeographicIdentifier with falsy value means not changing previous value", () => {
            const initialState = getShowGeographicIdentifier();

            setShowGeographicIdentifier(undefined);
            expect(getShowGeographicIdentifier()).toEqual(initialState);
        });
    });
});
