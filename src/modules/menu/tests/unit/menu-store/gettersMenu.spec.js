import sinon from "sinon";
import {expect} from "chai";
import gettersMenu from "@modules/menu/menu-store/gettersMenu.js";
import idxProvider from "@shared/js/utils/idx.js";
import {createPinia, setActivePinia} from "pinia";
import {useMenuStore} from "@modules/menu/menu-store/menuStore.js";


describe("src/modules/menu/menu-store/gettersMenu.js", () => {
    const mainMenuSymbol = Symbol("mainMenu"),
        secondaryMenuSymbol = Symbol("secondaryMenu");
    let consoleErrorSpy,
        getters,
        stateMenu,
        state;

    beforeEach(() => {
        setActivePinia(createPinia());
        stateMenu = useMenuStore().$state;

        consoleErrorSpy = sinon.spy();
        sinon.stub(console, "error").callsFake(consoleErrorSpy);
        state = {
            mainMenu: mainMenuSymbol,
            secondaryMenu: secondaryMenuSymbol
        };
        getters = {
            mainMenu: null,
            secondaryMenu: null
        };
    });


    describe("currentComponent", () => {
        beforeEach(() => {
            state = {
                mainMenu: {
                    navigation: {
                        currentComponent: "abc"
                    }
                },
                secondaryMenu: {
                    navigation: {
                        currentComponent: "xyz"
                    }
                }
            };
        });

        it("should return the current component for mainMenu", () => {
            const side = "mainMenu",
                currentComponent = gettersMenu.currentComponent(state)(side);

            expect(currentComponent).to.equal("abc");
        });

        it("should return the current component for secondaryMenu", () => {
            const side = "secondaryMenu",
                currentComponent = gettersMenu.currentComponent(state)(side);

            expect(currentComponent).to.equal("xyz");
        });
    });

    describe("currentComponentName", () => {
        beforeEach(() => {
            state = {
                mainMenu: {
                    navigation: {
                        currentComponent: {
                            type: "root",
                            props: []
                        }
                    }
                },
                secondaryMenu: {
                    navigation: {
                        currentComponent: {
                            type: "xyz",
                            props: {
                                name: "common:xyz"
                            }
                        }
                    }
                }
            };
        });

        it("should return the current component name for mainMenu", () => {
            const side = "mainMenu",
                currentComponentName = gettersMenu.currentComponentName(state)(side);

            expect(currentComponentName).to.equal(i18next.t("common:modules.menu.name"));
        });

        it("should return the current component name for secondaryMenu", () => {
            const side = "secondaryMenu",
                currentComponentName = gettersMenu.currentComponentName(state)(side);

            expect(currentComponentName).to.equal(i18next.t("common:xyz"));
        });
    });

    describe("currentFolderPath", () => {
        beforeEach(() => {
            state = {
                mainMenu: {
                    navigation: {
                        currentComponent: {
                            props: {
                                path: [1, 2, 3]
                            }
                        }
                    }
                },
                secondaryMenu: {
                    navigation: {
                        currentComponent: {
                            props: {
                                path: ["x", "y", "z"]
                            }
                        }
                    }
                }
            };
        });

        it("should return the current folder path for mainMenu", () => {
            const side = "mainMenu",
                currentFolderPath = gettersMenu.currentFolderPath(state)(side);

            expect(currentFolderPath).to.deep.equal([1, 2, 3]);
        });

        it("should return the current folder path for secondaryMenu", () => {
            const side = "secondaryMenu",
                currentFolderPath = gettersMenu.currentFolderPath(state)(side);

            expect(currentFolderPath).to.deep.equal(["x", "y", "z"]);
        });
    });

    describe("deactivateModule", () => {
        it("should return true, if module hasMouseMapInteractions === true and is not equal currentMouseMapInteractionsComponent", () => {
            const type = "measure";

            state = {
                activeModuleMouseMapInteractions: "getFeatureInfo"
            };

            expect(gettersMenu.deactivateModule(state)(type)).to.be.true;
        });

        it("should return false, if module is equal currentMouseMapInteractionsComponent", () => {
            const type = "measure";

            state = {
                activeModuleMouseMapInteractions: "Measure"
            };

            expect(gettersMenu.deactivateModule(state)(type)).to.be.false;
        });
    });

    describe("expanded", () => {
        beforeEach(() => {
            state = {
                mainMenu: {
                    expanded: true
                },
                secondaryMenu: {
                    expanded: false
                }
            };
        });

        it("should return the expanded for mainMenu", () => {
            const side = "mainMenu",
                expanded = gettersMenu.expanded(state)(side);

            expect(expanded).to.be.true;
        });

        it("should return the expandedfor secondaryMenu", () => {
            const side = "secondaryMenu",
                expanded = gettersMenu.expanded(state)(side);

            expect(expanded).to.be.false;
        });
    });

    describe("mainExpanded", () => {
        it("should return false if mainMenu is null", () => {
            state.mainMenu = {
                expanded: false
            };

            expect(gettersMenu.mainExpanded(state)).to.equal(false);
        });
        it("should return false if Expanded is not a boolean set on mainMenu", () => {
            expect(gettersMenu.mainExpanded(stateMenu)).to.equal(false);
        });
        it("should return the value of Expanded if mainMenu is not null (loaded) and is a boolean value on mainMenu", () => {
            state.mainMenu = {
                expanded: true
            };

            expect(gettersMenu.mainExpanded(state)).to.equal(true);
        });
    });

    describe("mainTitle", () => {
        it("should return null if mainMenu is null", () => {
            state.mainMenu = {
                title: null
            };

            expect(gettersMenu.mainTitle(state)).to.equal(null);
        });
        it("should return null if title is not defined on mainMenu", () => {
            expect(gettersMenu.mainTitle(stateMenu)).to.equal(null);
        });
        it("should return the title if it is defined on mainMenu", () => {
            const title = {
                "text": "Master",
                "logo": "https://geodienste.hamburg.de/lgv-config/img/hh-logo.png",
                "link": "https://geoinfo.hamburg.de",
                "toolTip": "Landesbetrieb Geoinformation und Vermessung"
            };

            state.mainMenu = {title};

            expect(gettersMenu.mainTitle(state)).to.deep.equal(title);
        });
    });

    describe("mainToggleButtonIcon", () => {
        it("should return the configured icon for the mainMenu if configured", () => {
            const toggleButtonIcon = "bi-bucket";

            state.mainMenu = {toggleButtonIcon};

            expect(gettersMenu.mainToggleButtonIcon(state)).to.equal(toggleButtonIcon);
        });
        it("should return the default icon if it isn't configured on mainMenu", () => {
            expect(gettersMenu.mainToggleButtonIcon(stateMenu)).to.equal("bi-list");
        });
    });

    describe("previousNavigationEntryText", () => {
        beforeEach(() => {
            state = {
                mainMenu: {
                    navigation: {
                        history: [
                            {
                                type: "root",
                                props: []
                            }
                        ]
                    }
                },
                secondaryMenu: {
                    navigation: {
                        history: [
                            {
                                type: "root",
                                props: []
                            },
                            {
                                type: "xyz",
                                props: {
                                    name: "common:xyz"
                                }
                            }
                        ]
                    }
                }
            };
        });

        it("should return the previous navigation entry text for mainMenu", () => {
            const side = "mainMenu",
                previousNavigationEntryText = gettersMenu.previousNavigationEntryText(state)(side);

            expect(previousNavigationEntryText).to.equal(i18next.t("common:modules.menu.name"));
        });

        it("should return the previous navigation entry text for secondaryMenu", () => {
            const side = "secondaryMenu",
                previousNavigationEntryText = gettersMenu.previousNavigationEntryText(state)(side);

            expect(previousNavigationEntryText).to.equal(i18next.t("common:xyz"));
        });
    });

    describe("secondaryExpanded", () => {
        it("should return false if secondaryMenu is null", () => {
            state.secondaryMenu = {
                expanded: false
            };

            expect(gettersMenu.secondaryExpanded(state)).to.equal(false);
        });
        it("should return false if Expanded is not a boolean set on secondaryMenu", () => {
            expect(gettersMenu.secondaryExpanded(stateMenu)).to.equal(false);
        });
        it("should return the value of Expanded if secondaryMenu is not null (loaded) and is a boolean value on secondaryMenu", () => {
            state.secondaryMenu = {expanded: true};

            expect(gettersMenu.secondaryExpanded(state)).to.equal(true);
        });
    });

    describe("secondaryTitle", () => {
        it("should return null if secondaryMenu is null", () => {
            state.secondaryMenu = {
                title: null
            };

            expect(gettersMenu.secondaryTitle(state)).to.equal(null);
        });
        it("should return null if title is not defined on secondaryMenu", () => {
            expect(gettersMenu.secondaryTitle(stateMenu)).to.equal(null);
        });
        it("should return the title if it is defined on secondaryMenu", () => {
            const title = {
                "text": "Master",
                "logo": "https://geodienste.hamburg.de/lgv-config/img/hh-logo.png",
                "link": "https://geoinfo.hamburg.de",
                "toolTip": "Landesbetrieb Geoinformation und Vermessung"
            };

            state.secondaryMenu = {title};

            expect(gettersMenu.secondaryTitle(state)).to.deep.equal(title);
        });
    });

    describe("secondaryToggleButtonIcon", () => {
        it("should return the configured icon for the secondaryMenu if configured", () => {
            const toggleButtonIcon = "bi-bucket";

            state.secondaryMenu = {toggleButtonIcon};

            expect(gettersMenu.secondaryToggleButtonIcon(state)).to.equal(toggleButtonIcon);
        });
        it("should return the default icon if it isn't configured on secondaryMenu", () => {
            expect(gettersMenu.secondaryToggleButtonIcon(stateMenu)).to.equal("bi-tools");
        });
    });

    describe("section", () => {
        const goodPath = Symbol("woowee we found something");
        let foundSection, path;

        beforeEach(() => {
            foundSection = idxProvider.badPathSymbol;
            path = [];
            sinon.stub(idxProvider, "idx").callsFake(() => foundSection);
        });

        it("should return a found object from the getters through the given path if it exists for mainMenu", () => {
            foundSection = goodPath;
            path.push("mainMenu", "sections", 0);
            state = {
                mainMenu: {
                    sections: [
                        goodPath
                    ]
                }
            };

            expect(gettersMenu.section(state)(path)).to.equal(goodPath);
            expect(consoleErrorSpy.notCalled).to.be.true;
        });
        it("should return a found object from the getters through the given path if it exists for secondaryMenu", () => {
            foundSection = goodPath;
            path.push("secondaryMenu", "sections", 0);
            state = {
                secondaryMenu: {
                    sections: [
                        goodPath
                    ]
                }
            };

            expect(gettersMenu.section(state)(path)).to.equal(goodPath);
            expect(consoleErrorSpy.notCalled).to.be.true;
        });
        it("should return null and log an error if the first index of the path ('mainMenu' or 'secondaryMenu') is not null but the idx function return badPathSymbol", () => {
            path.push("mainMenu", "sections", 0);
            state = {
                mainMenu: {
                    sections: [
                        goodPath
                    ]
                }
            };

            expect(gettersMenu.section(state)(path)).to.equal(null);
            expect(consoleErrorSpy.calledOnce).to.be.true;
            expect(consoleErrorSpy.firstCall.args.length).to.equal(1);
            expect(consoleErrorSpy.firstCall.args[0]).to.equal(`Menu.getters.section: ${idxProvider.badPathSymbol.description} ${path}.`);
        });
        it("should return null and log an error if the first index of the path ('mainMenu' or 'secondaryMenu') is null", () => {
            path.push("mainMenu", "sections", 0);

            state = {};
            expect(gettersMenu.section(state)(path)).to.equal(null);
            expect(consoleErrorSpy.calledOnce).to.be.true;
            expect(consoleErrorSpy.firstCall.args.length).to.equal(1);
            expect(consoleErrorSpy.firstCall.args[0]).to.equal(`Menu: The given menu ${path[0]} is not configured in the config.json.`);
        });
    });

    describe("showDescription", () => {
        beforeEach(() => {
            state = {
                mainMenu: {
                    showDescription: false
                },
                secondaryMenu: {
                    showDescription: true
                }
            };
        });

        it("should return the showDescription for mainMenu", () => {
            const side = "mainMenu",
                showDescription = gettersMenu.showDescription(state)(side);

            expect(showDescription).to.be.false;
        });

        it("should return the showDescription for secondaryMenu", () => {
            const side = "secondaryMenu",
                showDescription = gettersMenu.showDescription(state)(side);

            expect(showDescription).to.be.true;
        });
    });

    describe("sectionHasItems", () => {
        it("should return false if section is missing", () => {
            state = {
                mainMenu: {
                    sections: []
                }
            };

            const result = gettersMenu.sectionHasItems(state)("mainMenu", 0);

            expect(result).to.be.false;
        });

        it("should return true for array sections with items", () => {
            state = {
                mainMenu: {
                    sections: [
                        ["item"]
                    ]
                }
            };

            const result = gettersMenu.sectionHasItems(state)("mainMenu", 0);

            expect(result).to.be.true;
        });

        it("should return true for object sections with elements", () => {
            state = {
                mainMenu: {
                    sections: [
                        {
                            elements: ["item"]
                        }
                    ]
                }
            };

            const result = gettersMenu.sectionHasItems(state)("mainMenu", 0);

            expect(result).to.be.true;
        });

        it("should return false for object sections without elements", () => {
            state = {
                mainMenu: {
                    sections: [
                        {
                            type: "section"
                        }
                    ]
                }
            };

            const result = gettersMenu.sectionHasItems(state)("mainMenu", 0);

            expect(result).to.be.false;
        });
    });

    describe("titleBySide", () => {
        const exampleTitle = {
            text: "Precise name",
            logo: "some png source",
            link: "https://valid.url.com",
            toolTip: "More info"
        };

        it("should return the mainTitle properties as well as the side as idAppendix if the side is 'mainMenu' and 'mainTitle' is defined", () => {
            state = {
                mainMenu: {
                    title: exampleTitle
                },
                secondaryMenu: {
                    title: null
                }
            };

            const side = "mainMenu",
                nameObject = gettersMenu.titleBySide(state)(side);

            expect(nameObject).to.not.equal(null);
            expect(nameObject.text).to.equal(exampleTitle.text);
            expect(nameObject.logo).to.equal(exampleTitle.logo);
            expect(nameObject.link).to.equal(exampleTitle.link);
            expect(nameObject.toolTip).to.equal(exampleTitle.toolTip);
            expect(nameObject.idAppendix).to.equal(side);
        });

        it("should return the mainTitle properties as well as the side as idAppendix if the side is 'secondaryMenu' and 'secondaryTitle' is defined", () => {
            state = {
                mainMenu: {
                    title: null
                },
                secondaryMenu: {
                    title: exampleTitle
                }
            };

            const side = "secondaryMenu",
                nameObject = gettersMenu.titleBySide(state)(side);

            expect(nameObject).to.not.equal(null);
            expect(nameObject.text).to.equal(exampleTitle.text);
            expect(nameObject.logo).to.equal(exampleTitle.logo);
            expect(nameObject.link).to.equal(exampleTitle.link);
            expect(nameObject.toolTip).to.equal(exampleTitle.toolTip);
            expect(nameObject.idAppendix).to.equal(side);
        });
        it("should return null if a given side does not have a name defined", () => {
            state = {
                mainMenu: {
                    title: null
                },
                secondaryMenu: {
                    title: null
                }
            };

            expect(gettersMenu.titleBySide(state)("mainMenu")).to.equal(null);
        });

        it("should return null if a given side does not equal 'mainMenu' or 'secondaryMenu'", () => {
            state = {
                mainMenu: {
                    title: null
                },
                secondaryMenu: {
                    title: null
                }
            };

            expect(gettersMenu.titleBySide(state)("newMenu")).to.equal(null);
        });
    });

    describe("urlParams", () => {
        beforeEach(() => {
            state = {
                mainMenu: {
                    currentComponent: "root"
                },
                secondaryMenu: {
                    currentComponent: "abc"
                }
            };

            getters = {
                getComponentAttributes: component => {
                    return component === "root"
                        ? undefined
                        : {a: "1", b: "2"};
                }
            };
        });

        it("should return the menu params with attributes", () => {
            const context = {
                    mainMenu: state.mainMenu,
                    secondaryMenu: state.secondaryMenu,
                    getComponentAttributes: getters.getComponentAttributes
                },
                params = gettersMenu.urlParams.call(context);

            expect(params).to.deep.equals({
                main: {
                    currentComponent: "root"
                },
                secondary: {
                    currentComponent: "abc",
                    attributes: {
                        a: "1",
                        b: "2"
                    }
                }
            });
        });
    });

    describe("getComponentAttributes", () => {
        it("should return undefined for root", () => {
            const moduleAttributes = gettersMenu.getComponentAttributes()("root");

            expect(moduleAttributes).to.be.undefined;
        });
    });

    describe("zoomToExtentPadding", () => {
        it("should return base padding if no menu is expanded", () => {
            state = {
                mainMenu: {
                    expanded: false
                },
                secondaryMenu: {
                    expanded: false
                },
                currentMainMenuOffsetWidth: 300,
                currentSecondaryMenuOffsetWidth: 200
            };

            const result = gettersMenu.zoomToExtentPadding(state);

            expect(result).to.deep.equal([20, 20, 20, 20]);
        });

        it("should include both menu widths if both menus are expanded", () => {
            state = {
                mainMenu: {
                    expanded: true
                },
                secondaryMenu: {
                    expanded: true
                },
                currentMainMenuOffsetWidth: 300,
                currentSecondaryMenuOffsetWidth: 200
            };

            const result = gettersMenu.zoomToExtentPadding(state);

            expect(result).to.deep.equal([20, 220, 20, 320]);
        });

        it("should include only the expanded menu width", () => {
            state = {
                mainMenu: {
                    expanded: false
                },
                secondaryMenu: {
                    expanded: true
                },
                currentMainMenuOffsetWidth: 300,
                currentSecondaryMenuOffsetWidth: 200
            };

            const result = gettersMenu.zoomToExtentPadding(state);

            expect(result).to.deep.equal([20, 220, 20, 20]);
        });
    });

    describe("secondaryMenuEnabled", () => {
        it("should return false if secondaryMenu.sections is undefined", () => {
            state = {
                secondaryMenu: {}
            };

            const result = gettersMenu.secondaryMenuEnabled(state);

            expect(result).to.be.false;
        });

        it("should return false if sections is not an array", () => {
            state = {
                secondaryMenu: {
                    sections: null
                }
            };

            const result = gettersMenu.secondaryMenuEnabled(state);

            expect(result).to.be.false;
        });

        it("should return false if sections is an empty array", () => {
            state = {
                secondaryMenu: {
                    sections: []
                }
            };

            const result = gettersMenu.secondaryMenuEnabled(state);

            expect(result).to.be.false;
        });

        it("should return false if sections contain empty arrays", () => {
            state = {
                secondaryMenu: {
                    sections: [
                        [],
                        []
                    ]
                }
            };

            const result = gettersMenu.secondaryMenuEnabled(state);

            expect(result).to.be.false;
        });

        it("should return true if at least one section contains items", () => {
            state = {
                secondaryMenu: {
                    sections: [
                        [],
                        ["item1"],
                        []
                    ]
                }
            };

            const result = gettersMenu.secondaryMenuEnabled(state);

            expect(result).to.be.true;
        });

        it("should return false if sections contain non-array values", () => {
            state = {
                secondaryMenu: {
                    sections: [
                        null,
                        "not-an-array"
                    ]
                }
            };

            const result = gettersMenu.secondaryMenuEnabled(state);

            expect(result).to.be.false;
        });

        it("should return true if one section is an object with elements", () => {
            state = {
                secondaryMenu: {
                    sections: [
                        {
                            type: "group"
                        },
                        {
                            elements: ["item1"]
                        }
                    ]
                }
            };

            const result = gettersMenu.secondaryMenuEnabled(state);

            expect(result).to.be.true;
        });
    });
});
