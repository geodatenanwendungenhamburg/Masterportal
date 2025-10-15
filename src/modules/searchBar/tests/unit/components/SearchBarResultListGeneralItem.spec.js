import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import SearchBarResultListGeneralItemComponent from "@modules/searchBar/components/SearchBarResultListGeneralItem.vue";

config.global.mocks.$t = key => key;

describe("src/modules/searchBar/components/SearchBarResultListGeneralItem.vue", () => {
    let store,
        wrapper;

    const searchResults = [
        {
            category: "Straße",
            id: "BeidemNeuenKrahnStraße",
            index: 0,
            name: "Bei dem Neuen Krahn",
            searchInterfaceId: "gazetteer",
            displayedInfo: "",
            icon: "bi-signpost",
            imagePath: "",
            toolTip: "toolTipAvailable",
            events: {
                buttons: {
                    startRouting: {
                        coordinates: [3, 4],
                        name: "name"
                    }
                }
            }

        },
        {
            category: "Adresse",
            id: "BeidemNeuenKrahn2Adresse",
            index: 1,
            name: "Bei dem Neuen Krahn 2",
            searchInterfaceId: "gazetteer",
            displayedInfo: "",
            icon: "bi-signpost",
            imagePath: "",
            toolTip: undefined,
            events: {
                buttons: {
                    setMarker: {
                        coordinates: [1, 2]
                    },
                    startRouting: {
                        coordinates: [3, 4],
                        name: "name2"
                    }
                }
            }
        }
    ];

    beforeEach(() => {
        store = createStore({});
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("test the result item", () => {
        it("shows toolTip if available and check actionButtons", () => {
            wrapper = shallowMount(SearchBarResultListGeneralItemComponent, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    searchResult: searchResults[0]
                }
            });

            expect(wrapper.find("#search-bar-result-list-general-itemBeidemNeuenKrahnStraße").exists()).to.be.true;
            expect(wrapper.find("button").html()).to.contain("toolTipAvailable");
            expect(wrapper.findAll("action-button-stub").length).to.be.equals(1);
            expect(wrapper.find("action-button-stub").attributes("actionname")).to.be.equals("startRouting");
        });

        it("shows name if tooltip is undefined and check actionButtons", () => {
            wrapper = shallowMount(SearchBarResultListGeneralItemComponent, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    searchResult: searchResults[1]
                }
            });

            expect(wrapper.find("#search-bar-result-list-general-itemBeidemNeuenKrahn2Adresse").exists()).to.be.true;
            expect(wrapper.find("button").html()).to.contain("Bei dem Neuen Krahn 2");
            expect(wrapper.findAll("action-button-stub").length).to.be.equals(2);
            expect(wrapper.findAll("action-button-stub").at(0).attributes("actionname")).to.be.equals("setMarker");
            expect(wrapper.findAll("action-button-stub").at(1).attributes("actionname")).to.be.equals("startRouting");
        });

        it("no actionButtons", () => {
            searchResults[1].events = {};
            wrapper = shallowMount(SearchBarResultListGeneralItemComponent, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    searchResult: searchResults[1]
                }
            });

            expect(wrapper.find("#search-bar-result-list-general-itemBeidemNeuenKrahn2Adresse").exists()).to.be.true;
            expect(wrapper.find("button").html()).to.contain("Bei dem Neuen Krahn 2");
            expect(wrapper.findAll("action-button-stub").length).to.be.equals(0);
        });
    });
    describe("test rendering of searchResult image", () => {
        it("renders an <img> if imagePath is provided", () => {
            const searchResultWithImage = {
                ...searchResults[0],
                id: "WithImage",
                imagePath: "http://example.com/test.png"
            };

            wrapper = shallowMount(SearchBarResultListGeneralItemComponent, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    searchResult: searchResultWithImage
                }
            });

            expect(wrapper.find("img.search-bar-result-list-general-image").exists()).to.be.true;
            expect(wrapper.find("img.search-bar-result-list-general-image").attributes("src")).to.equal("http://example.com/test.png");
            expect(wrapper.find("img.search-bar-result-list-general-image").attributes("alt")).to.equal("search result image");
        });

        it("does not render an <img> if imagePath is empty", () => {
            const searchResultWithoutImage = {
                ...searchResults[0],
                id: "WithoutImage",
                imagePath: ""
            };

            wrapper = shallowMount(SearchBarResultListGeneralItemComponent, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    searchResult: searchResultWithoutImage
                }
            });

            expect(wrapper.find("img.search-bar-result-list-general-image").exists()).to.be.false;
        });
    });
});
