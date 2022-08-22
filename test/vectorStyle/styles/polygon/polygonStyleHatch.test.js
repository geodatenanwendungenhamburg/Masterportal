import {drawHatch} from "../../../../src/vectorStyle/styles/polygon/polygonStyleHatch";

describe("polygonStyleHatches", function () {
    describe("drawHatch", function () {
        let context = null;

        beforeEach(function () {
            context = {
                stroke: jest.fn(),
                translate: jest.fn(),
                rotate: jest.fn(),
                beginPath: jest.fn(),
                rect: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                arc: jest.fn(),
                lineWidth: 50
            };
            jest.spyOn(context, "translate");
            jest.spyOn(context, "rotate");
            jest.spyOn(context, "beginPath");
            jest.spyOn(context, "rect");
            jest.spyOn(context, "moveTo");
            jest.spyOn(context, "lineTo");
            jest.spyOn(context, "arc");
        });

        it("should draw patterns from known names to the context object", function () {
            drawHatch(context, 100, "zig-line-horizontal");

            expect(context.stroke).toHaveBeenCalledTimes(1);
            expect(context.translate).toHaveBeenCalledTimes(2);
            context.translate(50, 50);
            expect(context.translate).toHaveBeenCalledWith(50, 50);
            context.translate(-50, -50);
            expect(context.translate).toHaveBeenCalledWith(-50, -50);
            expect(context.rotate).toHaveBeenCalledTimes(1);
            expect(context.rotate).toHaveBeenCalledWith(1.5707963267948966);
            expect(context.beginPath).toHaveBeenCalledTimes(1);
            expect(context.rect).toHaveBeenCalledTimes(0);
            expect(context.moveTo).toHaveBeenCalledTimes(1);
            expect(context.moveTo).toHaveBeenCalledWith(0, -25);
            expect(context.lineTo).toHaveBeenCalledTimes(2);
            expect(context.lineTo).toHaveBeenCalledWith(75, 50);
            expect(context.lineTo).toHaveBeenCalledWith(0, 125);
            expect(context.arc).toHaveBeenCalledTimes(0);
        });

        it("should draw patterns from custom definitions to the context object", function () {
            drawHatch(context, 100, {
                "draw": [
                    {
                        "type": "arc",
                        "parameters": [
                            0.5, 0.5, 7.5, -4.14, 1.14
                        ]
                    },
                    {
                        "type": "arc",
                        "parameters": [
                            0.55, 0.5, 7.5, -2, 1.14
                        ]
                    },
                    {
                        "type": "line",
                        "parameters": [
                            [0.66, 0.75],
                            [1, 0.75]
                        ]
                    },
                    {
                        "type": "rect",
                        "parameters": [
                            [0, 0, 1, 1]
                        ]
                    }
                ]
            });

            expect(context.stroke).toHaveBeenCalledTimes(4);
            expect(context.translate).toHaveBeenCalledTimes(0);
            expect(context.rotate).toHaveBeenCalledTimes(0);
            expect(context.beginPath).toHaveBeenCalledTimes(4);
            expect(context.rect).toHaveBeenCalledTimes(1);
            expect(context.rect).toHaveBeenCalledWith(0, 0, 100, 100);
            expect(context.moveTo).toHaveBeenCalledTimes(1);
            expect(context.moveTo).toHaveBeenCalledWith(66, 75);
            expect(context.lineTo).toHaveBeenCalledTimes(1);
            expect(context.lineTo).toHaveBeenCalledWith(100, 75);
            expect(context.arc).toHaveBeenCalledTimes(2);
            expect(context.arc).toHaveBeenCalledWith(50, 50, 7.5, -4.14, 1.14, false);
            expect(context.arc).toHaveBeenCalledWith(55.00000000000001, 50, 7.5, -2, 1.14, false);
        });
    });
});