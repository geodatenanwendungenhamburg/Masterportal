import changeCase from "@shared/js/utils/changeCase.js";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

const actions = {
    /**
     * Sets the state for the configured modules based on the provided menu models and side.
     *
     * This function iterates over each module in the `menuModels` array and checks if the module has a `type` defined.
     * If so, it checks whether the module has already been added to the store for the given `menuSide`.
     * @param {Object} param store context
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.rootState the rootState
     * @param {Object} payload The payload.
     * @param {Object[]} payload.menuModels The configured modules by menu.
     * @param {String} payload.menuSide The menu side.
     * @returns {void}
     */
    setConfiguredModuleStates ({commit, dispatch, rootState}, {menuModels, menuSide}) {
        menuModels.forEach(module => {
            if (module?.type) {
                const moduleKey = changeCase.upperFirst(module.type),
                    existingModuleState = rootState.Modules[moduleKey];

                if (!existingModuleState || existingModuleState.menuSide !== menuSide) {
                    dispatch("extendModuleState", {module, menuSide});
                    commit("addConfiguredModel", {
                        menuSide: menuSide,
                        state: rootState.Modules[moduleKey]
                    });
                }
            }
        });
    },

    /**
     * Add attributes to module state, because to show in menu.
     * @param {Object} param store context
     * @param {Object} param.rootState the rootState
     * @param {Object} payload The payload.
     * @param {Object} payload.module The module.
     * @param {String} payload.menuSide The menu side.
     * @returns {void}
     */
    extendModuleState ({rootState}, {module, menuSide}) {
        rootState.Modules[changeCase.upperFirst(module.type)] = {
            ...rootState.Modules[changeCase.upperFirst(module.type)],
            ...{
                menuSide: menuSide
            },
            ...module
        };
    },

    /**
     * Activates or deactivates the associated module of the clicked control.
     * @param {Object} param store context
     * @param {Object} payload The payload.
     * @param {Object} payload.moduleState The vuex states the clicked module-control.
     * @param {String} payload.menuSide The menu side.
     * @returns {void}
     */
    onClick (_, {moduleState, menuSide}) {
        const menuStore = useMenuStore();

        if (menuStore.currentComponent(menuSide).type !== moduleState.type) {
            menuStore.changeCurrentComponent({
                type: moduleState.type,
                side: menuSide,
                props: {name: moduleState.name}
            });

            if (!menuStore.expanded(menuSide)) {
                menuStore.toggleMenu(menuSide);
            }
        }
        else {
            menuStore[menuSide].navigation.currentComponent = {props: [], type: "root"};
            menuStore[menuSide].navigation.history = [];
            menuStore[menuSide].currentComponent = "root";

            menuStore.resetCurrentMouseMapInteractionsComponent(menuSide);
        }
    }
};

export default actions;
