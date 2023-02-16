import "regenerator-runtime/runtime";

window.URL.createObjectURL = function () {
    // empty
};

window.ResizeObserver =
    window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
    }));