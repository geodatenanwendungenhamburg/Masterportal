import searchBarUrlParams from "@modules/searchBar/js/searchBarUrlParams.js";

import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import store from "@appstore/index.js";

import SearchBarComponent from "@modules/searchBar/components/SearchBar.vue";
import actionsSearchBarSearchInterfaces from "@modules/searchBar/store/actions/actionsSearchBarSearchInterfaces.js";
import stateSearchBar from "@modules/searchBar/store/stateSearchBar.js";
import mutationsSearchBar from "@modules/searchBar/store/mutationsSearchBar.js";
import gettersSearchBar from "@modules/searchBar/store/gettersSearchBar.js";

config.global.mocks.$t = key => key;


describe("src/modules/searchBar/js/searchBarUrlParams.js", () => {

    let layerConfigs,
        localstore,
        wrapper,
        menuActionsSpy,
        searchBarActionsSpy,
        origGetters;

    beforeAll(() => {
        origGetters = store.getters;
    });

    beforeEach(() => {
        menuActionsSpy = {
            navigateBack: sinon.stub()
        };

        searchBarActionsSpy = {
            instantiateSearchInterfaces: actionsSearchBarSearchInterfaces.instantiateSearchInterfaces,
            cleanSearchResults: actionsSearchBarSearchInterfaces.cleanSearchResults,
            startSearch: actionsSearchBarSearchInterfaces.startSearch,
            overwriteDefaultValues: sinon.stub(),
            search: actionsSearchBarSearchInterfaces.search,
            activateActions: sinon.stub(),
            startLayerSelectionSearch: sinon.stub(),
            checkLayerSelectionSearchConfig: sinon.stub(),
            removeHighlight3DTile: sinon.stub()
        };

        layerConfigs = [
            {
                id: "1",
                name: "Überschwemmungsgebiete",
                typ: "WMS",
                datasets: [{
                    md_name: "Überschwemmungsgebiete (alkis)"
                }]
            },
            {
                id: "2",
                name: "Krankenhäuser Test",
                typ: "WMS"
            },
            {
                id: "3",
                name: "Überschwemmungsgebiete 3D",
                typ: "WMS"
            }
        ];

        localstore = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        SearchBar: {
                            namespaced: true,
                            actions: searchBarActionsSpy,
                            getters: gettersSearchBar,
                            mutations: mutationsSearchBar,
                            state: {...stateSearchBar, searchInterfaces: [{"type": "topicTree"}]}
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        titleBySide: () => () => true,
                        currentComponent: () => () => "root"
                    },
                    actions: menuActionsSpy
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        removePointMarker: sinon.stub()
                    }
                }
            },
            getters: {
                portalConfig: sinon.stub(),
                visibleLayerConfigs: () => layerConfigs
            },
            actions: {
                initializeModule: sinon.stub()
            }
        });

        localstore.dispatch("Modules/SearchBar/instantiateSearchInterfaces", []);

        wrapper = shallowMount(SearchBarComponent, {
            props: {
                clickAction: sinon.stub()
            },
            global: {
                plugins: [localstore]
            }
        });

        store.getters = {
            allLayerConfigs: layerConfigs,
            layerConfig: []
        };
        sinon.stub(store, "commit").callsFake(localstore.commit);
        sinon.stub(store, "dispatch").callsFake(localstore.dispatch);
    });


    afterEach(() => {
        sinon.restore();
        store.getters = origGetters;
    });

    describe("setQueryToSearchInput", () => {
        it("should set query to searchInput and start search with QUERY", async () => {
            const params = {
                "QUERY": "Überschwemmungsgebiete"
            };

            searchBarUrlParams.setQueryToSearchInput(params);
            await wrapper.vm.$nextTick();

            const result = localstore.getters["Modules/SearchBar/searchResults"];

            expect(result.length).to.equals(2);
        });
        it("should set query to searchInput and start search with SEARCH/QUERY", async () => {
            const params = {
                "SEARCH/QUERY": "Überschwemmungsgebiete"
            };

            searchBarUrlParams.setQueryToSearchInput(params);
            await wrapper.vm.$nextTick();

            const result = localstore.getters["Modules/SearchBar/searchResults"];

            expect(result.length).to.equals(2);
        });
    });
});
