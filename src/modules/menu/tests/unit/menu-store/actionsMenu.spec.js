import {expect} from "chai";
import sinon from "sinon";
import {nextTick} from "vue";
import actions from "../../../menu-store/actionsMenu";

describe("src/modules/menu/menu-store/actionsMenu.js", () => {
    let commit,
        dispatch,
        getters,
        state,
        rootGetters;

    beforeEach(() => {
        state = {
            currentMouseMapInteractionsComponent: "getFeatureInfo",
            defaultComponent: "getFeatureInfo",
            mainMenu: {
                expanded: false,
                currentComponent: "root",
                title: null,
                toggleButtonIcon: "bi-list",
                sections: [[]],
                navigation: {
                    currentComponent: {
                        type: "root",
                        props: []
                    },
                    history: []
                }
            },
            secondaryMenu: {
                expanded: false,
                currentComponent: "root",
                sections: [[]],
                title: null,
                toggleButtonIcon: "bi-tools",
                navigation: {
                    currentComponent: {
                        type: "root",
                        props: []
                    },
                    history: []
                }
            }
        };
        commit = sinon.spy();
        dispatch = sinon.spy();
        getters = {
            currentComponent: () => {
                return {
                    type: "abc"
                };
            }
        };
        rootGetters = {
            "Modules/Abc/hasMouseMapInteractions": () => true,
            "Modules/SearchBar/showAllResults": () => false,
            "Modules/FileImport/name": "File Import",
            isMobile: false
        };
        global.window.open = sinon.spy();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("activateCurrentComponent", () => {
        it("should activate current component and expand the menu side", () => {
            const currentComponent = {
                    type: "fileImport"
                },
                side = "mainMenu",
                type = "FileImport";

            actions.activateCurrentComponent({commit, dispatch, rootGetters}, {currentComponent, type, side});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("setExpandedBySide");
            expect(commit.firstCall.args[1]).to.deep.equals({
                expanded: true,
                side: side
            });
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("changeCurrentComponent");
            expect(dispatch.firstCall.args[1]).to.deep.equals({
                type: currentComponent.type,
                side: side,
                props: {
                    name: "File Import"
                }
            });
        });
    });

    describe("changeCurrentComponent", () => {
        it("should set current component and change current map interactions component", () => {
            const type = "abc",
                side = "mainMenu",
                props = {
                    name: "common:modules.menu.abc"
                };

            actions.changeCurrentComponent({commit, dispatch, state}, {type, side, props});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("setCurrentComponent");
            expect(commit.firstCall.args[1]).to.deep.equals({type, side, props});
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equals("changeCurrentMouseMapInteractionsComponent");
            expect(dispatch.firstCall.args[1]).to.deep.equals({type, side});
        });

        it("should setCurrentComponentProps, if only props name changed", () => {
            const type = "abc",
                side = "mainMenu",
                props = {
                    name: "common:menu.abc"
                };

            state[side].navigation.currentComponent.type = type;
            actions.changeCurrentComponent({commit, dispatch, state}, {type, side, props});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("setCurrentComponentProps");
            expect(commit.firstCall.args[1]).to.deep.equals({side, props});
            expect(dispatch.notCalled).to.be.true;
        });
    });

    describe("changeCurrentMouseMapInteractionsComponent", () => {
        it("should set current map interactions component", () => {
            const type = "abc",
                side = "mainMenu";

            actions.changeCurrentMouseMapInteractionsComponent({commit, rootGetters, state}, {type, side});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("setCurrentMouseMapInteractionsComponent");
            expect(commit.firstCall.args[1]).to.equals(type);
        });

        it("should switch secondaryMenu to root and set current map interactions component", () => {
            const type = "abc",
                side = "mainMenu";

            Object.assign(state, {
                secondaryMenu: {
                    navigation: {
                        currentComponent: {
                            type: "getFeatureInfo",
                            props: {
                                name: "common:gfi"
                            }
                        },
                        history: []
                    }
                }
            });

            actions.changeCurrentMouseMapInteractionsComponent({commit, rootGetters, state}, {type, side});

            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("switchToRoot");
            expect(commit.firstCall.args[1]).to.equals("secondaryMenu");
            expect(commit.secondCall.args[0]).to.equals("setCurrentMouseMapInteractionsComponent");
            expect(commit.secondCall.args[1]).to.equals(type);
        });
    });

    describe("clickedMenuElement", () => {
        const name = "common:abc",
            path = ["generic"],
            side = "mainMenu";
        let type,
            properties;

        it("should change current component without path", () => {
            type = "abc";

            actions.clickedMenuElement({dispatch, rootGetters}, {name, path, side, type});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("changeCurrentComponent");
            expect(dispatch.firstCall.args[1]).to.deep.equal({type: type, side: side, props: {name: name}});
        });

        it("should change current component with path for type === 'folder'", async () => {
            type = "folder";

            actions.clickedMenuElement({dispatch, rootGetters}, {name, path, side, type});

            await nextTick(() => {
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("changeCurrentComponent");
                expect(dispatch.firstCall.args[1]).to.deep.equal({type: type, side: side, props: {path: path, name: name}});
            });
        });

        it("should open new tab if type is 'customMenuElement' and properties contains 'openURL'", () => {
            type = "customMenuElement";
            properties = {
                openURL: "http://url.de"
            };

            actions.clickedMenuElement({dispatch, rootGetters}, {name, path, side, type, properties});

            expect(dispatch.notCalled).to.be.true;
            expect(global.window.open.calledOnce).to.be.true;
            expect(global.window.open.firstCall.args[0]).to.equal(properties.openURL);
        });

        it("should open new tab if type is 'customMenuElement' and properties contains 'openURL' and 'execute", () => {
            type = "customMenuElement";
            properties = {
                openURL: "http://url.de",
                execute: {
                    action: "Alerting/addSingleAlert",
                    payload: {"title": "An alle Menschen", "content": "Hallo Welt"}
                }
            };

            actions.clickedMenuElement({dispatch, rootGetters}, {name, path, side, type, properties});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal(properties.execute.action);
            expect(dispatch.firstCall.args[1]).to.be.deep.equal(properties.execute.payload);
            expect(dispatch.firstCall.args[2]).to.be.deep.equal({root: true});
            expect(global.window.open.calledOnce).to.be.true;
            expect(global.window.open.firstCall.args[0]).to.equal(properties.openURL);
        });

        it("should execute action if type is 'customMenuElement' and properties contains only 'execute", () => {
            type = "customMenuElement";
            properties = {
                execute: {
                    action: "Alerting/addSingleAlert",
                    payload: {"title": "An alle Menschen", "content": "Hallo Welt"}
                }
            };

            actions.clickedMenuElement({dispatch, rootGetters}, {name, path, side, type, properties});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal(properties.execute.action);
            expect(dispatch.firstCall.args[1]).to.be.deep.equal(properties.execute.payload);
            expect(dispatch.firstCall.args[2]).to.be.deep.equal({root: true});
        });

        it("mobile: should execute action if type is 'customMenuElement' and properties contains only execute, closes menu", () => {
            rootGetters.isMobile = true;
            type = "customMenuElement";
            properties = {
                execute: {
                    action: "Alerting/addSingleAlert",
                    payload: {"title": "An alle Menschen", "content": "Hallo Welt"}
                }
            };

            actions.clickedMenuElement({dispatch, rootGetters}, {name, path, side, type, properties});

            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal(properties.execute.action);
            expect(dispatch.firstCall.args[1]).to.be.deep.equal(properties.execute.payload);
            expect(dispatch.firstCall.args[2]).to.be.deep.equal({root: true});
            expect(dispatch.secondCall.args[0]).to.equal("Menu/toggleMenu");
            expect(dispatch.secondCall.args[1]).to.equal(side);
            expect(dispatch.secondCall.args[2]).to.be.deep.equal({root: true});
        });

        it("mobile: should open new tab if type is 'customMenuElement' and properties contains 'openURL', closes menu", () => {
            rootGetters.isMobile = true;
            type = "customMenuElement";
            properties = {
                openURL: "http://url.de"
            };

            actions.clickedMenuElement({dispatch, rootGetters}, {name, path, side, type, properties});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Menu/toggleMenu");
            expect(dispatch.firstCall.args[1]).to.equal(side);
            expect(dispatch.firstCall.args[2]).to.be.deep.equal({root: true});
            expect(global.window.open.calledOnce).to.be.true;
            expect(global.window.open.firstCall.args[0]).to.equal(properties.openURL);
        });
    });

    describe("navigateBack", () => {
        let side = "mainMenu";

        it("should switch to previous component", async () => {
            rootGetters = {
                "Modules/SearchBar/showAllResults": false,
                "Modules/SearchBar/globalPlaceholder": "placeholder"
            };
            getters = {
                currentComponent: () => {
                    return {
                        type: "searchBar"
                    };
                }
            };

            actions.navigateBack({commit, dispatch, getters, state, rootGetters}, side);

            await nextTick(() => {
                expect(commit.calledTwice).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("switchToPreviousComponent");
                expect(commit.firstCall.args[1]).to.equal(side);
                expect(commit.secondCall.args[0]).to.equal("Modules/SearchBar/setPlaceholder");
                expect(commit.secondCall.args[1]).to.equal("placeholder");

                expect(dispatch.notCalled).to.be.true;
            });
        });

        it("should switch to previous component and change current mouse map interactionscomponent'", async () => {
            Object.assign(state, {currentMouseMapInteractionsComponent: "abc"});

            rootGetters = {"Modules/SearchBar/showAllResults": false};

            actions.navigateBack({commit, dispatch, getters, state, rootGetters}, side);

            await nextTick(() => {
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("switchToPreviousComponent");
                expect(commit.firstCall.args[1]).to.equal(side);
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("changeCurrentMouseMapInteractionsComponent");
                expect(dispatch.firstCall.args[1]).to.deep.equal({type: state.defaultComponent, side});
            });
        });

        it("should switch to previous component if searchbar showAllResults=true but on other menu side", async () => {
            Object.assign(state, {currentMouseMapInteractionsComponent: "abc"});
            side = "secondaryMenu";
            rootGetters = {
                "Modules/SearchBar/showAllResults": true,
                "Modules/SearchBar/currentSide": "mainMenu"
            };

            actions.navigateBack({commit, dispatch, getters, state, rootGetters}, side);

            await nextTick(() => {
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("switchToPreviousComponent");
                expect(commit.firstCall.args[1]).to.equal(side);
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("changeCurrentMouseMapInteractionsComponent");
                expect(dispatch.firstCall.args[1]).to.deep.equal({type: state.defaultComponent, side});
            });
        });

        it("should resetSearchbarNavigation - no action event", async () => {
            side = "mainMenu";
            rootGetters = {
                "Modules/SearchBar/showAllResults": true,
                "Modules/SearchBar/currentSide": "mainMenu",
                "Modules/SearchBar/currentActionEvent": "",
                "Modules/SearchBar/globalPlaceholder": "placeholder"
            };
            getters = {
                currentComponent: () => {
                    return {
                        type: "searchBar"
                    };
                }
            };

            actions.navigateBack({commit, dispatch, getters, state, rootGetters}, side);

            await nextTick(() => {
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setPlaceholder");
                expect(commit.firstCall.args[1]).to.equal("placeholder");
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("resetSearchbarNavigation");
                expect(dispatch.firstCall.args[1]).to.deep.equals({side});
            });
        });

        it("should navigateSearchbarInLayerSelection if current component is layerSelection - no action event", async () => {
            side = "mainMenu";
            rootGetters = {
                "Modules/SearchBar/showAllResults": true,
                "Modules/SearchBar/currentSide": "mainMenu",
                "Modules/SearchBar/currentActionEvent": ""
            };
            getters = {
                currentComponent: () => {
                    return {
                        type: "layerSelection"
                    };
                }
            };

            actions.navigateBack({commit, dispatch, getters, state, rootGetters}, side);

            await nextTick(() => {
                expect(commit.notCalled).to.be.true;
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("navigateSearchbarInLayerSelection");
                expect(dispatch.firstCall.args[1]).to.deep.equals({side});
            });
        });

        it("should navigateSearchbarActionEventNotInLayerSelection if current component is searchBar - with action event", async () => {
            side = "mainMenu";
            rootGetters = {
                "Modules/SearchBar/showAllResults": true,
                "Modules/SearchBar/currentSide": "mainMenu",
                "Modules/SearchBar/currentActionEvent": "showInTree",
                "Modules/SearchBar/globalPlaceholder": "placeholder"
            };
            getters = {
                currentComponent: () => {
                    return {
                        type: "searchBar"
                    };
                }
            };

            actions.navigateBack({commit, dispatch, getters, state, rootGetters}, side);

            await nextTick(() => {
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setPlaceholder");
                expect(commit.firstCall.args[1]).to.equal("placeholder");
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("navigateSearchbarActionEventNotInLayerSelection");
                expect(dispatch.firstCall.args[1]).to.deep.equals({side});
            });
        });

        it("should switchToPreviousComponent if current component is layerInformation - with action event", async () => {
            side = "mainMenu";
            rootGetters = {
                "Modules/SearchBar/showAllResults": true,
                "Modules/SearchBar/currentSide": "mainMenu",
                "Modules/SearchBar/currentActionEvent": "showLayerInfo"
            };
            getters = {
                currentComponent: () => {
                    return {
                        type: "layerInformation"
                    };
                }
            };

            actions.navigateBack({commit, dispatch, getters, state, rootGetters}, side);

            await nextTick(() => {
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("switchToPreviousComponent");
                expect(commit.firstCall.args[1]).to.equal(side);
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("navigateSearchbarActionEventNotInLayerSelection");
                expect(dispatch.firstCall.args[1]).to.deep.equals({side});
            });
        });
        it("should switchToPreviousComponent if current component is layerInformation - with action event and showAllResults is false", async () => {
            side = "mainMenu";
            rootGetters = {
                "Modules/SearchBar/showAllResults": false,
                "Modules/SearchBar/currentSide": "mainMenu",
                "Modules/SearchBar/currentActionEvent": "showLayerInfo"
            };
            getters = {
                currentComponent: () => {
                    return {
                        type: "layerInformation"
                    };
                }
            };

            actions.navigateBack({commit, dispatch, getters, state, rootGetters}, side);

            await nextTick(() => {
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("switchToPreviousComponent");
                expect(commit.firstCall.args[1]).to.equal(side);
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("navigateSearchbarActionEventNotInLayerSelection");
                expect(dispatch.firstCall.args[1]).to.deep.equals({side});
            });
        });
    });
    describe("navigateSearchbarActionEventNotInLayerSelection", () => {
        const side = "mainMenu";

        it("if action event is not 'showInTree' and not 'showLayerInfo' shall reset searchbar navigation and current action event", async () => {
            rootGetters = {
                "Modules/SearchBar/currentActionEvent": "otherActionEvent"
            };

            actions.navigateSearchbarActionEventNotInLayerSelection({commit, dispatch, rootGetters}, {side: side});

            await nextTick(() => {
                expect(commit.calledTwice).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setShowSearchResultsInTree");
                expect(commit.firstCall.args[1]).to.be.false;
                expect(commit.secondCall.args[0]).to.equal("Modules/SearchBar/setCurrentActionEvent");
                expect(commit.secondCall.args[1]).to.equal("");

                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("resetSearchbarNavigation");
                expect(dispatch.firstCall.args[1]).to.deep.equals({side});
            });
        });

        it("if action event is 'showInTree' shall not reset searchbar navigation and shall reset current action event", async () => {
            rootGetters = {
                "Modules/SearchBar/currentActionEvent": "showInTree"
            };

            actions.navigateSearchbarActionEventNotInLayerSelection({commit, dispatch, rootGetters}, {side: side});

            await nextTick(() => {
                expect(commit.calledThrice).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setShowSearchResultsInTree");
                expect(commit.firstCall.args[1]).to.be.false;
                expect(commit.secondCall.args[0]).to.equal("Modules/SearchBar/setShowAllResults");
                expect(commit.secondCall.args[1]).to.equal(true);
                expect(commit.thirdCall.args[0]).to.equal("Modules/SearchBar/setCurrentActionEvent");
                expect(commit.thirdCall.args[1]).to.equal("");
                expect(dispatch.notCalled).to.be.true;
            });
        });

        it("if action event is 'showLayerInfo' shall not reset searchbar navigation and shall reset current action event", async () => {
            rootGetters = {
                "Modules/SearchBar/currentActionEvent": "showLayerInfo"
            };

            actions.navigateSearchbarActionEventNotInLayerSelection({commit, dispatch, rootGetters}, {side: side});

            await nextTick(() => {
                expect(commit.calledThrice).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setShowSearchResultsInTree");
                expect(commit.firstCall.args[1]).to.be.false;
                expect(commit.secondCall.args[0]).to.equal("Modules/SearchBar/setShowAllResults");
                expect(commit.secondCall.args[1]).to.equal(true);
                expect(commit.thirdCall.args[0]).to.equal("Modules/SearchBar/setCurrentActionEvent");
                expect(commit.thirdCall.args[1]).to.equal("");
                expect(dispatch.notCalled).to.be.true;
            });
        });
    });

    describe("navigateSearchbarInLayerSelection", () => {
        const side = "mainMenu";

        it("if history contains 'layerSelection' 2 times setShowSearchResultsInTree is called ", async () => {
            getters = {
                navigationHistory: () => {
                    return [
                        {type: "root"},
                        {type: "layerSelection"},
                        {type: "layerSelection"}
                    ];
                }
            };

            actions.navigateSearchbarInLayerSelection({commit, dispatch, getters}, {side: side});

            await nextTick(() => {
                expect(commit.calledThrice).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setShowAllResults");
                expect(commit.firstCall.args[1]).to.be.false;
                expect(commit.secondCall.args[0]).to.equal("Modules/SearchBar/setShowSearchResultsInTree");
                expect(commit.secondCall.args[1]).to.be.true;
                expect(commit.thirdCall.args[0]).to.equal("switchToPreviousComponent");
                expect(commit.thirdCall.args[1]).to.equal(side);
                expect(dispatch.notCalled).to.be.true;
            });
        });

        it("if history not contains 'layerSelection' 2 times navigateBack in layerSelection is called ", async () => {
            getters = {
                navigationHistory: () => {
                    return [
                        {type: "root"},
                        {type: "layerSelection"}
                    ];
                }
            };

            actions.navigateSearchbarInLayerSelection({commit, dispatch, getters}, {side: side});

            await nextTick(() => {
                expect(commit.callCount).to.be.equal(4);
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setShowAllResults");
                expect(commit.firstCall.args[1]).to.be.false;
                expect(commit.secondCall.args[0]).to.equal("Modules/SearchBar/setSearchResultsActive");
                expect(commit.secondCall.args[1]).to.be.false;
                expect(commit.thirdCall.args[0]).to.equal("Modules/SearchBar/setShowSearchResultsInTree");
                expect(commit.thirdCall.args[1]).to.be.false;
                expect(commit.getCall(3).args[0]).to.equal("switchToPreviousComponent");
                expect(commit.getCall(3).args[1]).to.equal(side);
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("Modules/LayerSelection/navigateBack");
                expect(dispatch.firstCall.args[1]).to.deep.equals(null);
            });
        });
    });

    describe("resetSearchbarNavigation", () => {
        const side = "mainMenu";

        it("shall commit three times", async () => {
            actions.resetSearchbarNavigation({commit}, {side: side});

            await nextTick(() => {
                expect(commit.calledThrice).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setShowAllResults");
                expect(commit.firstCall.args[1]).to.be.false;
                expect(commit.secondCall.args[0]).to.equal("Menu/setCurrentComponentPropsName");
                expect(commit.secondCall.args[1]).to.be.deep.equals({side: side, name: "common:modules.searchBar.searchResultList"});
                expect(commit.thirdCall.args[0]).to.equal("Menu/setNavigationHistoryBySide");
                expect(commit.thirdCall.args[1]).to.be.deep.equals({side: side, newHistory: [{type: "root", props: []}]});
                expect(dispatch.notCalled).to.be.true;
            });
        });
    });

    describe("toggleMenu", () => {
        it("should set main menu to expanded === true", () => {
            const side = "mainMenu";

            actions.toggleMenu({commit, rootGetters, state}, side);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setExpandedBySide");
            expect(commit.firstCall.args[1]).to.deep.equal({
                expanded: true,
                side
            });
        });
        it("should set secondary menu to expanded === true", () => {
            const side = "secondaryMenu";

            actions.toggleMenu({commit, rootGetters, state}, side);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setExpandedBySide");
            expect(commit.firstCall.args[1]).to.deep.equal({
                expanded: true,
                side
            });
        });
        it("should set main menu to expanded === true, if isMobile is true and secodary menu is not expanded === false", () => {
            const side = "secondaryMenu";

            rootGetters.isMobile = true;
            actions.toggleMenu({commit, rootGetters, state}, side);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setExpandedBySide");
            expect(commit.firstCall.args[1]).to.deep.equal({
                expanded: true,
                side
            });
        });
        it("should set main menu to expanded === false, if isMobile is true and secodary menu is expanded === true", () => {
            const side = "secondaryMenu";

            state.secondaryMenu.expanded = true;
            rootGetters.isMobile = true;
            actions.toggleMenu({commit, rootGetters, state}, side);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setExpandedBySide");
            expect(commit.firstCall.args[1]).to.deep.equal({
                expanded: false,
                side
            });
        });
    });

    describe("closeMenu", () => {
        const side = "mainMenu";

        it("should close and reset MenuContainer", async () => {
            actions.closeMenu({commit, dispatch, getters, state}, side);

            await nextTick(() => {
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("switchToRoot");
                expect(commit.firstCall.args[1]).to.equal(side);
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("toggleMenu");
                expect(dispatch.firstCall.args[1]).to.equal(side);
            });
        });

    });

    describe("resetMenu", () => {
        let side = "mainMenu";

        it("should switch to Root but not change Interaction if already GFI", async () => {
            rootGetters["Modules/SearchBar/currentSide"] = side;
            actions.resetMenu({commit, dispatch, getters, rootGetters, state}, side);

            await nextTick(() => {
                expect(dispatch.notCalled).to.be.true;
                expect(commit.calledTwice).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Menu/switchToPreviousComponent");
                expect(commit.firstCall.args[1]).to.equal(side);
                expect(commit.secondCall.args[0]).to.equal("switchToRoot");
                expect(commit.secondCall.args[1]).to.equal(side);
            });
        });

        it("should switch to Root and change Interaction if not already GFI", async () => {
            Object.assign(state, {currentMouseMapInteractionsComponent: "abc"});
            rootGetters["Modules/SearchBar/currentSide"] = side;

            actions.resetMenu({commit, dispatch, getters, rootGetters, state}, side);

            await nextTick(() => {
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("changeCurrentMouseMapInteractionsComponent");
                expect(dispatch.firstCall.args[1]).to.deep.equal({type: state.defaultComponent, side});
                expect(commit.calledTwice).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Menu/switchToPreviousComponent");
                expect(commit.firstCall.args[1]).to.equal(side);
                expect(commit.secondCall.args[0]).to.equal("switchToRoot");
                expect(commit.secondCall.args[1]).to.equal(side);
            });
        });

        it("should switch to Root but not call switchToPreviousComponent, if search is on other side", async () => {
            rootGetters["Modules/SearchBar/currentSide"] = "mainMenu";
            side = "secondaryMenu";
            actions.resetMenu({commit, dispatch, getters, rootGetters, state}, side);

            await nextTick(() => {
                expect(dispatch.notCalled).to.be.true;
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("switchToRoot");
                expect(commit.firstCall.args[1]).to.equal(side);
            });
        });
    });
});
