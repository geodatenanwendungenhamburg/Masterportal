
const speedProfileOptions = [
        "CAR", "HGV", "CYCLING", "FOOT", "WHEELCHAIR"
    ],
    avoidSpeedProfileOptions = [
        {id: "HIGHWAYS", availableProfiles: ["CAR", "HGV"]},
        {id: "TOLLWAYS", availableProfiles: ["CAR", "HGV"]},
        {id: "FERRIES", availableProfiles: ["CAR", "HGV", "CYCLING", "FOOT", "WHEELCHAIR"]},
        {id: "STEPS", availableProfiles: ["CYCLING", "FOOT", "WHEELCHAIR"]},
        {id: "BORDERS", availableProfiles: ["CAR", "HGV"]}
    ],
    downloadFormatOptions = [
        "KML", "GEOJSON", "GPX"
    ],
    downloadFormatOptionsTSR = [
        "GEOJSON", "KML", "GPX", "CSV"
    ],
    nonOptionalConfigFields = [
        "geosearch.type",
        "geosearch.serviceId",
        "geosearchReverse.type",
        "geosearchReverse.serviceId",
        "directionsSettings.type",
        "directionsSettings.serviceId",
        "isochronesSettings.type",
        "isochronesSettings.serviceId"
    ];

export {speedProfileOptions, avoidSpeedProfileOptions, downloadFormatOptions, downloadFormatOptionsTSR, nonOptionalConfigFields};
