import debounce from "../../debounce";
import {expect} from "chai";

describe("debounce", () => {
    it("should call the callback after the wait time", async () => {
        let called = false;

        await new Promise(resolve => {
            const fn = debounce(() => {
                called = true;
                expect(called).to.be.true;
                resolve();
            }, 50);

            fn();
        });
    });

    it("should not call the callback immediately if called multiple times rapidly", async () => {
        let callCount = 0;

        await new Promise(resolve => {
            const fn = debounce(() => {
                callCount++;
                expect(callCount).to.equal(1);
                resolve();
            }, 50);

            fn();
            fn();
            fn();
        });
    });

    it("should use thisArg as context if provided", async () => {
        const context = {value: 42};

        await new Promise(resolve => {
            const fn = debounce(function () {
                expect(this.value).to.equal(42);
                resolve();
            }, 30, context);

            fn();
        });
    });

    it("should pass arguments to the callback", async () => {
        await new Promise(resolve => {
            const fn = debounce((a, b) => {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
                resolve();
            }, 20);

            fn(1, 2);
        });
    });
});
