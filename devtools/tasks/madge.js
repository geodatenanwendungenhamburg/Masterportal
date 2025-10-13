const path = require("path"),
    madge = require("madge"),
    folders = [
        path.resolve(__dirname, "../../src"),
        path.resolve(__dirname, "../../addons")
    ],
    madgeOptions = {
        fileExtensions: ["js", "vue"],
        exclude: ["node_modules"]
    };

Promise.all(folders.map(folder => {
    return madge(folder, madgeOptions);
}))
    .then(results => {
        results.forEach((res, idx) => {
            const result = res.circular();

            if (result.length > 0) {
                console.warn(`Error! Detected circular dependencies in imports for ${folders[idx]}:`);
                result.forEach(element => {
                    console.warn(element);
                });
                throw new Error();
            }
        });
    });
