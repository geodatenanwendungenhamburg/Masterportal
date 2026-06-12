/**
 * jscodeshift codemod to migrate the About module's Vue component from Vuex to Pinia.
 *
 * Usage:
 *   npx jscodeshift --parser=babel --extensions=vue \
 *     --transform=./codemods/about-vuex-to-pinia.cjs \
 *     src/modules/about/components/AboutModule.vue
 *
 * What this transform does:
 * 1. Removes `import { mapActions, mapGetters } from "vuex"`
 * 2. Adds `import { useAboutStore } from "../store/aboutStore.pinia.js"`
 * 3. Replaces `...mapGetters("Modules/About", [...])` with storeToRefs usage
 * 4. Replaces `...mapActions("Modules/About", [...])` with direct store method calls
 * 5. Adds a setup() function that instantiates the Pinia store
 *
 * NOTE: This codemod handles .vue SFC files by extracting the <script> block,
 *       transforming the JS, and reassembling the file.
 */

module.exports = function transformer(fileInfo, api) {
    const j = api.jscodeshift;
    const source = fileInfo.source;

    // --- Handle .vue SFC: extract <script> block ---
    const scriptMatch = source.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/);

    if (!scriptMatch) {
        return source;
    }

    const beforeScript = source.slice(0, scriptMatch.index);
    const scriptOpenTag = scriptMatch[1];
    const scriptContent = scriptMatch[2];
    const scriptCloseTag = scriptMatch[3];
    const afterScript = source.slice(scriptMatch.index + scriptMatch[0].length);

    // Parse only the JS inside <script>
    const root = j(scriptContent);

    // --- Step 1: Find and remove vuex import ---
    const vuexImports = root.find(j.ImportDeclaration, {
        source: {value: "vuex"}
    });

    if (vuexImports.length === 0) {
        // No vuex usage — skip
        return source;
    }

    vuexImports.remove();

    // --- Step 2: Add Pinia imports ---
    // Find the first import to insert after
    const allImports = root.find(j.ImportDeclaration);
    const lastImport = allImports.at(allImports.length - 1);

    const piniaImports = [
        j.importDeclaration(
            [j.importSpecifier(j.identifier("storeToRefs"))],
            j.literal("pinia")
        ),
        j.importDeclaration(
            [j.importSpecifier(j.identifier("useAboutStore"))],
            j.literal("../store/aboutStore.pinia.js")
        )
    ];

    if (lastImport.length) {
        lastImport.insertAfter(piniaImports[1]);
        lastImport.insertAfter(piniaImports[0]);
    }

    // --- Step 3: Transform the default export (Options API) ---
    const defaultExport = root.find(j.ExportDefaultDeclaration);

    if (defaultExport.length === 0) {
        const transformedScript = root.toSource({quote: "double"});

        return beforeScript + scriptOpenTag + transformedScript + scriptCloseTag + afterScript;
    }

    const exportObj = defaultExport.get().node.declaration;

    if (exportObj.type !== "ObjectExpression") {
        const transformedScript = root.toSource({quote: "double"});

        return beforeScript + scriptOpenTag + transformedScript + scriptCloseTag + afterScript;
    }

    // Find computed property
    const computedProp = exportObj.properties.find(
        p => p.key && p.key.name === "computed"
    );

    // Find methods property
    const methodsProp = exportObj.properties.find(
        p => p.key && p.key.name === "methods"
    );

    // --- Step 3a: Transform computed ---
    if (computedProp && computedProp.value.type === "ObjectExpression") {
        const newProperties = [];
        const aboutGetters = [];
        let hasConfigJsGetter = false;
        let hasMenuGetters = false;
        const menuGetters = [];

        for (const prop of computedProp.value.properties) {
            if (prop.type === "SpreadElement") {
                const callExpr = prop.argument;

                if (callExpr && callExpr.type === "CallExpression") {
                    const callee = callExpr.callee;

                    // mapGetters(["configJs"])
                    if (callee.name === "mapGetters" && callExpr.arguments.length === 1) {
                        hasConfigJsGetter = true;
                        continue;
                    }

                    // mapGetters("Modules/About", [...])
                    if (callee.name === "mapGetters" && callExpr.arguments.length === 2) {
                        const namespace = callExpr.arguments[0];

                        if (namespace.value === "Modules/About") {
                            const getterArray = callExpr.arguments[1];

                            if (getterArray.type === "ArrayExpression") {
                                for (const el of getterArray.elements) {
                                    aboutGetters.push(el.value);
                                }
                            }
                            continue;
                        }
                        if (namespace.value === "Menu") {
                            hasMenuGetters = true;
                            const getterArray = callExpr.arguments[1];

                            if (getterArray.type === "ArrayExpression") {
                                for (const el of getterArray.elements) {
                                    menuGetters.push(el.value);
                                }
                            }
                            continue;
                        }
                    }
                }
            }
            // Keep non-mapGetters computed properties as-is
            newProperties.push(prop);
        }

        // Replace the computed block content
        computedProp.value.properties = newProperties;

        // We'll add a setup() function or modify the component to use store
        // For Options API compatibility, we use a setup() function approach
    }

    // --- Step 3b: Transform methods ---
    if (methodsProp && methodsProp.value.type === "ObjectExpression") {
        const newMethods = [];
        const aboutActions = [];
        const menuActions = [];

        for (const prop of methodsProp.value.properties) {
            if (prop.type === "SpreadElement") {
                const callExpr = prop.argument;

                if (callExpr && callExpr.type === "CallExpression") {
                    const callee = callExpr.callee;

                    if (callee.name === "mapActions" && callExpr.arguments.length === 2) {
                        const namespace = callExpr.arguments[0];

                        if (namespace.value === "Modules/About") {
                            const actionArray = callExpr.arguments[1];

                            if (actionArray.type === "ArrayExpression") {
                                for (const el of actionArray.elements) {
                                    aboutActions.push(el.value);
                                }
                            }
                            continue;
                        }
                        if (namespace.value === "Menu") {
                            const actionArray = callExpr.arguments[1];

                            if (actionArray.type === "ArrayExpression") {
                                for (const el of actionArray.elements) {
                                    menuActions.push(el.value);
                                }
                            }
                            continue;
                        }
                    }
                }
            }
            newMethods.push(prop);
        }

        methodsProp.value.properties = newMethods;
    }

    // --- Step 4: Add setup() function that exposes store refs ---
    // Remove existing setup if present
    const existingSetup = exportObj.properties.findIndex(
        p => p.key && p.key.name === "setup"
    );

    if (existingSetup !== -1) {
        exportObj.properties.splice(existingSetup, 1);
    }

    // Build the setup function
    const setupBody = j.blockStatement([
        // const aboutStore = useAboutStore()
        j.variableDeclaration("const", [
            j.variableDeclarator(
                j.identifier("aboutStore"),
                j.callExpression(j.identifier("useAboutStore"), [])
            )
        ]),
        // return { ...storeToRefs(aboutStore), ...aboutStore }
        j.returnStatement(
            j.objectExpression([
                j.spreadElement(
                    j.callExpression(j.identifier("storeToRefs"), [j.identifier("aboutStore")])
                ),
                // Expose actions directly
                j.spreadElement(j.identifier("aboutStore"))
            ])
        )
    ]);

    const setupMethod = j.property(
        "init",
        j.identifier("setup"),
        j.functionExpression(null, [], setupBody)
    );

    setupMethod.method = true;

    // Insert setup after components
    const componentsIndex = exportObj.properties.findIndex(
        p => p.key && p.key.name === "components"
    );

    exportObj.properties.splice(componentsIndex + 1, 0, setupMethod);

    // --- Reassemble the .vue file ---
    const transformedScript = root.toSource({quote: "double"});

    return beforeScript + scriptOpenTag + transformedScript + scriptCloseTag + afterScript;
};

module.exports.parser = "babel";
