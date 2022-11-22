import ping from "../../src/lib/ping";

const originalFetch = global.fetch;

describe("ping.js", function () {
    let mockFetch;

    beforeEach(() => {
        mockFetch = jest.fn(() => Promise.resolve({
            status: 200
        }));
        global.fetch = mockFetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    describe("ping", function () {
        it("calls an url from the service definition", async function () {
            const status = await ping({url: "www.example.com", typ: "WMS"});

            expect(status).toBe(200);
            expect(mockFetch).toHaveBeenCalledWith("www.example.com?service=WMS&request=GetCapabilities", {method: "HEAD"});
        });

        it("calls 0/0/0 tile for VectorTile services", async function () {
            const status = await ping({url: "www.example.com/{x}/{y}/{z}", typ: "VectorTile"});

            expect(status).toBe(200);
            expect(mockFetch).toHaveBeenCalledWith("www.example.com/0/0/0", {method: "HEAD"});
        });

        it("calls the URL directly for OAF services", async function () {
            const status = await ping({url: "www.example.com", typ: "OAF"});

            expect(status).toBe(200);
            expect(mockFetch).toHaveBeenCalledWith("www.example.com", {method: "HEAD"});
        });

        it("returns 900 on network errors", async function () {
            mockFetch = jest.fn(() => Promise.resolve({status: 900}));
            global.fetch = mockFetch;

            const status = await ping({url: "www.example.com", typ: "OAF"});

            expect(status).toBe(900);
            expect(mockFetch).toHaveBeenCalledWith("www.example.com", {method: "HEAD"});
        });

        it("returns highest status code on multiple urls", async function () {
            let counter = 200;

            mockFetch = jest.fn(() => Promise.resolve({status: counter++}));
            global.fetch = mockFetch;

            const status = await ping({urls: [
                "www.example.com",
                "www.example.com/but"
            ], typ: "WMTS"});

            expect(status).toBe(201);
            expect(mockFetch)
                .toHaveBeenCalledWith("www.example.com", {method: "HEAD"});
            expect(mockFetch)
                .toHaveBeenCalledWith("www.example.com/but", {method: "HEAD"});
        });
    });
});
