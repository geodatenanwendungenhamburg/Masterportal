import {expect} from "chai";
import isLoginRequired from "@shared/js/utils/isLoginRequired.js";

describe("src/shared/js/utils/isLoginRequired.js", () => {
    const configJs = {login: {oidcClientId: "portal"}};

    it("should require the login for a secured layer, if the portal uses the login and the user is not logged in", () => {
        expect(isLoginRequired({isSecured: true}, configJs, false)).to.be.true;
    });

    it("should not require the login, if the user is logged in", () => {
        expect(isLoginRequired({isSecured: true}, configJs, true)).to.be.false;
    });

    it("should not require the login for a layer which is not secured", () => {
        expect(isLoginRequired({isSecured: false}, configJs, false)).to.be.false;
        expect(isLoginRequired({}, configJs, false)).to.be.false;
    });

    it("should not require the login, if the portal does not use the login", () => {
        expect(isLoginRequired({isSecured: true}, {}, false)).to.be.false;
        expect(isLoginRequired({isSecured: true}, null, false)).to.be.false;
    });

    it("should not require the login without a layer configuration", () => {
        expect(isLoginRequired(undefined, configJs, false)).to.be.false;
    });
});
