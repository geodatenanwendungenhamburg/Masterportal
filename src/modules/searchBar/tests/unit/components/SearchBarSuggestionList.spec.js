import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createPinia, setActivePinia} from "pinia";

import SearchBarSuggestionListComponent from "@modules/searchBar/components/SearchBarSuggestionList.vue";


describe("src/modules/searchBar/components/SearchBarSuggestionList.vue", () => {
    let store,
        pinia,
        wrapper,
        showInTree,
        showAllResultsSearchInterfaceInstances,
        setPlaceholderSpy,
        setCurrentAvailableCategoriesSpy,
        setShowAllResultsSearchInterfaceInstancesSpy;

    const searchResults = [
            {
                "category": "Straße",
                "id": "BeidemNeuenKrahnStraße",
                "index": 0,
                "name": "Bei dem Neuen Krahn",
                "searchInterfaceId": "gazetteer",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }

            },
            {
                "category": "Adresse",
                "id": "BeidemNeuenKrahn2Adresse",
                "index": 1,
                "name": "Bei dem Neuen Krahn 2",
                "searchInterfaceId": "gazetteer",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }
            }
        ],
        minCharacters = 3,
        searchInput = "Neuenfelder",
        showAllResults = false,
        limitedSortedSearchResults = {
            results: {
                0: searchResults[0],
                1: searchResults[0],
                availableCategories: ["Straße"],
                XcategoryProvider: [
                    "gazetteer"
                ],
                categoryProvider: {
                    "Straße": "gazetteer"
                },
                exampleCount: 1,
                exampleIcon: "bi-signpost-2"
            },
            currentShowAllList: searchResults
        };

    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        showInTree = false;
        showAllResultsSearchInterfaceInstances = [];
        setPlaceholderSpy = sinon.spy();
        setCurrentAvailableCategoriesSpy = sinon.spy();
        setShowAllResultsSearchInterfaceInstancesSpy = sinon.spy();
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        scale: () => 500,
                        mode: () =>"2D"
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        SearchBar: {
                            namespaced: true,
                            actions: {
                                addSelectedSearchResultToTopicTree: sinon.stub()
                            },
                            getters: {
                                currentSide: () => "mainMenu",
                                minCharacters: () => minCharacters,
                                searchInput: () => searchInput,
                                searchResults: () => searchResults,
                                searchResultsActive: () => {
                                    return true;
                                },
                                showAllResults: () => showAllResults,
                                showSearchResultsInTree: () => showInTree,
                                showAllResultsSearchInterfaceInstances: () => showAllResultsSearchInterfaceInstances
                            },
                            mutations: {
                                setShowAllResultsSearchInterfaceInstances: setShowAllResultsSearchInterfaceInstancesSpy,
                                setCurrentAvailableCategories: setCurrentAvailableCategoriesSpy,
                                setSearchResultsActive: sinon.stub(),
                                setShowAllResults: sinon.stub(),
                                setPlaceholder: setPlaceholderSpy
                            }
                        }
                    }
                }
            },
            getters: {
                layerConfigById: () => sinon.stub()
            }
        });
        pinia = createPinia();
        setActivePinia(pinia);
    });


    describe("test the rendering with different parameters", () => {
        it("renders the SearchBarSuggestionList", async () => {
            wrapper = await shallowMount(SearchBarSuggestionListComponent, {
                props: {
                    limitedSortedSearchResults
                },
                global: {
                    plugins: [store, pinia]
                }
            });
            expect(wrapper.find("#search-bar-suggestion-list").exists()).to.be.true;
        });

        it("not renders the SearchBarSuggestionList if showInTree is true", async () => {
            showInTree = true;
            wrapper = await shallowMount(SearchBarSuggestionListComponent, {
                props: {
                    limitedSortedSearchResults
                },
                global: {
                    plugins: [store, pinia]
                }
            });
            expect(wrapper.find("#search-bar-suggestion-list").exists()).to.be.false;
        });

        it("shows the showAll button", async () => {
            wrapper = await shallowMount(SearchBarSuggestionListComponent, {
                props: {
                    limitedSortedSearchResults
                },
                global: {
                    plugins: [store, pinia]
                }
            });
            await wrapper.vm.$nextTick();
            expect(wrapper.find(".showAllSection").exists()).to.be.true;
            expect(wrapper.find(".btn.btn-light.d-flex.text-left").exists()).to.be.true;
        });
    });

    describe("test the method prepareShowAllResults", () => {
        it("test the method prepareShowAllResults, showAllResultsSearchInterfaceInstances exists", async () => {
            showAllResultsSearchInterfaceInstances.push(
                {
                    id: "gazetteer",
                    searchCategory: "Straße"
                }
            );

            wrapper = await shallowMount(SearchBarSuggestionListComponent, {
                props: {
                    limitedSortedSearchResults
                },
                global: {
                    plugins: [store, pinia]
                }
            });

            await wrapper.vm.prepareShowAllResults("Straße");
            wrapper.vm.$nextTick();


            expect(setPlaceholderSpy.calledOnce).to.be.true;
            expect(setPlaceholderSpy.firstCall.args[1]).to.be.equals("modules.searchBar.placeholder.searchFor Straße");
            expect(setShowAllResultsSearchInterfaceInstancesSpy.notCalled).to.be.true;
            expect(setCurrentAvailableCategoriesSpy.calledOnce).to.be.true;
            expect(setCurrentAvailableCategoriesSpy.firstCall.args[1]).to.equal("Straße");

            expect(wrapper.vm.searchResultsActive).to.be.true;
            expect(wrapper.vm.currentShowAllList[0]).to.deep.equal(searchResults[0]);
        });
        it("test the method prepareShowAllResults, showAllResultsSearchInterfaceInstances not exists", async () => {
            showAllResultsSearchInterfaceInstances.push(
                {
                    id: "elastic_0",
                    searchCategory: "Thema"
                }
            );
            const expected = [...showAllResultsSearchInterfaceInstances];

            expected.push(
                {
                    id: "gazetteer",
                    searchCategory: "Straße"
                }
            );

            wrapper = await shallowMount(SearchBarSuggestionListComponent, {
                props: {
                    limitedSortedSearchResults
                },
                global: {
                    plugins: [store, pinia]
                }
            });

            await wrapper.vm.prepareShowAllResults("Straße");
            wrapper.vm.$nextTick();

            expect(setPlaceholderSpy.calledOnce).to.be.true;
            expect(setPlaceholderSpy.firstCall.args[1]).to.be.equals("modules.searchBar.placeholder.searchFor Straße");
            expect(setShowAllResultsSearchInterfaceInstancesSpy.calledOnce).to.be.true;
            expect(setShowAllResultsSearchInterfaceInstancesSpy.firstCall.args[1]).to.be.deep.equals(expected);
            expect(setCurrentAvailableCategoriesSpy.calledOnce).to.be.true;
            expect(setCurrentAvailableCategoriesSpy.firstCall.args[1]).to.equal("Straße");

            expect(wrapper.vm.searchResultsActive).to.be.true;
            expect(wrapper.vm.currentShowAllList[0]).to.deep.equal(searchResults[0]);
        });
    });

    describe("test the method getFirstByCategory and template rendering", () => {
        it("getFirstByCategory returns the first result of the category", async () => {
            wrapper = await shallowMount(SearchBarSuggestionListComponent, {
                props: {
                    limitedSortedSearchResults
                },
                global: {
                    plugins: [store, pinia]
                }
            });
            const result = wrapper.vm.getFirstByCategory("Straße");

            expect(result).to.deep.equal(searchResults[0]);
        });

        it("renders <img> if first result has imagePath", async () => {
            const customResults = [
                    {
                        ...searchResults[0],
                        imagePath: "http://example.com/test.png"
                    }
                ],
                customLimitedSortedSearchResults = {
                    results: {
                        0: customResults[0],
                        availableCategories: ["Straße"],
                        categoryProvider: {
                            "Straße": "gazetteer"
                        },
                        StraßeCount: 1,
                        StraßeIcon: "bi-signpost"
                    },
                    currentShowAllList: customResults
                };

            wrapper = await shallowMount(SearchBarSuggestionListComponent, {
                props: {
                    limitedSortedSearchResults: customLimitedSortedSearchResults
                },
                global: {
                    plugins: [store, pinia]
                }
            });

            expect(wrapper.find("img.search-bar-suggestion-image").exists()).to.be.true;
            expect(wrapper.find("img.search-bar-suggestion-image").attributes("src")).to.equal("http://example.com/test.png");
            expect(wrapper.find("i.bi-signpost").exists()).to.be.false;
        });
    });
});
