const defaultColors = {
        background: [255, 255, 255, 0],
        fill: [10, 200, 100, 0.5],
        stroke: [0, 0, 0, 1],
        textFill: [255, 255, 255, 1],
        textStroke: [0, 0, 0, 0]
    },
    defaultStyle = {
        point: {
            feature: null,
            isClustered: false,
            type: "circle",
            imagePath: "",
            // für type icon
            imageName: "blank.png",
            imageWidth: 1,
            imageHeight: 1,
            imageScale: 1,
            imageOffsetX: 0.5,
            imageOffsetY: 0.5,
            imageOffsetXUnit: "fraction",
            imageOffsetYUnit: "fraction",
            // for type circle
            circleRadius: 10,
            circleFillColor: defaultColors.fill,
            circleStrokeColor: defaultColors.stroke,
            circleStrokeWidth: 2,
            clusterType: "circle",
            // for type circle
            clusterCircleRadius: 15,
            clusterCircleFillColor: defaultColors.fill,
            clusterCircleStrokeColor: defaultColors.stroke,
            clusterCircleStrokeWidth: 2,
            // for type icon
            clusterImageName: "blank.png",
            clusterImageWidth: 1,
            clusterImageHeight: 1,
            clusterImageScale: 1,
            clusterImageOffsetX: 0.5,
            clusterImageOffsetY: 0.5,
            // Für scalingShape CIRCLESEGMENTS
            circleSegmentsRadius: 10,
            circleSegmentsStrokeWidth: 4,
            circleSegmentsBackgroundColor: defaultColors.background,
            scalingValueDefaultColor: defaultColors.stroke,
            circleSegmentsGap: 10,
            // Für scalingShape CIRCLE_BAR
            circleBarScalingFactor: 1,
            circleBarRadius: 6,
            circleBarLineStroke: 5,
            circleBarCircleFillColor: defaultColors.fill,
            circleBarCircleStrokeColor: defaultColors.stroke,
            circleBarCircleStrokeWidth: 1,
            circleBarLineStrokeColor: defaultColors.stroke,
            scalingAttribute: "",
            rotation: 0,
            // for type regularShape
            rsRadius: 10,
            rsRadius2: undefined,
            rsPoints: 3,
            rsFillColor: [0, 153, 255, 1],
            rsStrokeColor: [0, 0, 0, 1],
            rsStrokeWidth: 5,
            rsAngle: 0,
            rsScale: undefined
        },
        line: {
            lineStrokeColor: defaultColors.stroke,
            lineStrokeWidth: 5,
            lineStrokeCap: "round",
            lineStrokeJoin: "round",
            lineStrokeDash: undefined,
            lineStrokeDashOffset: 0,
            lineStrokeMiterLimit: 10
        },
        polygon: {
            // for stroke
            polygonStrokeColor: defaultColors.stroke,
            polygonStrokeWidth: 1,
            polygonStrokeCap: "round",
            polygonStrokeJoin: "round",
            polygonStrokeDash: undefined,
            polygonStrokeDashOffset: 0,
            polygonStrokeMiterLimit: 10,
            // for fill
            polygonFillColor: defaultColors.fill,
            polygonFillHatch: undefined
        },
        text: {
            textAlign: "center",
            textFont: "Comic Sans MS",
            textScale: 2,
            textOffsetX: 10,
            textOffsetY: -8,
            textFillColor: defaultColors.textFill,
            textStrokeColor: defaultColors.textStroke,
            textStrokeWidth: 3,
            labelField: "",
            textSuffix: "",
            rotation: 0,
            clusterTextType: "counter",
            clusterText: "",
            clusterTextAlign: "center",
            clusterTextFont: "Comic Sans MS",
            clusterTextScale: 2,
            clusterTextOffsetX: 0,
            clusterTextOffsetY: 2,
            clusterTextFillColor: defaultColors.textFill,
            clusterTextStrokeColor: defaultColors.textStroke,
            clusterTextStrokeWidth: 0
        },
        defaultMapMarkerPoint: {
            styleId: "defaultMapMarkerPoint",
            rules: [{
                style:
                {
                    type: "icon",
                    imageName: `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='#E10019' class='bi bi-geo-alt-fill' viewBox='0 0 16 16'>
                    <path d='M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z'/>
                    </svg>`,
                    imagePath: "",
                    imageScale: 2,
                    imageOffsetY: 16,
                    imageOffsetYUnit: "pixels"
                }
            }]
        },
        defaultMapMarkerPolygon: {
            styleId: "defaultMapMarkerPolygon",
            rules: [{
                style:
                {
                    polygonStrokeColor: [8, 119, 95, 1],
                    polygonStrokeWidth: 4,
                    polygonFillColor: [8, 119, 95, 0.3],
                    polygonStrokeDash: [8]
                }
            }]
        },
        defaultHighlightFeaturesPoint: {
            styleId: "defaultHighlightFeaturesPoint",
            rules: [{
                style:
                {
                    type: "circle",
                    circleFillColor: [255, 255, 0, 0.9],
                    circleRadius: 8
                }
            }]
        },
        defaultHighlightFeaturesPolygon: {
            styleId: "defaultHighlightFeaturesPolygon",
            rules: [{
                style:
                {
                    polygonStrokeColor: [8, 119, 95, 1],
                    polygonStrokeWidth: 4,
                    polygonFillColor: [8, 119, 95, 0.3],
                    polygonStrokeDash: [8]
                }
            }]
        },
        defaultHighlightFeaturesLine: {
            styleId: "defaultHighlightFeaturesLine",
            rules: [{
                style:
            {
                polygonStrokeColor: [8, 119, 95, 1],
                polygonStrokeWidth: 4,
                polygonFillColor: [8, 119, 95, 0.3],
                polygonStrokeDash: [8]
            }
            }]
        }
    };

export default defaultStyle;
