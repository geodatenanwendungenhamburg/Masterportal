/**
 * State of module draw.
 * @module modules/draw/store/stateDraw *
 * @property {Object} [circleOptions={innerRadius: 100, interactive: true, outerRadius: 500, unit: "m"}] The circle Options
 * @property {Number} [circleOptions.innerRadius=100] The inner radius for feature of drawType: "circle and doubelCircle".
 * @property {Boolean} [circleOptions.interactive=true] The circle or doubleCircle is drawn interactively or not.
 * @property {Number} [circleOptions.outerRadius=500] The outer radius for feature of drawType: "doubleCircle".
 * @property {String} [circleOptions.unit="m"] The unit for the circle or doubleCircle.
 * @property {Object} [currentLayout={fillColor: [55, 126, 184], fillTransparency: 0, strokeColor: [0, 0, 0], strokeWidth: 1}] The current layout for the styling.
 * @property {Number[]} [currentLayout.fillColor=[55, 126, 184]] The fill color in rgb.
 * @property {Number} [currentLayout.fillTransparency=0] The fill transparency in percent.
 * @property {Number[]} [currentLayout.strokeColor=[0, 0, 0]] The stroke color in rgb.
 * @property {Number} [currentLayout.strokeWidth=1] The stroke width in pixel.
 * @property {String} [currentLayout.text=""] The text content for writeText.
 * @property {String} [currentLayout.font="Arial"] The font for writeText.
 * @property {Number} [currentLayout.fontSize=20] The font size in pixel for writeText.
 * @property {Number} [currentLayout.lineLength=0] The length of a drawn geometry line.
 * @property {String} [currentLayout.squareMethod="interactive"] The method for drawing squares.
 * @property {Number} [currentLayout.squareArea=0] The square area for square drawing.
 * @property {String} [currentLayout.squareUnit="m"] The unit for the square area.
 * @property {Object} [currentLayoutOuterCircle= fillColor: [55, 126, 184], fillTransparency: 0, strokeColor: [0, 0, 0], strokeWidth: 1}] The current layout for styling the outer circle. Only used for double circle.
 * @property {Number[]} [currentLayoutOuterCircle.fillColor=[55, 126, 184]] The fill color in rgb.
 * @property {Number} [currentLayoutOuterCircle.fillTransparency=0] The fill transparency in percent.
 * @property {Number[]} [currentLayoutOuterCircle.strokeColor=[0, 0, 0]] The stroke color in rgb.
 * @property {Number} currentLayoutOuterCircle.strokeWidth The stroke width in pixel.
 * @property {String} [description="common:modules.draw.description"] The description that should be shown in the button in the menu.
 * @property {String[]} [drawEdits=["deleteAll", "delete", "modify", "editAttributes", "undo", "redo", "hide", "download"]] The draw edit toolbar controls.
 * @property {Boolean} [enableAttributesSelector=false] Controls only the "editAttributes" toolbar entry. If false, only this single control is hidden.
 * @property {Object} [drawIcons={box: "bi-square", circle: "bi-circle", delete: "bi-eraser-fill", deleteAll: "bi-trash",doubleCircle: "bi-record-circle", geometries: "bi-hexagon-fill", line: "bi-slash-lg", modify: "bi-tools", pen: "bi-pencil-fill", point: "bi-circle-fill", polygon: "bi-octagon", redo: "bi-arrow-right", symbols: "bi-circle-square", undo: "bi-arrow-left", }] The icons for draw buttons.
 * @property {String} [drawIcons.box="bi-square"] The icon for box button.
 * @property {String} [drawIcons.circle="bi-circle"] The icon for circle button.
 * @property {String} [drawIcons.doubleCircle="bi-record-circle"] The icon for doubleCircle button.
 * @property {String} [drawIcons.geometries="bi-hexagon-fill"] The icon for geometries button.
 * @property {String} [drawIcons.line="bi-slash-lg"] The icon for line button.
 * @property {String} [drawIcons.pen="bi-pencil-fill"] The icon for pen button.
 * @property {String} [drawIcons.point="bi-circle-fill"] The icon for point button.
 * @property {String} [drawIcons.polygon="bi-octagon"] The icon for polygon button.
 * @property {String} [drawIcons.symbols="bi-circle-square"] The icon for symbols button.
 * @property {String[]} [drawTypesGeometrie=["line", "box", "polygon", "circle", "doubleCircle", "square"]] The drawing types in geometries.
 * @property {String[]} [drawTypesMain=["pen", "writeText", "geometries", "symbols"]] The top level (main) drawing types.
 * @property {String[]} [drawTypesSymbols=[]] The drawing types in symbols.
 * @property {Object|null} [drawSymbolSettings=null] Config parameter for point symbols.
 * @property {Number[]} [drawSymbolSettings.color=[55, 126, 184, 1]] Symbol color in RGBA.
 * @property {Object|null} [drawLineSettings=null] Config parameter for line styling.
 * @property {Object|null} [drawCurveSettings=null] Config parameter for freehand line styling.
 * @property {Object|null} [drawAreaSettings=null] Config parameter for polygon and box styling.
 * @property {Object|null} [drawCircleSettings=null] Config parameter for circle styling.
 * @property {Object|null} [drawDoubleCircleSettings=null] Config parameter for double circle styling.
 * @property {Object|null} [drawSquareSettings=null] Config parameter for square styling.
 * @property {Object|null} [writeTextSettings=null] Config parameter for text styling.
 * @property {Object|null} [download=null] Config parameter for download, e.g. {preSelectedFormat: "KML"}.
 * @property {Boolean} [semicolonCsvDelimiter=true] If true, CSV export uses semicolon as delimiter instead of comma.
 * @property {Boolean} [hasMouseMapInteractions=true] If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String} [icon="bi-pencil"] Icon next to title (config-param).
 * @property {Number} idCounter Counter for features drawn.
 * @property {String} [name="common:modules.draw.name"] Displayed as title (config-param).
 * @property {String} [selectedDrawType=""] The selected draw type.
 * @property {String} [selectedDrawTypeMain=""] The selected draw type main.
 * @property {String} [selectedInteraction="draw"] The selected interaction.
 * @property {Number[]} [strokeRange=[1, 16]] The stroke range in the unit pixel.
 * @property {String[]} [supportedDevices=["Desktop", "Mobile", "Table"]] Devices on which the module is displayed.
 * @property {String[]} [supportedMapModes=["2D", "3D"]] Map mode in which this module can be used.
 * @property {String} type="draw" The type of the module.
 * @property {String[]} units=["m", "km"] The possible units for the circle or doubleCircle.
 * @property {Boolean} [buttonsDisabled=false] If true, the draw buttons are disabled.
 */
