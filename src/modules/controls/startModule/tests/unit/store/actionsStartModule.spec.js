import {expect} from "chai";
import sinon from "sinon";
import actions from "@modules/controls/startModule/store/actionsStartModule.js";
import {createPinia, setActivePinia} from "pinia";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

const {
    setConfiguredModuleStates,
    extendModuleState,
    onClick
} = actions;


describe("src/modules/controls/startModule/store/actionsStartModule.js", () => {
    let commit,
        dispatch,
        map,
        rootState;

    beforeEach(() => {
        mapCollection.clear();

        commit = sinon.spy();
        dispatch = sinon.spy();
        rootState = {
            Modules: {
                Abc: {
                    type: "abc"
                },
                Xyz: {
                    type: "xyz"
                }
            }
        };

        map = {
            id: "ol",
            mode: "2D",
            removeLayer: () => sinon.spy()
        };

        mapCollection.addMap(map, "2D");

        setActivePinia(createPinia());
    });


    describe("setConfiguredModuleStates", () => {
        it("should set state of the configured modules", () => {
            const menuModels = [
                    {
                        type: "abc"
                    },
                    {
                        type: "xyz"
                    }
                ],
                menuSide = "secondaryMenu";

            setConfiguredModuleStates({commit, dispatch, rootState}, {menuModels, menuSide});

            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("addConfiguredModel");
            expect(commit.firstCall.args[1]).to.deep.equals({
                menuSide: menuSide,
                state: {
                    type: "abc"
                }
            });
            expect(commit.secondCall.args[0]).to.equals("addConfiguredModel");
            expect(commit.secondCall.args[1]).to.deep.equals({
                menuSide: menuSide,
                state: {
                    type: "xyz"
                }
            });

            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("extendModuleState");
            expect(dispatch.firstCall.args[1]).to.deep.equals({
                module: {
                    type: "abc"
                },
                menuSide: menuSide
            });
            expect(dispatch.secondCall.args[0]).to.equals("extendModuleState");
            expect(dispatch.secondCall.args[1]).to.deep.equals({
                module: {
                    type: "xyz"
                },
                menuSide: menuSide
            });
        });
        it("should not dispatch or commit if module state matches the current menu side", () => {
            const menuModels = [
                    {
                        type: "abc"
                    },
                    {
                        type: "xyz"
                    }
                ],
                menuSide = "secondaryMenu";

            rootState.Modules.Abc.menuSide = "secondaryMenu";
            rootState.Modules.Xyz.menuSide = "secondaryMenu";

            setConfiguredModuleStates({commit, dispatch, rootState}, {menuModels, menuSide});

            expect(dispatch.notCalled).to.be.true;
            expect(commit.notCalled).to.be.true;
        });
    });

    describe("extendModuleState", () => {
        it("should extend the state of the configured module", () => {
            const module = {
                    type: "abc"
                },
                menuSide = "secondaryMenu";

            extendModuleState({rootState}, {module, menuSide});

            expect(commit.notCalled).to.be.true;
            expect(dispatch.notCalled).to.be.true;
            expect(rootState.Modules).to.deep.equals({
                Abc: {
                    type: "abc",
                    menuSide: menuSide
                },
                Xyz: {
                    type: "xyz"
                }
            });
        });
    });

    describe("onClick", () => {
        it("should reset meu and activate menu navigation, if module is active", () => {
            const moduleState = {
                    type: "selectFeatures",
                    name: "common:xyz"
                },
                menuSide = "secondaryMenu",
                menuStore = useMenuStore(),
                changeCurrentComponentSpy = sinon.spy(menuStore, "changeCurrentComponent"),
                toggleMenuSpy = sinon.spy(menuStore, "toggleMenu");

            onClick({}, {moduleState, menuSide});

            expect(changeCurrentComponentSpy.calledOnce).to.be.true;
            expect(changeCurrentComponentSpy.firstCall.args[0]).to.deep.equals({
                type: "selectFeatures",
                side: menuSide,
                props: {
                    name: "common:xyz"
                }
            });

            expect(toggleMenuSpy.calledOnce).to.be.true;
            expect(toggleMenuSpy.firstCall.args[0]).to.equals(menuSide);
        });

        it("should reset meu and don't activate menu navigation, if module is not active", () => {
            const moduleState = {
                    type: "selectFeatures",
                    name: "common:xyz"
                },
                menuSide = "secondaryMenu",
                menuStore = useMenuStore(),
                resetCurrentMouseMapInteractionsComponentSpy = sinon.spy(
                    menuStore,
                    "resetCurrentMouseMapInteractionsComponent"
                );

            menuStore.secondaryMenu.navigation.currentComponent = {
                type: "selectFeatures",
                props: []
            };
            menuStore.secondaryMenu.currentComponent = "selectFeatures";

            onClick({}, {moduleState, menuSide});

            expect(menuStore.secondaryMenu.navigation.currentComponent).to.deep.equals({
                props: [],
                type: "root"
            });
            expect(menuStore.secondaryMenu.navigation.history).to.deep.equals([]);
            expect(menuStore.secondaryMenu.currentComponent).to.equals("root");

            expect(resetCurrentMouseMapInteractionsComponentSpy.calledOnce).to.be.true;
            expect(resetCurrentMouseMapInteractionsComponentSpy.firstCall.args[0]).to.equals(menuSide);
        });
    });
});
