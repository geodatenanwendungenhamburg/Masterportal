/**
 * See https://www.digitalocean.com/community/tutorials/vuejs-demistifying-vue-webpack
 */
const webpack = require("webpack"),
    path = require("path"),
    {VueLoaderPlugin} = require("vue-loader");

require("regenerator-runtime/runtime");
require("jsdom-global")();
require("proj4");

global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

URL.createObjectURL = function () {
    return false;
};
// Vue.config.devtools = false;

module.exports = {
    mode: "development",
    target: "node",
    devtool: "inline-cheap-module-source-map",
    output: {
        // use absolute paths in sourcemaps (important for debugging via IDE)
        devtoolModuleFilenameTemplate: "[absolute-resource-path]",
        devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
    },
    // use when debugging:
    // devtool: "cheap-module-eval-source-map",
    // output: {
    //     devtoolModuleFilenameTemplate: "[absolute-resource-path]"
    // },
    resolve: {
        alias: {
            vue: "vue/dist/vue.esm-bundler.js",
            // Custom path aliases to simplify imports across the project.
            // Make sure these aliases are also configured in jsconfig.json for proper IDE support.
            // NOTE: Aliases are defined manually here to ensure test environment resolves paths correctly.
            "@vue/compiler-dom": "@vue/compiler-dom/dist/compiler-dom.cjs.js",
            "@vue/compiler-core": "@vue/compiler-core/dist/compiler-core.cjs.js",
            "@appstore": path.resolve(__dirname, "../src/app-store"),
            "@shared": path.resolve(__dirname, "../src/shared"),
            "@core": path.resolve(__dirname, "../src/core"),
            "@modules": path.resolve(__dirname, "../src/modules"),
            "@plugins": path.resolve(__dirname, "../src/plugins"),
            "@devtools": path.resolve(__dirname, "../devtools")
        },
        extensions: [".tsx", ".ts", ".js", ".mjs", ".cjs"]
    },
    externals: [{
        "utf-8-validate": "commonjs2 utf-8-validate",
        "bufferutil": "commonjs2 bufferutil",
        "css-tree": "commonjs2 css-tree"
    },
    function (context, request, callback) {
        if ((/^jsdom(\/|$)/).test(request)) {
            return callback(null, "commonjs2 " + request);
        }
        return callback();
    }
    ],
    module: {
        rules: [
            {
                // Transpile @csstools/* and @asamuzakjp/css-color (CJS/MJS/JS) to strip modern class fields for Webpack 4
                test: /\.(cjs|mjs|js)$/,
                include: [
                    /[\\/]node_modules[\\/]@csstools[\\/]css-tokenizer[\\/]/,
                    /[\\/]node_modules[\\/]@csstools[\\/]css-parser-algorithms[\\/]/,
                    /[\\/]node_modules[\\/]@csstools[\\/]css-color-parser[\\/]/,
                    /[\\/]node_modules[\\/]@csstools[\\/]css-calc[\\/]/,
                    /[\\/]node_modules[\\/]@asamuzakjp[\\/]css-color[\\/]/
                ],
                loader: "esbuild-loader",
                options: {
                    loader: "js",
                    target: "es2018",
                    format: "cjs",
                    platform: "node"
                }
            },
            {
                test: /\.js$/,
                exclude: /\bturf\b|\bjsts\b/,
                use: {
                    loader: "esbuild-loader",
                    options: {
                        loader: "js",
                        // was upgraded to es2018 as tests failed
                        target: "es2018",
                        format: "cjs",
                        platform: "node"
                    }
                }
            },
            {
                test: /\.vue$/,
                loader: "vue-loader",
                options: {
                    isServerBuild: false
                }
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: "file-loader",
                options: {
                    name: "[name].[ext]"
                }
            },
            {
                test: /\.(le|c|sa|sc)ss$/,
                use: "null-loader"
            },
            {
                test: /\.(svg)$/,
                exclude: /fonts/, /* dont want svg fonts from fonts folder to be included */
                use: [
                    {
                        loader: "svg-url-loader",
                        options: {
                            noquotes: true
                        }
                    }
                ]
            },
            {
                test: /\.xml$/i,
                use: "raw-loader"
            },
            {
                test: /\.worker\.js$/,
                use: {
                    loader: "worker-loader"
                }
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: "file-loader"
                    }
                ]
            },
            {
                test: /\.m?js$/,
                include: [
                    /[\\/]node_modules[\\/]@vue[\\/]test-utils[\\/]/,
                    /[\\/]node_modules[\\/]@vue[\\/]devtools-api[\\/]/
                ],
                loader: "esbuild-loader",
                options: {
                    loader: "js",
                    target: "es2018",
                    format: "cjs",
                    platform: "node"
                }
            },
            {
                test: /\.mjs$/,
                include: /node_modules/,
                type: "javascript/auto"
            },
            {
                test: /@vue[\\/]server-renderer/,
                use: "null-loader"
            }
        ]
    },
    performance: {
        hints: false
    },
    plugins: [
        new webpack.ProvidePlugin({
            i18next: ["i18next/dist/cjs/i18next.js"],
            mapCollection: [path.resolve(path.join(__dirname, "../src/core/maps/js/mapCollection.js")), "default"],
            Config: path.resolve(__dirname, "../devtools/tests/testConfig")
        }),
        new VueLoaderPlugin(),
        new webpack.IgnorePlugin({resourceRegExp: /^canvas$/}),
        new webpack.IgnorePlugin(/^@asamuzakjp\/dom-selector$/),
        new webpack.DefinePlugin({
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            VUE_ADDONS: JSON.stringify({
                AddonControl: {
                    entry: "controls/addonControl/index.js",
                    path: "controls/addonControl",
                    type: "control"
                },
                AddonGFITheme: {
                    entry: "gfiThemes/theme/index.js",
                    path: "gfiThemes/theme",
                    type: "gfiTheme"
                },
                SearchAddon: {
                    entry: "searchAddon/index.js",
                    type: "searchInterface"
                },
                ToolAddon: {
                    entry: "toolAddon/index.js",
                    type: "tool"
                },
                JavaScriptAddon: {
                    entry: "verkehrsfunctions/index.js",
                    type: "javascript"
                }
            })
        })
    ],
    node: {
        fs: "empty"
    }
};