const state = {
    circleOptions: {
        innerRadius: 100,
        interactive: true,
        outerRadius: 500,
        unit: "m"
    },
    currentLayout: {
        fillColor: [55, 126, 184],
        fillTransparency: 1,
        strokeColor: [0, 0, 0],
        strokeWidth: 1,
        text: "",
        font: "Arial",
        fontSize: 20,
        lineLength: 0,
        squareMethod: "interactive",
        squareArea: 0,
        squareUnit: "m"
    },
    currentLayoutOuterCircle: {
        fillColor: [55, 126, 184],
        fillTransparency: 0,
        strokeColor: [0, 0, 0],
        strokeWidth: 1
    },
    selectedSymbol: null,
    description: "common:modules.draw.description",
    drawEdits: ["deleteAll", "delete", "modify", "editAttributes", "undo", "redo", "hide", "download"],
    enableAttributesSelector: false,
    drawIcons: {
        box: "bi-square",
        circle: "bi-circle",
        delete: "bi-eraser-fill",
        deleteAll: "bi-trash",
        doubleCircle: "bi-record-circle",
        geometries: "bi-hexagon-fill",
        line: "bi-slash-lg",
        modify: "bi-tools",
        pen: "bi-pencil-fill",
        point: "bi-circle-fill",
        polygon: "bi-octagon",
        redo: "bi-arrow-right",
        symbols: "bi-circle-square",
        undo: "bi-arrow-left",
        editAttributes: "bi-window-split",
        hide: "bi-eye",
        show: "bi-eye-slash",
        download: "bi-cloud-download",
        writeText: "bi-input-cursor-text",
        square: "bi-square-fill"
    },
    drawTypesGeometrie: ["line", "box", "polygon", "circle", "doubleCircle", "square"],
    drawTypesMain: ["pen", "writeText", "geometries", "symbols"],
    drawTypesSymbols: [],
    drawSymbolSettings: null,
    drawLineSettings: null,
    drawCurveSettings: null,
    drawAreaSettings: null,
    drawCircleSettings: null,
    drawDoubleCircleSettings: null,
    drawSquareSettings: null,
    writeTextSettings: null,
    download: null,
    semicolonCsvDelimiter: true,
    hasMouseMapInteractions: true,
    icon: "bi-pencil",
    idCounter: 0,
    name: "common:modules.draw.name",
    selectedDrawType: "pen",
    selectedDrawTypeMain: "pen",
    selectedInteraction: "draw",
    strokeRange: [1, 16],
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    iconList: [
        {
            "id": "iconPoint",
            "type": "simple_point",
            "value": "simple_point"
        }
    ],
    type: "draw",
    units: ["m", "km"],
    buttonsDisabled: false
};

export default state;
