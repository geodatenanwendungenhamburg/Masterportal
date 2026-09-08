import {expect} from "chai";
import sinon from "sinon";
import {nextTick} from "vue";
import {createPinia, setActivePinia} from "pinia";
import store from "@appstore/index.js";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";

describe("src/modules/menu/menu-store/actionsMenu.js", () => {
    let menuStore,
        commit,
        dispatch;

    beforeEach(() => {
        setActivePinia(createPinia());
        menuStore = useMenuStore();

        commit = sinon.stub(store, "commit");
        dispatch = sinon.stub(store, "dispatch");

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
                type = "FileImport",
                changeCurrentComponent = sinon.stub(menuStore, "changeCurrentComponent");

            menuStore.activateCurrentComponent({currentComponent, type, side});

            expect(menuStore[side].expanded).to.be.true;
            expect(changeCurrentComponent.calledOnce).to.be.true;
            expect(changeCurrentComponent.firstCall.args[0]).to.deep.equals({
                type: currentComponent.type,
                side: side,
                props: {
                    name: store.getters["Modules/FileImport/name"]
                }
            });
        });

        it("should close opposite menu if props.closeOppositeMenu is true", () => {
            const side = "mainMenu",
                type = "FileImport",
                props = {
                    name: "File Import",
                    closeOppositeMenu: true
                },
                changeCurrentMouseMapInteractionsComponent = sinon.stub(menuStore, "changeCurrentMouseMapInteractionsComponent");

            menuStore.secondaryMenu.expanded = true;

            menuStore.changeCurrentComponent({type, side, props});

            expect(menuStore.secondaryMenu.expanded).to.be.false;
            expect(menuStore[side].navigation.currentComponent).to.deep.equals({
                type,
                props
            });
            expect(changeCurrentMouseMapInteractionsComponent.calledOnce).to.be.true;
        });
    });

    describe("changeCurrentComponent", () => {
        it("should set current component and change current map interactions component", () => {
            const type = "abc",
                side = "mainMenu",
                props = {
                    name: "common:modules.menu.abc"
                },
                changeCurrentMouseMapInteractionsComponent = sinon.stub(menuStore, "changeCurrentMouseMapInteractionsComponent");

            menuStore.changeCurrentComponent({type, side, props});

            expect(menuStore[side].navigation.currentComponent).to.deep.equals({type, props});
            expect(changeCurrentMouseMapInteractionsComponent.calledOnce).to.be.true;
            expect(changeCurrentMouseMapInteractionsComponent.firstCall.args[0]).to.deep.equals({type, side});
        });

        it("should setCurrentComponentProps, if only props name changed", () => {
            const type = "abc",
                side = "mainMenu",
                props = {
                    name: "common:menu.abc"
                },
                changeCurrentMouseMapInteractionsComponent = sinon.stub(menuStore, "changeCurrentMouseMapInteractionsComponent");

            menuStore[side].navigation.currentComponent.type = type;

            menuStore.changeCurrentComponent({type, side, props});

            expect(menuStore[side].navigation.currentComponent.props).to.deep.equals(props);
            expect(changeCurrentMouseMapInteractionsComponent.notCalled).to.be.true;
        });
    });

    describe("changeCurrentMouseMapInteractionsComponent", () => {
        it("should set current map interactions component", () => {
            const type = "getFeatureInfo",
                side = "mainMenu";

            menuStore.currentMouseMapInteractionsComponent = "abc";

            menuStore.changeCurrentMouseMapInteractionsComponent({type, side});

            expect(menuStore.currentMouseMapInteractionsComponent).to.equals(type);
        });

        it("should switch secondaryMenu to root and set current map interactions component", () => {
            const type = "getFeatureInfo",
                side = "mainMenu";

            menuStore.currentMouseMapInteractionsComponent = "abc";

            Object.assign(menuStore, {
                secondaryMenu: {
                    navigation: {
                        currentComponent: {
                            type: "abc",
                            props: {
                                name: "common:abc"
                            }
                        },
                        history: []
                    }
                }
            });

            menuStore.changeCurrentMouseMapInteractionsComponent({type, side});

            expect(menuStore.secondaryMenu.navigation.currentComponent).to.deep.equals({
                type: "root",
                props: []
            });
            expect(menuStore.currentMouseMapInteractionsComponent).to.equals(type);
        });

        it("should reset the current mouse map interaction component to default if it is set to another", () => {
            Object.assign(menuStore, {
                currentMouseMapInteractionsComponent: "measure"
            });

            menuStore.resetCurrentMouseMapInteractionsComponent("secondaryMenu");

            expect(menuStore.currentMouseMapInteractionsComponent).to.equals(menuStore.defaultComponent);
        });

        it("shouldn't do anything on resetCurrentMouseMapInteractionsComponent if the current mouse map interaction is the default one", () => {
            menuStore.resetCurrentMouseMapInteractionsComponent("secondaryMenu");

            expect(menuStore.currentMouseMapInteractionsComponent).to.equals(menuStore.defaultComponent);
        });
    });

    describe("clickedMenuElement", () => {
        const name = "common:abc",
            path = ["generic"],
            side = "mainMenu";
        let type,
            properties;

        it("should change current component without path", () => {
            const changeCurrentComponent = sinon.stub(menuStore, "changeCurrentComponent");

            type = "abc";

            menuStore.clickedMenuElement({name, path, side, type});

            expect(changeCurrentComponent.calledOnce).to.be.true;
            expect(changeCurrentComponent.firstCall.args[0]).to.deep.equal({type: type, side: side, props: {name: name}});
        });

        it("should change current component with path for type === 'folder'", async () => {
            const changeCurrentComponent = sinon.stub(menuStore, "changeCurrentComponent");

            type = "folder";

            menuStore.clickedMenuElement({name, path, side, type});

            await nextTick(() => {
                expect(changeCurrentComponent.calledOnce).to.be.true;
                expect(changeCurrentComponent.firstCall.args[0]).to.deep.equal({type: type, side: side, props: {path: path, name: name}});
            });
        });

        it("should open new tab if type is 'customMenuElement' and properties contains 'openURL'", () => {
            type = "customMenuElement";
            properties = {
                openURL: "http://url.de"
            };

            menuStore.clickedMenuElement({name, path, side, type, properties});

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

            menuStore.clickedMenuElement({name, path, side, type, properties});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal(properties.execute.action);
            expect(dispatch.firstCall.args[1]).to.be.deep.equal(properties.execute.payload);
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

            menuStore.clickedMenuElement({name, path, side, type, properties});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal(properties.execute.action);
            expect(dispatch.firstCall.args[1]).to.be.deep.equal(properties.execute.payload);
        });
    });

    describe("navigateBack", () => {
        let side = "mainMenu";

        it("should switch to previous component", async () => {
            store.state.Modules.SearchBar.showAllResults = false;

            menuStore[side].navigation.currentComponent = {
                type: "searchBar",
                props: []
            };
            menuStore[side].navigation.history = [{
                type: "root",
                props: []
            }];

            menuStore.navigateBack({side});

            await nextTick(() => {
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
            });
        });

        it("should switch to previous component and change current mouse map interactionscomponent'", async () => {
            const changeCurrentMouseMapInteractionsComponent = sinon.stub(menuStore, "changeCurrentMouseMapInteractionsComponent");

            menuStore.currentMouseMapInteractionsComponent = "abc";
            store.state.Modules.SearchBar.showAllResults = false;

            menuStore[side].navigation.currentComponent = {
                type: "abc",
                props: []
            };
            menuStore[side].navigation.history = [{
                type: "root",
                props: []
            }];

            menuStore.navigateBack({side});

            await nextTick(() => {
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(changeCurrentMouseMapInteractionsComponent.calledOnce).to.be.true;
                expect(changeCurrentMouseMapInteractionsComponent.firstCall.args[0]).to.deep.equal({
                    type: menuStore.defaultComponent,
                    side
                });
            });
        });

        it("should switch to previous component if searchbar showAllResults=true but on other menu side", async () => {
            const changeCurrentMouseMapInteractionsComponent = sinon.stub(menuStore, "changeCurrentMouseMapInteractionsComponent");

            menuStore.currentMouseMapInteractionsComponent = "abc";
            side = "secondaryMenu";

            store.state.Modules.SearchBar.showAllResults = true;
            store.state.Modules.SearchBar.currentSide = "mainMenu";

            menuStore[side].navigation.currentComponent = {
                type: "abc",
                props: []
            };
            menuStore[side].navigation.history = [{
                type: "root",
                props: []
            }];

            menuStore.navigateBack({side});

            await nextTick(() => {
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(changeCurrentMouseMapInteractionsComponent.calledOnce).to.be.true;
                expect(changeCurrentMouseMapInteractionsComponent.firstCall.args[0]).to.deep.equal({
                    type: menuStore.defaultComponent,
                    side
                });
            });
        });

        it("should resetSearchbarNavigation - no action event", async () => {
            side = "mainMenu";

            store.state.Modules.SearchBar.showAllResults = true;
            store.state.Modules.SearchBar.currentSide = side;
            store.state.Modules.SearchBar.currentActionEvent = "";

            menuStore[side].navigation.currentComponent = {
                type: "searchBar",
                props: []
            };

            const resetSearchbarNavigation = sinon.stub(menuStore, "resetSearchbarNavigation");

            menuStore.navigateBack({side});

            await nextTick(() => {
                expect(commit.calledWith(
                    "Modules/SearchBar/setPlaceholder",
                    store.getters["Modules/SearchBar/globalPlaceholder"]
                )).to.be.true;
                expect(resetSearchbarNavigation.calledOnce).to.be.true;
                expect(resetSearchbarNavigation.firstCall.args[0]).to.deep.equals({side});
            });
        });

        it("should navigateSearchbarInLayerSelection if current component is layerSelection - no action event", async () => {
            side = "mainMenu";

            store.state.Modules.SearchBar.showAllResults = true;
            store.state.Modules.SearchBar.currentSide = side;
            store.state.Modules.SearchBar.currentActionEvent = "";

            menuStore[side].navigation.currentComponent = {
                type: "layerSelection",
                props: []
            };

            const navigateSearchbarInLayerSelection = sinon.stub(menuStore, "navigateSearchbarInLayerSelection");

            menuStore.navigateBack({side});

            await nextTick(() => {
                expect(navigateSearchbarInLayerSelection.calledOnce).to.be.true;
                expect(navigateSearchbarInLayerSelection.firstCall.args[0]).to.deep.equals({side});
            });
        });

        it("should navigateSearchbarActionEventNotInLayerSelection if current component is searchBar - with action event", async () => {
            side = "mainMenu";

            store.state.Modules.SearchBar.showAllResults = true;
            store.state.Modules.SearchBar.currentSide = side;
            store.state.Modules.SearchBar.currentActionEvent = "showInTree";

            menuStore[side].navigation.currentComponent = {
                type: "searchBar",
                props: []
            };

            const navigateSearchbarActionEventNotInLayerSelection = sinon.stub(menuStore, "navigateSearchbarActionEventNotInLayerSelection");

            menuStore.navigateBack({side});

            await nextTick(() => {
                expect(commit.calledWith(
                    "Modules/SearchBar/setPlaceholder",
                    store.getters["Modules/SearchBar/globalPlaceholder"]
                )).to.be.true;
                expect(navigateSearchbarActionEventNotInLayerSelection.calledOnce).to.be.true;
                expect(navigateSearchbarActionEventNotInLayerSelection.firstCall.args[0]).to.deep.equals({side});
            });
        });

        it("should switchToPreviousComponent if current component is layerInformation - with action event", async () => {
            side = "mainMenu";

            store.state.Modules.SearchBar.showAllResults = true;
            store.state.Modules.SearchBar.currentSide = side;
            store.state.Modules.SearchBar.currentActionEvent = "showLayerInfo";

            menuStore[side].navigation.currentComponent = {
                type: "layerInformation",
                props: []
            };
            menuStore[side].navigation.history = [{
                type: "root",
                props: []
            }];

            const navigateSearchbarActionEventNotInLayerSelection = sinon.stub(menuStore, "navigateSearchbarActionEventNotInLayerSelection");

            menuStore.navigateBack({side});

            await nextTick(() => {
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(navigateSearchbarActionEventNotInLayerSelection.calledOnce).to.be.true;
                expect(navigateSearchbarActionEventNotInLayerSelection.firstCall.args[0]).to.deep.equals({side});
            });
        });

        it("should switchToPreviousComponent if current component is layerInformation - with action event and showAllResults is false", async () => {
            side = "mainMenu";

            store.state.Modules.SearchBar.showAllResults = false;
            store.state.Modules.SearchBar.currentSide = side;
            store.state.Modules.SearchBar.currentActionEvent = "showLayerInfo";

            menuStore[side].navigation.currentComponent = {
                type: "layerInformation",
                props: []
            };
            menuStore[side].navigation.history = [{
                type: "root",
                props: []
            }];

            const navigateSearchbarActionEventNotInLayerSelection = sinon.stub(menuStore, "navigateSearchbarActionEventNotInLayerSelection");

            menuStore.navigateBack({side});

            await nextTick(() => {
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(navigateSearchbarActionEventNotInLayerSelection.calledOnce).to.be.true;
                expect(navigateSearchbarActionEventNotInLayerSelection.firstCall.args[0]).to.deep.equals({side});
            });
        });
    });
    describe("navigateSearchbarActionEventNotInLayerSelection", () => {
        const side = "mainMenu";

        it("if action event is not 'showInTree' and not 'showLayerInfo' shall reset searchbar navigation and current action event", async () => {
            const resetSearchbarNavigation = sinon.stub(menuStore, "resetSearchbarNavigation");

            store.state.Modules.SearchBar.currentActionEvent = "otherActionEvent";

            menuStore.navigateSearchbarActionEventNotInLayerSelection({side: side});

            await nextTick(() => {
                expect(commit.calledWith(
                    "Modules/SearchBar/setShowSearchResultsInTree",
                    false
                )).to.be.true;

                expect(resetSearchbarNavigation.calledOnce).to.be.true;
                expect(resetSearchbarNavigation.firstCall.args[0]).to.deep.equals({side});

                expect(commit.calledWith(
                    "Modules/SearchBar/setCurrentActionEvent",
                    ""
                )).to.be.true;
            });
        });

        it("if action event is 'showInTree' shall not reset searchbar navigation and shall reset current action event", async () => {
            const resetSearchbarNavigation = sinon.stub(menuStore, "resetSearchbarNavigation");

            store.state.Modules.SearchBar.currentActionEvent = "showInTree";

            menuStore.navigateSearchbarActionEventNotInLayerSelection({side: side});

            await nextTick(() => {
                expect(commit.calledWith(
                    "Modules/SearchBar/setShowSearchResultsInTree",
                    false
                )).to.be.true;

                expect(commit.calledWith(
                    "Modules/SearchBar/setShowAllResults",
                    true
                )).to.be.true;

                expect(resetSearchbarNavigation.notCalled).to.be.true;

                expect(commit.calledWith(
                    "Modules/SearchBar/setCurrentActionEvent",
                    ""
                )).to.be.true;
            });
        });

        it("if action event is 'showLayerInfo' shall not reset searchbar navigation and shall reset current action event", async () => {
            const resetSearchbarNavigation = sinon.stub(menuStore, "resetSearchbarNavigation");

            store.state.Modules.SearchBar.currentActionEvent = "showLayerInfo";

            menuStore.navigateSearchbarActionEventNotInLayerSelection({side: side});

            await nextTick(() => {
                expect(commit.calledWith(
                    "Modules/SearchBar/setShowSearchResultsInTree",
                    false
                )).to.be.true;

                expect(commit.calledWith(
                    "Modules/SearchBar/setShowAllResults",
                    true
                )).to.be.true;

                expect(resetSearchbarNavigation.notCalled).to.be.true;

                expect(commit.calledWith(
                    "Modules/SearchBar/setCurrentActionEvent",
                    ""
                )).to.be.true;
            });
        });
    });

    describe("navigateSearchbarInLayerSelection", () => {
        const side = "mainMenu";

        it("if history contains 'layerSelection' 2 times setShowSearchResultsInTree is called ", async () => {
            menuStore[side].navigation.history = [
                {type: "root"},
                {type: "layerSelection"},
                {type: "layerSelection"}
            ];

            menuStore.navigateSearchbarInLayerSelection({side: side});

            await nextTick(() => {
                expect(commit.calledWith(
                    "Modules/SearchBar/setShowAllResults",
                    false
                )).to.be.true;
                expect(commit.calledWith(
                    "Modules/SearchBar/setShowSearchResultsInTree",
                    true
                )).to.be.true;
                expect(menuStore[side].navigation.history).to.deep.equal([
                    {type: "root"},
                    {type: "layerSelection"}
                ]);
                expect(dispatch.notCalled).to.be.true;
            });
        });

        it("if history not contains 'layerSelection' 2 times navigateBack in layerSelection is called ", async () => {
            menuStore[side].navigation.history = [
                {type: "root"},
                {type: "layerSelection"}
            ];

            menuStore.navigateSearchbarInLayerSelection({side: side});

            await nextTick(() => {
                expect(commit.calledWith(
                    "Modules/SearchBar/setShowAllResults",
                    false
                )).to.be.true;
                expect(commit.calledWith(
                    "Modules/SearchBar/setSearchResultsActive",
                    false
                )).to.be.true;
                expect(commit.calledWith(
                    "Modules/SearchBar/setShowSearchResultsInTree",
                    false
                )).to.be.true;
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.firstCall.args[0]).to.equal("Modules/LayerSelection/navigateBack");
                expect(dispatch.firstCall.args[1]).to.deep.equals({doNotTrack: true});
                expect(menuStore[side].navigation.history).to.deep.equal([
                    {type: "root"}
                ]);
            });
        });
    });

    describe("resetSearchbarNavigation", () => {
        const side = "mainMenu";

        it("shall reset searchbar navigation", async () => {
            menuStore[side].navigation.currentComponent = {
                type: "searchBar",
                props: []
            };

            menuStore.resetSearchbarNavigation({side: side});

            await nextTick(() => {
                expect(commit.calledOnce).to.be.true;
                expect(commit.firstCall.args[0]).to.equal("Modules/SearchBar/setShowAllResults");
                expect(commit.firstCall.args[1]).to.be.false;
                expect(menuStore[side].navigation.currentComponent.props.name).to.equal("common:modules.searchBar.searchResultList");
                expect(menuStore[side].navigation.history).to.deep.equals([{type: "root", props: []}]);
                expect(dispatch.notCalled).to.be.true;
            });
        });
    });
    describe("toggleMenu", () => {
        it("should set main menu to expanded === true", () => {
            const side = "mainMenu";

            menuStore.toggleMenu(side);

            expect(menuStore[side].expanded).to.be.true;
        });

        it("should set secondary menu to expanded === true", () => {
            const side = "secondaryMenu";

            menuStore.toggleMenu(side);

            expect(menuStore[side].expanded).to.be.true;
        });

        it("should set secondary menu to expanded === false, if secondary menu is expanded === true", () => {
            const side = "secondaryMenu";

            menuStore.secondaryMenu.expanded = true;

            menuStore.toggleMenu(side);

            expect(menuStore[side].expanded).to.be.false;
        });
    });

    describe("closeMenu", () => {
        const side = "mainMenu";

        it("should close and reset MenuContainer", async () => {
            const toggleMenu = sinon.stub(menuStore, "toggleMenu");

            menuStore[side].navigation.currentComponent = {
                type: "abc",
                props: []
            };
            menuStore[side].currentComponent = "abc";

            menuStore.closeMenu(side);

            await nextTick(() => {
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(menuStore[side].currentComponent).to.equal("root");
                expect(toggleMenu.calledOnce).to.be.true;
                expect(toggleMenu.firstCall.args[0]).to.equal(side);
            });
        });
    });

    describe("resetMenu", () => {
        const side = "mainMenu";

        it("should switch to Root but not change Interaction if already GFI", async () => {
            const changeCurrentMouseMapInteractionsComponent = sinon.stub(menuStore, "changeCurrentMouseMapInteractionsComponent");

            menuStore.resetMenu(side);

            await nextTick(() => {
                expect(changeCurrentMouseMapInteractionsComponent.notCalled).to.be.true;
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(menuStore[side].currentComponent).to.equal("root");
            });
        });

        it("should switch to Root and change Interaction if not already GFI", async () => {
            const changeCurrentMouseMapInteractionsComponent = sinon.stub(menuStore, "changeCurrentMouseMapInteractionsComponent");

            menuStore.currentMouseMapInteractionsComponent = "abc";
            menuStore[side].navigation.currentComponent = {
                type: "abc",
                props: []
            };
            menuStore[side].currentComponent = "abc";

            menuStore.resetMenu(side);

            await nextTick(() => {
                expect(changeCurrentMouseMapInteractionsComponent.calledOnce).to.be.true;
                expect(changeCurrentMouseMapInteractionsComponent.firstCall.args[0]).to.deep.equal({
                    type: menuStore.defaultComponent,
                    side
                });
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(menuStore[side].currentComponent).to.equal("root");
            });
        });

        it("should reset LayerSelection if currentComponent is layerInformation", async () => {
            menuStore[side].navigation.currentComponent = {
                type: "layerInformation",
                props: []
            };
            menuStore[side].currentComponent = "layerInformation";

            menuStore.resetMenu(side);

            await nextTick(() => {
                expect(dispatch.calledWith("Modules/LayerSelection/reset", null)).to.be.true;
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(menuStore[side].currentComponent).to.equal("root");
            });
        });

        it("should reset LayerSelection and change mouse interaction if needed", async () => {
            const changeCurrentMouseMapInteractionsComponent = sinon.stub(menuStore, "changeCurrentMouseMapInteractionsComponent");

            menuStore.currentMouseMapInteractionsComponent = "layerInformation";
            menuStore.defaultComponent = "defaultComp";
            menuStore[side].navigation.currentComponent = {
                type: "layerInformation",
                props: []
            };
            menuStore[side].currentComponent = "layerInformation";

            menuStore.resetMenu(side);

            await nextTick(() => {
                expect(dispatch.calledWith("Modules/LayerSelection/reset", null)).to.be.true;
                expect(changeCurrentMouseMapInteractionsComponent.calledWith({
                    type: "defaultComp",
                    side
                })).to.be.true;
                expect(menuStore[side].navigation.currentComponent).to.deep.equal({
                    type: "root",
                    props: []
                });
                expect(menuStore[side].currentComponent).to.equal("root");
            });
        });

        it("should change width of menu if urlParams are used", () => {
            const params = {
                    MENUWIDTH: 20
                },
                s = params.MENUWIDTH + "%";

            menuStore.setCurrentMenuWidth({type: "mainMenu", attributes: {width: params.MENUWIDTH}});

            expect(menuStore.mainMenu.width).to.equal(s);
        });

        it("should change width of secondary menu if urlParams are used", () => {
            const params = {
                    SECONDARYWIDTH: 12
                },
                s = params.SECONDARYWIDTH + "%";

            menuStore.setCurrentMenuWidth({type: "secondaryMenu", attributes: {width: params.SECONDARYWIDTH}});

            expect(menuStore.secondaryMenu.width).to.equal(s);
        });
    });
});
