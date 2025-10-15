import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import PaginationControl from "../../../components/PaginationControl.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/pagination/components/PaginationControl.vue", () => {

    const currentPage = 2,
        totalPages = 10;

    it("should render a pagination control", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage, totalPages}
            }),
            paginationControls = wrapper.find(".pagination-controls");

        expect(paginationControls.exists()).to.be.true;
    });

    it("should render Bootstrap pagination structure", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage, totalPages}
            }),
            nav = wrapper.find("nav"),
            ul = wrapper.find("ul.pagination"),
            pageItems = wrapper.findAll("li.page-item");

        expect(nav.exists()).to.be.true;
        expect(ul.exists()).to.be.true;
        expect(pageItems.length).to.be.greaterThan(0);
    });

    it("should display the correct current page", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage, totalPages}
            }),
            activePageItem = wrapper.find("li.page-item.active"),
            activeButton = activePageItem.find("button.page-link");

        expect(activePageItem.exists()).to.be.true;
        expect(activeButton.text()).to.equal("2");
    });

    it("should have next and previous buttons", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage, totalPages}
            }),
            buttons = wrapper.findAll("button.page-link"),
            prevButton = buttons[0],
            nextButton = buttons[buttons.length - 1];

        expect(prevButton.find("i.bi-chevron-left").exists()).to.be.true;
        expect(nextButton.find("i.bi-chevron-right").exists()).to.be.true;
    });

    it("should disable previous button on first page", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage: 1, totalPages}
            }),
            pageItems = wrapper.findAll("li.page-item"),
            prevPageItem = pageItems[0],
            prevButton = prevPageItem.find("button");

        expect(prevPageItem.classes()).to.include("disabled");
        expect(prevButton.attributes("disabled")).to.exist;
    });

    it("should disable next button on last page", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage: totalPages, totalPages}
            }),
            pageItems = wrapper.findAll("li.page-item"),
            nextPageItem = pageItems[pageItems.length - 1],
            nextButton = nextPageItem.find("button");

        expect(nextPageItem.classes()).to.include("disabled");
        expect(nextButton.attributes("disabled")).to.exist;
    });

    it("should emit page-change event when a page is clicked", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage, totalPages}
            }),
            pageButtons = wrapper.findAll("button.page-link"),
            pageOneButton = pageButtons.find(button => button.text() === "1");

        expect(pageOneButton).to.exist;
        await pageOneButton.trigger("click");
        expect(wrapper.emitted("page-change")).to.exist;
        expect(wrapper.emitted("page-change")[0][0]).to.equal(1);
    });

    it("should emit page-change event when previous button is clicked", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage: 3, totalPages}
            }),
            buttons = wrapper.findAll("button.page-link"),
            prevButton = buttons[0];

        await prevButton.trigger("click");
        expect(wrapper.emitted("page-change")).to.exist;
        expect(wrapper.emitted("page-change")[0][0]).to.equal(2);
    });

    it("should emit page-change event when next button is clicked", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage: 3, totalPages}
            }),
            buttons = wrapper.findAll("button.page-link"),
            nextButton = buttons[buttons.length - 1];

        await nextButton.trigger("click");
        expect(wrapper.emitted("page-change")).to.exist;
        expect(wrapper.emitted("page-change")[0][0]).to.equal(4);
    });

    it("should show dots for pagination when there are many pages", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage: 5, totalPages: 20}
            }),
            visiblePages = wrapper.vm.visiblePages;

        expect(visiblePages).to.deep.equal([1, "...", 4, 5, 6, "...", 20]);
    });

    it("should show ellipsis elements correctly", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage: 5, totalPages: 20}
            }),
            ellipsisElements = wrapper.findAll("span.ellipsis");

        expect(ellipsisElements.length).to.equal(2);
        ellipsisElements.forEach(el => {
            expect(el.text()).to.equal("...");
        });
    });

    it("should not emit page-change when clicking disabled button", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage: 1, totalPages}
            }),
            buttons = wrapper.findAll("button.page-link"),
            prevButton = buttons[0];

        await prevButton.trigger("click");
        expect(wrapper.emitted("page-change")).to.not.exist;
    });

    it("should not emit page-change when clicking ellipsis", async () => {
        const wrapper = mount(PaginationControl, {
                props: {currentPage: 5, totalPages: 20}
            }),
            ellipsisElements = wrapper.findAll("span.ellipsis");

        expect(ellipsisElements.length).to.be.greaterThan(0);
        await ellipsisElements[0].trigger("click");
        expect(wrapper.emitted("page-change")).to.not.exist;
    });

    describe("visiblePages computed property", () => {
        it("should show all pages when totalPages <= 7", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 3, totalPages: 5}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, 2, 3, 4, 5]);
        });

        it("should show all pages when totalPages = 7", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 4, totalPages: 7}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
        });

        it("should show correct pages when currentPage <= 4", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 1, totalPages: 10}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, 2, 3, 4, 5, "...", 10]);
        });

        it("should show correct pages when currentPage = 3", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 3, totalPages: 10}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, 2, 3, 4, 5, "...", 10]);
        });

        it("should show correct pages when currentPage >= totalPages - 3", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 8, totalPages: 10}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, "...", 6, 7, 8, 9, 10]);
        });

        it("should show correct pages when currentPage = totalPages", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 10, totalPages: 10}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, "...", 6, 7, 8, 9, 10]);
        });

        it("should show correct pages for middle pages with neighbors", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 5, totalPages: 10}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, "...", 4, 5, 6, "...", 10]);
        });

        it("should handle edge case with totalPages = 8 and currentPage = 4", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 4, totalPages: 8}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, 2, 3, 4, 5, "...", 8]);
        });

        it("should handle edge case with totalPages = 8 and currentPage = 6", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 6, totalPages: 8}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, "...", 4, 5, 6, 7, 8]);
        });

        it("should handle large page numbers correctly", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 50, totalPages: 100}
                }),
                visiblePages = wrapper.vm.visiblePages;

            expect(visiblePages).to.deep.equal([1, "...", 49, 50, 51, "...", 100]);
        });
    });

    describe("changePage method", () => {
        it("should not emit page-change for invalid page numbers", () => {
            const wrapper = mount(PaginationControl, {
                props: {currentPage: 5, totalPages: 10}
            });

            wrapper.vm.changePage(0);
            expect(wrapper.emitted("page-change")).to.not.exist;

            wrapper.vm.changePage(11);
            expect(wrapper.emitted("page-change")).to.not.exist;

            wrapper.vm.changePage(-1);
            expect(wrapper.emitted("page-change")).to.not.exist;
        });

        it("should emit page-change for valid page numbers", () => {
            const wrapper = mount(PaginationControl, {
                props: {currentPage: 5, totalPages: 10}
            });

            wrapper.vm.changePage(1);
            expect(wrapper.emitted("page-change")[0][0]).to.equal(1);

            wrapper.vm.changePage(10);
            expect(wrapper.emitted("page-change")[1][0]).to.equal(10);

            wrapper.vm.changePage(7);
            expect(wrapper.emitted("page-change")[2][0]).to.equal(7);
        });
    });

    describe("Mobile view", () => {
        it("should have mobile view structure", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 5, totalPages: 10}
                }),
                mobileView = wrapper.find(".mobile-view"),
                mobileNavContainer = wrapper.find(".mobile-nav-container");

            expect(mobileView.exists()).to.be.true;
            expect(mobileNavContainer.exists()).to.be.true;
        });

        it("should display current page and total pages in mobile view", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 5, totalPages: 10}
                }),
                pageNumber = wrapper.find(".page-number"),
                totalPagesElement = wrapper.find(".total-pages");

            expect(pageNumber.text()).to.equal("5");
            expect(totalPagesElement.text()).to.equal("10");
        });

        it("should have page dots in mobile view", () => {
            const wrapper = mount(PaginationControl, {
                    props: {currentPage: 3, totalPages: 10}
                }),
                pageDots = wrapper.findAll(".page-dot");

            expect(pageDots.length).to.equal(5);
            expect(pageDots[2].classes()).to.include("active");
        });
    });
});
