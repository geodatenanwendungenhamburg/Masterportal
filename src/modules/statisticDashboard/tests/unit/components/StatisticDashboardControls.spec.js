import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import StatisticDashboardControls from "@modules/statisticDashboard/components/StatisticDashboardControls.vue";
import indexStatisticDashboard from "@modules/statisticDashboard/store/indexStatisticDashboard";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src/modules/statiscticDashboard/components/StatisticDashboardControls.vue", () => {
    const descriptions = [{
            title: "TitleOne",
            content: "ContentOne"
        },
        {
            title: "TitleTwo",
            content: "ContentTwo"
        },
        {
            title: "TitleThree",
            content: "ContentThree"
        }],
        timeStepsFilter = [
            "Die letzten 5 Jahre",
            "Die letzten 10 Jahre",
            "Alle Jahre"
        ],
        regions = [
            {value: "Harburg", label: "Harburg"},
            {value: "Lübeck", label: "Lübeck"},
            {value: "Schwerin", label: "Schwerin"},
            {value: ["Harburg", "Lübeck", "Schwerin"], label: "Alle Gebiete"}
        ],
        referenceData = {},
        enableButtons = false;

    let store;

    before(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StatisticDashboard: indexStatisticDashboard
                    }
                }
            }});
    });

    afterEach(sinon.restore);

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.exists()).to.be.true;
        });

        it("should find no description", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".description").exists()).to.be.false;
        });

        it("should find a description", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".description p").text()).to.be.equal("TitleOneContentOne");

        });

        it("should find a button toolbar", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".btn-toolbar").exists()).to.be.true;
        });

        it("should find switcher component", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent({name: "StatisticSwitcher"}).exists()).to.be.true;
        });

        it("should find difference component", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.setData({showDifferenceModal: true});
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".difference-modal").exists()).to.be.true;
        });

        it("should not find a back-overview element", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".back-overview").exists()).to.be.false;
        });

        it("should find a back to overview element", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("name");
            wrapper.vm.setChartTableToggle("chart");
            wrapper.vm.setSelectedDates([{value: "value1"}]);
            wrapper.vm.setSelectedRegions([{value: "value1"}]);
            wrapper.vm.setSelectedStatistics({
                "Bevölkerung maennlich": {
                    Hamburg: {
                        "1890": "13",
                        "1990": "113"
                    }
                },
                "Bevölkerung weiblich": {
                    Hamburg: {
                        "1890": "12",
                        "1990": "112"
                    }
                }
            });
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".back-overview").exists()).to.be.true;
        });

        it("should not find a static-name container", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("");
            wrapper.vm.setChartTableToggle("chart");
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".static-name").exists()).to.be.false;
        });

        it("should find a static-name container", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("name");
            wrapper.vm.setChartTableToggle("table");
            wrapper.vm.setSelectedDates([{value: "value1"}]);
            wrapper.vm.setSelectedRegions([{value: "value1"}]);
            wrapper.vm.setSelectedStatistics({
                "Bevölkerung maennlich": {
                    Hamburg: {
                        "1890": "13",
                        "1990": "113"
                    }
                },
                "Bevölkerung weiblich": {
                    Hamburg: {
                        "1890": "12",
                        "1990": "112"
                    }
                }
            });
            await wrapper.vm.$nextTick();

            expect(wrapper.find(".static-name").exists()).to.be.true;
        });

        it("should not find a statistic-name-subtitle element", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.setSelectedReferenceData(undefined);

            expect(wrapper.find(".statistic-name-subtitle").exists()).to.be.false;
        });

        it("should find a statistic-name-subtitle element", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    descriptions,
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.setSelectedReferenceData({value: "test"});

            expect(wrapper.find(".statistic-name-subtitle").exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should set hasDescription to false", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.hasDescription).to.be.false;
        });

        it("should set hasDescription to true", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.hasDescription).to.be.true;
        });

        it("should set init description content and title", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.contentDescription).to.be.equal("ContentOne");
            expect(wrapper.vm.titleDescription).to.be.equal("TitleOne");
        });

        it("should set description content and title by the current index", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.setData({
                currentDescriptionIndex: 1
            });

            expect(wrapper.vm.contentDescription).to.be.equal("ContentTwo");
            expect(wrapper.vm.titleDescription).to.be.equal("TitleTwo");
        });
        it("should render statistic filter button", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll(".difference-button")[0].exists()).to.be.true;
        });
        it("should render area filter button", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll(".difference-button")[1].exists()).to.be.true;
        });
        it("should render area filter button", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAll(".difference-button")[2].exists()).to.be.true;
        });
        it("should set precheckedViewSwitcher to buttonGroupControls 0 name", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        descriptions,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                }),
                expected = wrapper.vm.buttonGroupControls[0].name;

            wrapper.vm.setChartTableToggle("table");
            expect(wrapper.vm.precheckedViewSwitcher).to.be.equal(expected);
        });
        it("should set precheckedViewSwitcher to buttonGroupControls 1 name", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        descriptions,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                }),
                expected = wrapper.vm.buttonGroupControls[1].name;

            wrapper.vm.setChartTableToggle("chart");
            expect(wrapper.vm.precheckedViewSwitcher).to.be.equal(expected);
        });
        it("should set showStatisticnameInChart to be false", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("");
            wrapper.vm.setChartTableToggle("chart");
            expect(wrapper.vm.showStatisticnameInChart).to.be.false;
        });
        it("should set showStatisticnameInChart to be false", () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("name");
            wrapper.vm.setChartTableToggle("table");
            expect(wrapper.vm.showStatisticnameInChart).to.be.false;
            wrapper.vm.setChosenStatisticName("");
            wrapper.vm.setChartTableToggle("chart");
            expect(wrapper.vm.showStatisticnameInChart).to.be.false;
        });
        it("should set showStatisticnameInChart to be true", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setChosenStatisticName("name");
            wrapper.vm.setChartTableToggle("chart");
            wrapper.vm.setSelectedDates([{value: "value1"}]);
            wrapper.vm.setSelectedRegions([{value: "value1"}]);
            wrapper.vm.setSelectedStatistics({
                "Bevölkerung maennlich": {
                    Hamburg: {
                        "1890": "13",
                        "1990": "113"
                    }
                },
                "Bevölkerung weiblich": {
                    Hamburg: {
                        "1890": "12",
                        "1990": "112"
                    }
                }
            });
            expect(wrapper.vm.showStatisticnameInChart).to.be.true;
        });
        it("should set referenceSubTitle to be an empty string", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.setSelectedReferenceData(undefined);
            expect(wrapper.vm.referenceSubTitle).to.be.equal("");
        });
        it("should set referenceSubTitle to be a string with region", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.setSelectedReferenceData({type: "region", value: ""});
            expect(wrapper.vm.referenceSubTitle).to.be.equal("modules.statisticDashboard.reference.region");
        });
        it("should set referenceSubTitle to be a string with year", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    descriptions,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.setSelectedReferenceData({type: "date", value: {label: ""}});
            expect(wrapper.vm.referenceSubTitle).to.be.equal("modules.statisticDashboard.reference.year");
        });
    });

    describe("Lifecycle Hooks", () => {
        it("should set the referenceTag undefined", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            wrapper.vm.setSelectedReferenceData(undefined);
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.referenceTag).to.be.undefined;
        });

        it("should set the referenceTag value with label", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.setSelectedReferenceData({value: {label: "2001", value: "2001"}});

            expect(wrapper.vm.referenceTag).to.be.equal("2001");
        });

        it("should set the referenceTag value with value", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.vm.setSelectedReferenceData({value: "test"});

            expect(wrapper.vm.referenceTag).to.be.equal("test: ");
        });
    });

    describe("Methods", () => {
        describe("allFilterSettingsSelected", () => {
            it("should return true if all given values are not empty", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.allFilterSettingsSelected({name: "name"}, [2], [3])).to.be.true;

            });
            it("should return false if the first given value is not an object", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.allFilterSettingsSelected(undefined, [2], [3])).to.be.false;

            });
        });
        describe("addStatisticsToSelect", () => {
            it("should add a statistic if it is not already selected", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        referenceData,
                        enableButtons,
                        statistics: [{
                            "stat1": {
                                category: "Kategorie 1",
                                name: "Stat eins"
                            },
                            "stat2": {
                                category: "Kategorie 2",
                                name: "Stat zwei"
                            },
                            "stat3": {
                                category: "Kategorie 3",
                                name: "Stat drei"
                            }
                        }]
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.addStatisticsToSelect([{key: "stat1", name: "Stat eins"}, {key: "stat3", name: "Stat drei"}]);
                expect(wrapper.vm.selectedStatistics).to.deep.equals({"stat1": {name: "Stat eins", key: "stat1", selectedOrder: 0}, "stat3": {name: "Stat drei", key: "stat3", selectedOrder: 1}});

            });
        });
        describe("removeSelectedStatsByCategory", () => {
            it("should remove the statistics by the given category", async () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        referenceData,
                        enableButtons,
                        statistics: [{
                            "stat1": {
                                category: "Kategorie 1",
                                name: "Stat eins"
                            }
                        },
                        {
                            "stat2": {
                                category: "Kategorie 2",
                                name: "Stat zwei"
                            }
                        }]
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.setSelectedCategories([{name: "Kategorie 1"}]);
                wrapper.vm.setSelectedStatistics({"stat1": {
                    category: "Kategorie 1",
                    name: "Stat eins"
                }});
                await wrapper.vm.$nextTick();
                wrapper.vm.removeSelectedStatsByCategory({name: "Kategorie 1"});
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.selectedStatistics).to.be.an("object").to.be.empty;
            });
            it("should not remove the statistics by the given category if category 'alle' is selected", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        referenceData,
                        enableButtons,
                        areCategoriesGrouped: false,
                        statistics: [{
                            "stat1": {
                                category: "Kategorie 1",
                                name: "Stat eins"
                            }
                        },
                        {
                            "stat2": {
                                category: "Kategorie 2",
                                name: "Stat zwei"
                            }
                        }]
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.setSelectedCategories([{name: "Kategorie 1"}, {name: "alle"}]);
                wrapper.vm.setSelectedStatistics({"stat1": {
                    category: "Kategorie 1",
                    name: "Stat eins"
                }});
                wrapper.vm.removeSelectedStatsByCategory({name: "Kategorie 1"});
                expect(wrapper.vm.selectedStatistics).to.deep.equal({"stat1": {
                    category: "Kategorie 1",
                    name: "Stat eins"
                }});
            });
            it("should remove all statistics whose category is not selected if 'alle' is passed", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        referenceData,
                        enableButtons,
                        areCategoriesGrouped: false,
                        statistics: [{
                            "stat1": {
                                category: "Kategorie 1",
                                name: "Stat eins"
                            }
                        },
                        {
                            "stat2": {
                                category: "Kategorie 2",
                                name: "Stat zwei"
                            }
                        }]
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.setSelectedCategories([{name: "Kategorie 1"}, {name: "alle"}]);
                wrapper.vm.setSelectedStatistics({
                    "stat1": {
                        category: "Kategorie 1",
                        name: "Stat eins"
                    }
                },
                {
                    "stat2": {
                        category: "Kategorie 2",
                        name: "Stat zwei"
                    }
                });
                wrapper.vm.removeSelectedStatsByCategory({name: "alle"});
                expect(wrapper.vm.selectedStatistics).to.deep.equal({"stat1": {
                    category: "Kategorie 1",
                    name: "Stat eins"
                }});
            });
        });
        describe("getCategoriesSorted", () => {
            it("should return an empty array", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        statistics: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getCategoriesSorted()).to.be.an("array").that.is.empty;
            });
            it("should return the list given as it is", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                        propsData: {
                            categories: [],
                            timeStepsFilter,
                            regions,
                            areCategoriesGrouped: false,
                            statistics: false,
                            referenceData,
                            enableButtons
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    unsorted = [{name: "foo"}, {name: "bar"}],
                    expected = [{name: "modules.statisticDashboard.button.all"}, {name: "foo"}, {name: "bar"}];

                expect(wrapper.vm.getCategoriesSorted(unsorted, [])).to.deep.equal(expected);
            });
            it("should return the list sorted by the selected ones at first", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                        propsData: {
                            categories: [],
                            timeStepsFilter,
                            regions,
                            areCategoriesGrouped: false,
                            statistics: false,
                            referenceData,
                            enableButtons
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    unsorted = [{name: "foo"}, {name: "bar"}],
                    expected = [{name: "bar"}, {name: "modules.statisticDashboard.button.all"}, {name: "foo"}];

                expect(wrapper.vm.getCategoriesSorted(unsorted, [{name: "bar"}])).to.deep.equal(expected);
            });
        });
        describe("getSortedStatisticNames", () => {
            it("should return an empty array", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getSortedStatisticNames()).to.be.an("array").that.is.empty;
            });
            it("should return the names of the given statistics", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getSortedStatisticNames(
                    [
                        {
                            "stat1": {
                                category: "Kategorie 1",
                                name: "Stat eins"
                            }
                        }
                    ], {})
                ).to.deep.equal([{key: "stat1", name: "Stat eins", category: "Kategorie 1"}]);
            });
            it("should return the names of the given statistics with the right alphabetical position", async () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getSortedStatisticNames(
                    [
                        {
                            "stat1": {
                                category: "Kategorie 1",
                                name: "Stat eins"
                            },
                            "stat2": {
                                category: "Kategorie 2",
                                name: "Stat zwei"
                            }
                        }
                    ],
                    {
                        "stat2": {
                            category: "Kategorie 2",
                            name: "Stat zwei"
                        }
                    }
                )).to.deep.equal([
                    {key: "stat1", name: "Stat eins", category: "Kategorie 1"},
                    {key: "stat2", name: "Stat zwei", category: "Kategorie 2"}
                ]);
            });
        });
        describe("getSelectedStatisticNames", () => {
            it("should return an empty array", async () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        statistics: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getSelectedStatisticNames()).to.be.an("array").that.is.empty;
            });
            it("should return an array with the selected statistic names in expected format", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter,
                        regions,
                        areCategoriesGrouped: false,
                        statistics: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getSelectedStatisticNames(
                    {
                        "stat1": {
                            category: "Kategorie 1",
                            name: "Stat eins"
                        }
                    }
                )).to.deep.equal([{key: "stat1", name: "Stat eins", category: "Kategorie 1"}]);
            });
        });
        describe("getSortedDates", () => {
            it("should return an empty array", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        categories: [],
                        timeStepsFilter: [],
                        regions,
                        areCategoriesGrouped: false,
                        statistics: false,
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getSortedDates([])).to.be.an("array").that.is.empty;
            });
            it("should return the array with all dates as given", () => {
                const localTimeSteps = [
                        {label: "Die letzten 5 Jahre", value: []},
                        {label: "Die letzten 10 Jahre", value: []},
                        {label: "Alle Jahre", value: []}
                    ],
                    wrapper = shallowMount(StatisticDashboardControls, {
                        propsData: {
                            categories: [],
                            timeStepsFilter,
                            regions,
                            areCategoriesGrouped: false,
                            statistics: false,
                            referenceData,
                            enableButtons
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.getSortedDates(localTimeSteps)).to.deep.equal(localTimeSteps);
            });
            it("should return the array with the selected entries at first", () => {
                const localTimeSteps = [
                        {label: "Die letzten 5 Jahre", value: []},
                        {label: "Die letzten 10 Jahre", value: []},
                        {label: "Alle Jahre", value: []}
                    ],
                    wrapper = shallowMount(StatisticDashboardControls, {
                        propsData: {
                            categories: [],
                            timeStepsFilter,
                            regions,
                            areCategoriesGrouped: false,
                            statistics: false,
                            referenceData,
                            enableButtons
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.getSortedDates(localTimeSteps, [{label: "Alle Jahre", value: []}])).to.deep.equal([
                    {label: "Alle Jahre", value: []},
                    {label: "Die letzten 5 Jahre", value: []},
                    {label: "Die letzten 10 Jahre", value: []}
                ]);
            });
        });
        describe("handleReferenceTag", () => {
            it("should set the referenceTag to undefined if undefined is given", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.handleReferenceTag(undefined);
                expect(wrapper.vm.referenceTag).to.be.undefined;

            });
            it("should set the referenceTag to expected string if given param is an object with value attribute", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.handleReferenceTag({value: "foo"});
                expect(wrapper.vm.referenceTag).to.be.equal("foo: ");

            });
            it("should set the referenceTag to expected string if given param is an object with an object as value for the property value", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.handleReferenceTag({value: {label: "foo"}});
                expect(wrapper.vm.referenceTag).to.be.equal("foo");

            });
        });
        describe("nextDescription", () => {
            it("should set currentDescriptionIndex always to 0 if only one description is available", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        descriptions: [descriptions[0]],
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);
                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);

            });

            it("should set currentDescriptionIndex in the correct order", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        descriptions,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);
                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(1);
                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(2);
                wrapper.vm.nextDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);

            });
        });
        describe("prevDescription", () => {
            it("should set currentDescriptionIndex always to 0 if only one description is available", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        descriptions: [descriptions[0]],
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);
                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);

            });

            it("should set currentDescriptionIndex in the correct order", () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        descriptions,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);
                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(2);
                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(1);
                wrapper.vm.prevDescription();
                expect(wrapper.vm.currentDescriptionIndex).to.be.equal(0);

            });
        });
        describe("prevStatistic", () => {
            it("should set the chosenStatisticName to the previous name", async () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                        propsData: {
                            referenceData,
                            enableButtons
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    statistics = {
                        "arbeitnehmer_inland_tausend": {
                            "key": "arbeitnehmer_inland_tausend",
                            "name": "Arbeitnehmer (Inland) in 1.000",
                            "category": "Beschäftigte",
                            "selectedOrder": 0
                        },
                        "arbeitslose_jahresdurchschnitt": {
                            "key": "arbeitslose_jahresdurchschnitt",
                            "name": "Arbeitslose",
                            "category": "Beschäftigte",
                            "selectedOrder": 1
                        }
                    };

                wrapper.vm.prevStatistic(1, statistics);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.chosenStatisticName).to.be.equal("Arbeitnehmer (Inland) in 1.000");
            });
        });
        describe("nextStatistic", () => {
            it("should set the chosenStatisticName to the next name", async () => {
                const wrapper = shallowMount(StatisticDashboardControls, {
                        propsData: {
                            referenceData,
                            enableButtons
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    statistics = {
                        "arbeitnehmer_inland_tausend": {
                            "key": "arbeitnehmer_inland_tausend",
                            "name": "Arbeitnehmer (Inland) in 1.000",
                            "category": "Beschäftigte",
                            "selectedOrder": 0
                        },
                        "arbeitslose_jahresdurchschnitt": {
                            "key": "arbeitslose_jahresdurchschnitt",
                            "name": "Arbeitslose",
                            "category": "Beschäftigte",
                            "selectedOrder": 1
                        }
                    };

                wrapper.vm.nextStatistic(0, statistics);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.chosenStatisticName).to.be.equal("Arbeitslose");
            });
        });
    });

    describe("User Interaction", () => {
        it("should set the description index if the user click the left chevron button", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        descriptions,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                }),
                chevronLeftButton = wrapper.findAll("button.description-icons").at(0);

            await chevronLeftButton.trigger("click");
            expect(wrapper.vm.currentDescriptionIndex).to.be.equal(2);
        });

        it("should set the description index if the user click the right chevron button ", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        descriptions,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                }),
                chevronRightButton = wrapper.findAll("button.description-icons").at(1);

            await chevronRightButton.trigger("click");
            expect(wrapper.vm.currentDescriptionIndex).to.be.equal(1);
        });

        it("should set the chosenStatisticName to the previous name", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                propsData: {
                    referenceData,
                    enableButtons
                },
                global: {
                    plugins: [store]
                }
            });
            let prevStatisticButton = "";

            wrapper.vm.setData({indexSelectedStatistics: 0});
            wrapper.vm.setSelectedStatistics({
                "arbeitnehmer_inland_tausend": {
                    "key": "arbeitnehmer_inland_tausend",
                    "name": "Arbeitnehmer (Inland) in 1.000",
                    "category": "Beschäftigte",
                    "selectedOrder": 0
                },
                "arbeitslose_jahresdurchschnitt": {
                    "key": "arbeitslose_jahresdurchschnitt",
                    "name": "Arbeitslose",
                    "category": "Beschäftigte",
                    "selectedOrder": 1
                }
            });
            wrapper.vm.setChartTableToggle("table");
            wrapper.vm.setSelectedDates([{value: "value1"}]);
            wrapper.vm.setSelectedRegions([{value: "value1"}]);

            await wrapper.vm.$nextTick();
            wrapper.vm.setData({indexSelectedStatistics: 1});
            prevStatisticButton = wrapper.findAll(".slider-control").at(0);
            prevStatisticButton.trigger("click");
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.chosenStatisticName).to.be.equal("Arbeitslose");
        });

        it("should set the chosenStatisticName to the next name", async () => {
            const wrapper = shallowMount(StatisticDashboardControls, {
                    propsData: {
                        referenceData,
                        enableButtons
                    },
                    global: {
                        plugins: [store]
                    }
                }),
                nextStatisticButton = wrapper.findAll(".slider-control").at(1);

            wrapper.vm.setData({indexSelectedStatistics: 0});
            wrapper.vm.setSelectedStatistics({
                "arbeitnehmer_inland_tausend": {
                    "key": "arbeitnehmer_inland_tausend",
                    "name": "Arbeitnehmer (Inland) in 1.000",
                    "category": "Beschäftigte",
                    "selectedOrder": 0
                },
                "arbeitslose_jahresdurchschnitt": {
                    "key": "arbeitslose_jahresdurchschnitt",
                    "name": "Arbeitslose",
                    "category": "Beschäftigte",
                    "selectedOrder": 1
                }
            });
            wrapper.vm.setChartTableToggle("table");
            wrapper.vm.setSelectedDates([{value: "value1"}]);
            wrapper.vm.setSelectedRegions([{value: "value1"}]);

            await wrapper.vm.$nextTick();
            nextStatisticButton.trigger("click");
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.chosenStatisticName).to.be.equal("Arbeitslose");
        });
    });
});
