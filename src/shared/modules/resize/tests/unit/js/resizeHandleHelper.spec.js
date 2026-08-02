import {expect} from "chai";
import sinon from "sinon";
import {clampAndApplyWidth, dimensionValidator} from "@shared/modules/resize/js/resizeHandleHelper.js";

describe("src/shared/modules/resize/js/resizeHandleHelper.js", () => {

    describe("clampAndApplyWidth", () => {
        let self, containerElement, otherMenuElement, handleElement;

        beforeEach(() => {
            handleElement = {
                style: {
                    maxWidth: "500px",
                    width: ""
                }
            };
            containerElement = {offsetWidth: 2000};
            otherMenuElement = {offsetWidth: 200};
            self = {
                side: "mainMenu",
                minWidth: 0.1,
                maxWidth: 0.9,
                handleElement,
                setMainMenuWidth: sinon.stub(),
                setSecondaryMenuWidth: sinon.stub()
            };

            sinon.stub(document, "getElementById").callsFake((id) => {
                if (id === "masterportal-container") {
                    return containerElement;
                }
                return otherMenuElement;
            });
        });

        it("should do nothing if the masterportal-container element is not found", () => {
            document.getElementById.callsFake((id) => {
                if (id === "masterportal-container") {
                    return null;
                }

                return otherMenuElement;
            });

            clampAndApplyWidth(self, 800, 300);
            expect(self.handleElement.style.width).to.equal("");
        });

        it("should do nothing if the other menu element is not found", () => {
            document.getElementById.callsFake((id) => {
                if (id === "masterportal-container") {
                    return containerElement;
                }

                return null;
            });

            clampAndApplyWidth(self, 800, 300);
            expect(self.handleElement.style.width).to.equal("");
        });

        it("should apply the calculatedWidth when it is within the min/max bounds", () => {
            clampAndApplyWidth(self, 800, 300);
            expect(self.handleElement.style.width).to.equal("800px");
        });

        it("should clamp width to the minimum bound when calculatedWidth is below the minimum", () => {
            clampAndApplyWidth(self, 100, 300);
            expect(self.handleElement.style.width).to.equal("200px");
        });

        it("should clamp width to the maximum bound when calculatedWidth exceeds the maximum", () => {
            clampAndApplyWidth(self, 1500, 300);
            expect(self.handleElement.style.width).to.equal("1300px");
        });

        it("should apply exactly the minimum bound width when calculatedWidth equals the minimum", () => {
            clampAndApplyWidth(self, 200, 300);
            expect(self.handleElement.style.width).to.equal("200px");
        });

        it("should apply exactly the maximum bound width when calculatedWidth equals the maximum", () => {
            clampAndApplyWidth(self, 1300, 300);
            expect(self.handleElement.style.width).to.equal("1300px");
        });

        it("should call setMainMenuWidth with the new width when side is 'mainMenu'", () => {
            self.side = "mainMenu";
            clampAndApplyWidth(self, 800, 300);
            expect(self.setMainMenuWidth.calledOnce).to.be.true;
            expect(self.setMainMenuWidth.calledWith(800)).to.be.true;
        });

        it("should call setSecondaryMenuWidth with the new width when side is 'secondaryMenu'", () => {
            self.side = "secondaryMenu";
            clampAndApplyWidth(self, 800, 300);
            expect(self.setSecondaryMenuWidth.calledOnce).to.be.true;
            expect(self.setSecondaryMenuWidth.calledWith(800)).to.be.true;
        });

        it("should not call setMainMenuWidth when side is 'secondaryMenu'", () => {
            self.side = "secondaryMenu";
            clampAndApplyWidth(self, 800, 300);
            expect(self.setMainMenuWidth.called).to.be.false;
        });

        it("should not call setSecondaryMenuWidth when side is 'mainMenu'", () => {
            self.side = "mainMenu";
            clampAndApplyWidth(self, 800, 300);
            expect(self.setSecondaryMenuWidth.called).to.be.false;
        });

        it("should look up 'mp-menu-secondaryMenu' as the other menu when side is 'mainMenu'", () => {
            self.side = "mainMenu";
            clampAndApplyWidth(self, 800, 300);
            expect(document.getElementById.calledWith("mp-menu-secondaryMenu")).to.be.true;
        });

        it("should look up 'mp-menu-mainMenu' as the other menu when side is 'secondaryMenu'", () => {
            self.side = "secondaryMenu";
            clampAndApplyWidth(self, 800, 300);
            expect(document.getElementById.calledWith("mp-menu-mainMenu")).to.be.true;
        });

        it("should factor the other menu's width into the maximum bound", () => {
            otherMenuElement.offsetWidth = 500;
            clampAndApplyWidth(self, 1200, 300);
            expect(self.handleElement.style.width).to.equal("1000px");
        });

        it("should reset maxWidth style to 'none' when it is not already 'none'", () => {
            self.handleElement.style.maxWidth = "600px";
            clampAndApplyWidth(self, 800, 300);
            expect(self.handleElement.style.maxWidth).to.equal("none");
        });

        it("should leave maxWidth style as 'none' when it is already 'none'", () => {
            self.handleElement.style.maxWidth = "none";
            clampAndApplyWidth(self, 800, 300);
            expect(self.handleElement.style.maxWidth).to.equal("none");
        });

        it("should round the resulting width up when the fractional part is >= 0.5", () => {
            clampAndApplyWidth(self, 800.7, 300);
            expect(self.handleElement.style.width).to.equal("801px");
        });

        it("should round the resulting width down when the fractional part is < 0.5", () => {
            clampAndApplyWidth(self, 800.2, 300);
            expect(self.handleElement.style.width).to.equal("800px");
        });

        it("should derive min/max bounds from the container's offsetWidth", () => {
            containerElement.offsetWidth = 4000;
            clampAndApplyWidth(self, 100, 300);
            expect(self.handleElement.style.width).to.equal("400px");
        });
    });

    describe("dimensionValidator", () => {
        it("should return true for a value between 0 and 1", () => {
            expect(dimensionValidator(0)).to.be.true;
            expect(dimensionValidator(0.5)).to.be.true;
            expect(dimensionValidator(1)).to.be.true;
        });

        it("should return false for a value below 0 or above 1", () => {
            expect(dimensionValidator(-0.1)).to.be.false;
            expect(dimensionValidator(1.1)).to.be.false;
        });

        it("should return false for invalid values", () => {
            expect(dimensionValidator("0.5")).to.be.false;
            expect(dimensionValidator("hello")).to.be.false;
            expect(dimensionValidator(Infinity)).to.be.false;
            expect(dimensionValidator(NaN)).to.be.false;
            expect(dimensionValidator(null)).to.be.false;
            expect(dimensionValidator(undefined)).to.be.false;
            expect(dimensionValidator(true)).to.be.false;
            expect(dimensionValidator(false)).to.be.false;
            expect(dimensionValidator([])).to.be.false;
            expect(dimensionValidator({})).to.be.false;
        });
    });
});
