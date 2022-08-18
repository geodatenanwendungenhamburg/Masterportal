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
            expect(mockFetch).toHaveBeenCalledWith("www.example.com?service=WMS&request=GetCapabilities");
        });

        it("calls 0/0/0 tile for VectorTile services", async function () {
            const status = await ping({url: "www.example.com/{x}/{y}/{z}", typ: "VectorTile"});

            expect(status).toBe(200);
            expect(mockFetch).toHaveBeenCalledWith("www.example.com/0/0/0");
        });

        it("calls the URL directly for OAF services", async function () {
            const status = await ping({url: "www.example.com", typ: "OAF"});

            expect(status).toBe(200);
            expect(mockFetch).toHaveBeenCalledWith("www.example.com");
        });

        it("returns 404 on network errors", async function () {
            mockFetch = jest.fn(() => Promise.reject(new Error("CÖRS!!!")));
            global.fetch = mockFetch;

            const status = await ping({url: "www.example.com", typ: "OAF"});

            expect(status).toBe(404);
            expect(mockFetch).toHaveBeenCalledWith("www.example.com");
        });
    });
});
