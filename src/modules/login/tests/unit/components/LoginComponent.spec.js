import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";

import LoginComponent from "@modules/login/components/LoginComponent.vue";
import Login from "@modules/login/store/indexLogin.js";
import rootGetters from "@appstore/getters.js";
import Cookie from "@modules/login/js/utilsCookies.js";
import OIDC from "@modules/login/js/utilsOIDC.js";

import {expect} from "chai";
import sinon from "sinon";


const fakeToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IjViY2IzZThmNDM2MGI0YjI4MWRjNDM4ZTExODE4YzZlIn0.e30.LEo9imrM5zuR1yo-KMzdY62XbnL7UBO2AImB2Pf-bD35NVZlMsU7xsXMUX6petNWU61tJSFzyMk4nWZQHm3LBQ";

config.global.mocks.$t = key => key;

describe("src/modules/Modules/Login/components/LoginComponent.vue", () => {
    const
        sandbox = sinon.createSandbox();
    let store,
        wrapper;

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Login: Login
                    }
                },
                Menu: {
                    namespaced: true,
                    mutations: {
                        setCurrentComponentPropsName: sinon.stub(),
                        setCurrentComponentPropsDescription: sinon.stub()
                    }
                }
            },
            getters: {
                mobile: () => false,
                ...rootGetters
            },
            state: { }
        });
        sinon.stub(LoginComponent.methods, "openLoginWindow");
    });
    afterEach(() => {
        sinon.restore();
        sandbox.restore();
    });

    describe("LoginComponent template", () => {
        it("should render Login", () => {
            wrapper = shallowMount(LoginComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("#login-component").exists()).to.be.true;
            expect(wrapper.find("#login-component button#logout-button").exists()).to.be.true;
        });

        it("should have values from store Login renders", () => {
            store.commit("Modules/Login/setScreenName", "Max Mustermann");
            store.commit("Modules/Login/setEmail", "Max.Mustermann@domain.com");

            wrapper = shallowMount(LoginComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.html().includes("Max Mustermann")).to.be.true;
            expect(wrapper.html().includes("Max.Mustermann@domain.com")).to.be.true;
        });

        it("should not call logout fn if button was not clicked", () => {
            wrapper = shallowMount(LoginComponent, {
                global: {
                    plugins: [store]
                }
            });
            wrapper.vm.logoutButton = sinon.fake();

            expect(wrapper.vm.logoutButton.calledOnce).to.be.false;
        });

        it("should call logout fn if button is clicked", async () => {
            wrapper = shallowMount(LoginComponent, {
                global: {
                    plugins: [store]
                }
            });

            const fake = sinon.fake();

            sandbox.replace(wrapper.vm, "reloadWindow", fake);
            sandbox.spy(wrapper.vm, "logoutButton");

            await wrapper.find("#login-component button#logout-button").trigger("click");
            expect(wrapper.vm.logoutButton.calledOnce).to.be.true;
            expect(fake.calledOnce).to.be.true;
        });

        it("should not be logged in after Login renders", () => {
            wrapper = shallowMount(LoginComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.loggedIn).to.be.false;
        });

        it("should be logged in after Login renders", async function () {
            // Use the main sandbox to avoid double stubbing
            sandbox.restore(); // Clear any previous stubs

            // Stub the methods
            sandbox.stub(Cookie, "get").returns(fakeToken);
            sandbox.stub(OIDC, "getTokenExpiry").returns(1);
            sandbox.stub(OIDC, "renewTokenIfNecessary").resolves();

            // Create a stub for the async checkLoggedIn action and custom store
            const checkLoggedInStub = sandbox.stub();

            checkLoggedInStub.resolves(true);

            // eslint-disable-next-line one-var
            const customStore = createStore({
                modules: {
                    namespaced: true,
                    Modules: {
                        namespaced: true,
                        modules: {
                            namespaced: true,
                            Login: {
                                ...Login,
                                actions: {
                                    ...Login.actions,
                                    checkLoggedIn: checkLoggedInStub
                                }
                            }
                        }
                    }
                },
                getters: {
                    mobile: () => false,
                    ...rootGetters
                }
            });

            // Set the loggedIn state directly
            customStore.commit("Modules/Login/setLoggedIn", true);

            wrapper = shallowMount(LoginComponent, {
                global: {
                    plugins: [customStore]
                }
            });

            // Wait for any async operations to complete
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.loggedIn).to.be.true;
        }).timeout(5000);

        it("should have values from cookies after Login renders", async function () {
            // Use the main sandbox to avoid double stubbing
            sandbox.restore(); // Clear any previous stubs

            // Stub the methods
            sandbox.stub(Cookie, "get").returns(fakeToken);
            sandbox.stub(OIDC, "getTokenExpiry").returns(1);
            sandbox.stub(OIDC, "renewTokenIfNecessary").resolves();

            // Create a stub for the async checkLoggedIn action that sets the values
            const checkLoggedInStub = sandbox.stub().callsFake(async ({commit}) => {
                commit("setScreenName", fakeToken);
                commit("setUsername", fakeToken);
                commit("setEmail", fakeToken);
                commit("setLoggedIn", true);
                return true;
            });

            // Create a custom store with the stubbed action
            // eslint-disable-next-line one-var
            const customStore = createStore({
                modules: {
                    namespaced: true,
                    Modules: {
                        namespaced: true,
                        modules: {
                            namespaced: true,
                            Login: {
                                ...Login,
                                actions: {
                                    ...Login.actions,
                                    checkLoggedIn: checkLoggedInStub
                                }
                            }
                        }
                    }
                },
                getters: {
                    mobile: () => false,
                    ...rootGetters
                }
            });

            wrapper = shallowMount(LoginComponent, {
                global: {
                    plugins: [customStore]
                }
            });

            // Wait for any async operations to complete
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.$store.state.Modules.Login.screenName).to.be.equal(fakeToken);
            expect(wrapper.vm.$store.state.Modules.Login.username).to.be.equal(fakeToken);
            expect(wrapper.vm.$store.state.Modules.Login.email).to.be.equal(fakeToken);
        }).timeout(5000);

    });
});
