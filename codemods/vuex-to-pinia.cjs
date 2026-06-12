/**
 * Generic jscodeshift codemod to migrate any Masterportal module's Vue component from Vuex to Pinia.
 *
 * Usage:
 *   npx jscodeshift --parser=babel --extensions=vue \
 *     --transform=./codemods/vuex-to-pinia.cjs \
 *     --storePath=../store/myModuleStore.pinia.js \
 *     --storeFunction=useMyModuleStore \
 *     src/modules/myModule/components/MyComponent.vue
 *
 * Options (passed via --key=value):
 *   --storePath       Relative import path to the Pinia store file (from the component).
 *                     Default: auto-detected from namespace (e.g. "../store/{module}Store.pinia.js")
 *   --storeFunction   The Pinia composable name (e.g. "useAboutStore").
 *                     Default: auto-generated from namespace (e.g. "Modules/About" -> "useAboutStore")
 *
 * What this transform does:
 * 1. Extracts the <script> block from .vue SFCs
 * 2. Removes `import { mapState, mapGetters, mapActions, mapMutations } from "vuex"`
 * 3. Detects all Vuex namespaced helpers (mapGetters, mapActions, mapMutations, mapState)
 * 4. For the TARGET module namespace: converts to Pinia setup() with storeToRefs + actions
 * 5. For OTHER namespaces (e.g. Menu): keeps them using direct store import access
 * 6. For root mapGetters/mapActions (no namespace): converts to direct store.getters access
 * 7. Adds proper Pinia imports
 * 8. Reassembles the .vue file
 */

