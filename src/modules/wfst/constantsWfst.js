export const defaultInteractionConfig = {
        LineString: {
            available: false,
            icon: "bi-slash-lg",
            multi: false,
            text: "common:modules.wfst.interactionSelect.line"
        },
        Point: {
            available: false,
            icon: "bi-record-circle",
            multi: false,
            text: "common:modules.wfst.interactionSelect.point"
        },
        Polygon: {
            available: false,
            icon: "bi-hexagon-fill",
            multi: false,
            text: "common:modules.wfst.interactionSelect.polygon"
        },
        MultiPolygon: {
            available: false,
            icon: "bi-hexagon-fill",
            multi: false,
            text: "common:modules.wfst.interactionSelect.multiPolygon"
        },
        update: {
            available: false,
            icon: "bi-pencil-square",
            text: "common:modules.wfst.interactionSelect.update"
        },
        multiUpdate: {
            available: false,
            icon: "bi-pencil-square",
            text: "common:modules.wfst.interactionSelect.multiUpdate"
        },
        delete: {
            available: false,
            icon: "bi-trash",
            text: "common:modules.wfst.interactionSelect.delete"
        }
    },
    exceptionCodes = [
        "InvalidParameterValue",
        "InvalidValue",
        "MissingParameterValue",
        "OperationNotSupported",
        "OperationParsingFailed",
        "OperationProcessingFailed"
    ];
