import sinon from "sinon";
import axios from "axios";

import httpClientModule from "@modules/contact/js/httpClient.js";

describe("src/modules/contact/js/httpClient", function () {
    describe("httpClient", function () {
        beforeEach(() => {
            sinon.stub(console, "error");
        });

        afterEach(() => {
            sinon.restore();
        });

        it("calls onSuccess parameter on success", async () => {
            sinon.stub(axios, "post").returns(
                Promise.resolve({status: 200, data: {success: true}})
            );

            const onSuccess = sinon.spy(),
                onError = sinon.spy();

            httpClientModule.httpClient("url", {}, onSuccess, onError);
            await Promise.resolve();
            await Promise.resolve();

            sinon.assert.calledOnce(onSuccess);
            sinon.assert.notCalled(onError);
        });

        it("calls onError parameter on internal client error", async () => {
            sinon.stub(axios, "post").returns(
                Promise.reject("Internal Client Error")
            );

            const onSuccess = sinon.spy(),
                onError = sinon.spy();

            httpClientModule.httpClient("url", {}, onSuccess, onError);
            await Promise.resolve();
            await Promise.resolve();

            sinon.assert.notCalled(onSuccess);
            sinon.assert.calledOnce(onError);
        });

        it("calls onError parameter if response status is not 200", async () => {
            sinon.stub(axios, "post").returns(
                Promise.resolve({status: 500})
            );

            const onSuccess = sinon.spy(),
                onError = sinon.spy();

            httpClientModule.httpClient("url", {}, onSuccess, onError);
            await Promise.resolve();
            await Promise.resolve();

            sinon.assert.notCalled(onSuccess);
            sinon.assert.calledOnce(onError);
        });

        it("calls axios.post in expected fashion", function () {
            sinon.stub(axios, "post").returns(
                Promise.resolve({status: 200})
            );

            httpClientModule.httpClient("url", {
                nested: {
                    elements: [
                        {
                            work: "they do"
                        },
                        {
                            well: null
                        }
                    ]
                },
                alsoFlat: "work"
            }, sinon.spy(), sinon.spy());

            sinon.assert.calledOnce(axios.post);
            sinon.assert.calledWith(
                axios.post,
                "url",
                "nested%5Belements%5D%5B0%5D%5Bwork%5D=they%20do&nested%5Belements%5D%5B1%5D%5Bwell%5D=null&alsoFlat=work"
            );
        });
    });
});