module.exports = function transformer(fileInfo, api, options) {
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

    const root = j(scriptContent);

    // --- Step 1: Find vuex import and detect which helpers are used ---
    const vuexImports = root.find(j.ImportDeclaration, {
        source: {value: "vuex"}
    });

    if (vuexImports.length === 0) {
        return source;
    }

    vuexImports.remove();

    // --- Step 2: Analyze all mapHelper calls to detect the target module ---
    const defaultExport = root.find(j.ExportDefaultDeclaration);

    if (defaultExport.length === 0) {
        const transformed = root.toSource({quote: "double"});

        return beforeScript + scriptOpenTag + transformed + scriptCloseTag + afterScript;
    }

    const exportObj = defaultExport.get().node.declaration;

    if (exportObj.type !== "ObjectExpression") {
        const transformed = root.toSource({quote: "double"});

        return beforeScript + scriptOpenTag + transformed + scriptCloseTag + afterScript;
    }

    // Collect all namespaces used
    const namespaces = new Set();
    const helperPattern = /^map(State|Getters|Actions|Mutations)$/;

    function scanSpreadHelpers (properties) {
        for (const prop of properties) {
            if (prop.type === "SpreadElement" && prop.argument?.type === "CallExpression") {
                const callee = prop.argument.callee;

                if (callee?.name && helperPattern.test(callee.name)) {
                    const args = prop.argument.arguments;

                    if (args.length >= 2 && args[0].type === "Literal") {
                        namespaces.add(args[0].value);
                    }
                }
            }
        }
    }

    const computedProp = exportObj.properties.find(p => p.key?.name === "computed");
    const methodsProp = exportObj.properties.find(p => p.key?.name === "methods");

    if (computedProp?.value?.type === "ObjectExpression") {
        scanSpreadHelpers(computedProp.value.properties);
    }
    if (methodsProp?.value?.type === "ObjectExpression") {
        scanSpreadHelpers(methodsProp.value.properties);
    }

    // Determine target module namespace (the "Modules/X" one)
    const moduleNamespaces = [...namespaces].filter(ns => ns.startsWith("Modules/"));
    const targetNamespace = moduleNamespaces[0] || null;

    if (!targetNamespace) {
        // No Modules/ namespace found, nothing to migrate
        const transformed = root.toSource({quote: "double"});

        return beforeScript + scriptOpenTag + transformed + scriptCloseTag + afterScript;
    }

    // Derive module name from namespace: "Modules/About" -> "About"
    const moduleName = targetNamespace.split("/")[1];
    const moduleNameLower = moduleName[0].toLowerCase() + moduleName.slice(1);

    // Determine store function name and path
    const storeFunction = options.storeFunction || `use${moduleName}Store`;
    const storePath = options.storePath || `../store/${moduleNameLower}Store.pinia.js`;

    // Other namespaces that need direct Vuex store access
    const otherNamespaces = [...namespaces].filter(ns => ns !== targetNamespace);

    // --- Step 3: Add imports ---
    const allImports = root.find(j.ImportDeclaration);
    const lastImport = allImports.at(allImports.length - 1);

    const newImports = [
        j.importDeclaration(
            [j.importSpecifier(j.identifier("computed"))],
            j.literal("vue")
        ),
        j.importDeclaration(
            [j.importSpecifier(j.identifier("storeToRefs"))],
            j.literal("pinia")
        ),
        j.importDeclaration(
            [j.importSpecifier(j.identifier(storeFunction))],
            j.literal(storePath)
        )
    ];

    // If there are other namespaces, we need the app-store import
    if (otherNamespaces.length > 0) {
        newImports.push(
            j.importDeclaration(
                [j.importDefaultSpecifier(j.identifier("store"))],
                j.literal("../../../app-store/index.js")
            )
        );
    }

    // Check if vue computed import already exists
    const existingVueImport = root.find(j.ImportDeclaration, {source: {value: "vue"}});
    const hasComputedImport = existingVueImport.length > 0 && existingVueImport.get().node.specifiers.some(
        s => s.imported?.name === "computed"
    );

    if (lastImport.length) {
        // Add in reverse order so they appear correctly
        const importsToAdd = [...newImports].reverse();

        for (const imp of importsToAdd) {
            // Skip vue computed if already imported
            if (imp.source.value === "vue" && hasComputedImport) {
                continue;
            }
            lastImport.insertAfter(imp);
        }
    }

    // --- Step 4: Process computed - extract target module getters ---
    const targetGetters = [];
    const rootGetters = [];
    const otherGettersMap = {}; // namespace -> [getter names]

    if (computedProp?.value?.type === "ObjectExpression") {
        const newProperties = [];

        for (const prop of computedProp.value.properties) {
            if (prop.type === "SpreadElement" && prop.argument?.type === "CallExpression") {
                const callee = prop.argument.callee;
                const args = prop.argument.arguments;

                if (callee?.name === "mapGetters" || callee?.name === "mapState") {
                    // Namespaced: mapGetters("Namespace", [...])
                    if (args.length >= 2 && args[0].type === "Literal") {
                        const ns = args[0].value;
                        const getterArray = args[1];
                        const names = getterArray?.type === "ArrayExpression"
                            ? getterArray.elements.map(el => el.value)
                            : [];

                        if (ns === targetNamespace) {
                            targetGetters.push(...names);
                        }
                        else {
                            otherGettersMap[ns] = otherGettersMap[ns] || [];
                            otherGettersMap[ns].push(...names);
                        }
                        continue;
                    }
                    // Root: mapGetters([...])
                    else if (args.length === 1 && args[0].type === "ArrayExpression") {
                        rootGetters.push(...args[0].elements.map(el => el.value));
                        continue;
                    }
                }
            }
            newProperties.push(prop);
        }

        computedProp.value.properties = newProperties;

        // Remove computed property entirely if empty
        if (newProperties.length === 0) {
            const idx = exportObj.properties.indexOf(computedProp);

            if (idx !== -1) {
                exportObj.properties.splice(idx, 1);
            }
        }
    }

    // --- Step 5: Process methods - extract target module actions ---
    const targetActions = [];
    const otherActionsMap = {}; // namespace -> [action names]
    const rootActions = [];

    if (methodsProp?.value?.type === "ObjectExpression") {
        const newMethods = [];

        for (const prop of methodsProp.value.properties) {
            if (prop.type === "SpreadElement" && prop.argument?.type === "CallExpression") {
                const callee = prop.argument.callee;
                const args = prop.argument.arguments;

                if (callee?.name === "mapActions" || callee?.name === "mapMutations") {
                    // Namespaced
                    if (args.length >= 2 && args[0].type === "Literal") {
                        const ns = args[0].value;
                        const actionArray = args[1];
                        const names = actionArray?.type === "ArrayExpression"
                            ? actionArray.elements.map(el => el.value)
                            : [];

                        if (ns === targetNamespace) {
                            targetActions.push(...names);
                        }
                        else {
                            otherActionsMap[ns] = otherActionsMap[ns] || [];
                            otherActionsMap[ns].push(...names);
                        }
                        continue;
                    }
                    // Root
                    else if (args.length === 1 && args[0].type === "ArrayExpression") {
                        rootActions.push(...args[0].elements.map(el => el.value));
                        continue;
                    }
                }
            }
            newMethods.push(prop);
        }

        methodsProp.value.properties = newMethods;
    }

    // --- Step 6: Build setup() function ---
    const storeVarName = `${moduleNameLower}Store`;
    const setupStatements = [];

    // const myStore = useMyStore()
    setupStatements.push(
        j.variableDeclaration("const", [
            j.variableDeclarator(
                j.identifier(storeVarName),
                j.callExpression(j.identifier(storeFunction), [])
            )
        ])
    );

    // Build return object properties
    const returnProperties = [];

    // ...storeToRefs(myStore) — exposes all state as refs
    returnProperties.push(
        j.spreadElement(
            j.callExpression(j.identifier("storeToRefs"), [j.identifier(storeVarName)])
        )
    );

    // Expose each action explicitly: actionName: myStore.actionName
    for (const action of targetActions) {
        returnProperties.push(
            j.property("init", j.identifier(action),
                j.memberExpression(j.identifier(storeVarName), j.identifier(action))
            )
        );
    }

    // Handle other namespaces via computed getters from store
    for (const [ns, getterNames] of Object.entries(otherGettersMap)) {
        for (const name of getterNames) {
            // const mainMenu = computed(() => store.getters["Menu/mainMenu"])
            setupStatements.push(
                j.variableDeclaration("const", [
                    j.variableDeclarator(
                        j.identifier(name),
                        j.callExpression(j.identifier("computed"), [
                            j.arrowFunctionExpression([],
                                j.memberExpression(
                                    j.memberExpression(j.identifier("store"), j.identifier("getters")),
                                    j.literal(`${ns}/${name}`),
                                    true
                                )
                            )
                        ])
                    )
                ])
            );
            returnProperties.push(j.property("init", j.identifier(name), j.identifier(name)));
        }
    }

    // Handle other namespace actions via wrapper functions
    for (const [ns, actionNames] of Object.entries(otherActionsMap)) {
        for (const name of actionNames) {
            // function actionName(payload) { store.dispatch("Ns/actionName", payload); }
            setupStatements.push(
                j.functionDeclaration(
                    j.identifier(name),
                    [j.identifier("payload")],
                    j.blockStatement([
                        j.expressionStatement(
                            j.callExpression(
                                j.memberExpression(j.identifier("store"), j.identifier("dispatch")),
                                [j.literal(`${ns}/${name}`), j.identifier("payload")]
                            )
                        )
                    ])
                )
            );
            returnProperties.push(j.property("init", j.identifier(name), j.identifier(name)));
        }
    }

    // Handle root getters
    for (const name of rootGetters) {
        setupStatements.push(
            j.variableDeclaration("const", [
                j.variableDeclarator(
                    j.identifier(name),
                    j.callExpression(j.identifier("computed"), [
                        j.arrowFunctionExpression([],
                            j.memberExpression(
                                j.memberExpression(j.identifier("store"), j.identifier("getters")),
                                j.literal(name),
                                true
                            )
                        )
                    ])
                )
            ])
        );
        returnProperties.push(j.property("init", j.identifier(name), j.identifier(name)));
    }

    // Handle root actions
    for (const name of rootActions) {
        setupStatements.push(
            j.functionDeclaration(
                j.identifier(name),
                [j.identifier("payload")],
                j.blockStatement([
                    j.expressionStatement(
                        j.callExpression(
                            j.memberExpression(j.identifier("store"), j.identifier("dispatch")),
                            [j.literal(name), j.identifier("payload")]
                        )
                    )
                ])
            )
        );
        returnProperties.push(j.property("init", j.identifier(name), j.identifier(name)));
    }

    // return { ... }
    setupStatements.push(j.returnStatement(j.objectExpression(returnProperties)));

    // Build setup() method
    const setupMethod = j.property(
        "init",
        j.identifier("setup"),
        j.functionExpression(null, [], j.blockStatement(setupStatements))
    );

    setupMethod.method = true;

    // Remove existing setup if present
    const existingSetupIdx = exportObj.properties.findIndex(p => p.key?.name === "setup");

    if (existingSetupIdx !== -1) {
        exportObj.properties.splice(existingSetupIdx, 1);
    }

    // Insert setup after components (or after name if no components)
    const componentsIdx = exportObj.properties.findIndex(p => p.key?.name === "components");
    const nameIdx = exportObj.properties.findIndex(p => p.key?.name === "name");
    const insertIdx = componentsIdx !== -1 ? componentsIdx + 1 : (nameIdx !== -1 ? nameIdx + 1 : 0);

    exportObj.properties.splice(insertIdx, 0, setupMethod);

    // --- Reassemble ---
    const transformedScript = root.toSource({quote: "double"});

    return beforeScript + scriptOpenTag + transformedScript + scriptCloseTag + afterScript;
};

module.exports.parser = "babel";
