/**
 * Sets the layers visibility by setting the show attribute at the datasource.
 * @param {boolean} value  if true, the entity will be shown
 * @param {Object} rawLayer  attributes of the layer
 * @param {string} [rawLayer.id] the id of the layer
 * @param {OLCesium} map ol cesium map
 * @returns {void}
 */
export function setVisible (value, rawLayer, map) {
    if (map && typeof map.getDataSources === "function") {
        const dataSources = map.getDataSources(),
            dataSource = dataSources.getByName(rawLayer?.id);

        if (dataSource.length === 0) {
            console.warn("Cannot change visibility of 3D entity for layer with id ", rawLayer.id, ". Datasource is not available.");
        }
        else {
            dataSource[0].show = value;
        }
    }
}

/**
 * Adapts the rawEntity and adds it to the dataSource's entities.
 * The created entity has the attribute 'layerReferenceId' which contains the rawLayer's id.
 * @param {Object} rawEntity to add to the dataSource
 * @param {string} [rawEntity.url] specifying the URI of the glTF asset
 * @param {number} [rawEntity.longitude] longitude of the position
 * @param {number} [rawEntity.latitude] latitude of the position
 * @param {number} [rawEntity.height] height  of the position
 * @param {boolean} [rawEntity.allowPicking] if true, each geometry instance will only be pickable with Scene#pick. When false, GPU memory is saved
 * @param {Array} [rawEntity.attributes] attributes of the glTF asset
 * @param {number} [rawEntity.heading] the rotation about the negative z axis
 * @param {number} [rawEntity.pitch] the rotation about the negative y axis
 * @param {number} [rawEntity.roll] the rotation about the positive x axis
 * @param {boolean} [rawEntity.show] optional- if true, entity is shown. If not available the value of rawLayer.isSelected is used.
 * @param {Cesium.CustomDataSource} dataSource a Cesium.DataSource implementation to manage a group of entities
 * @param {Object} rawLayer layer specification as in services.json
 * @param {string} [rawLayer.id] optional id of the layer, passed to help identification in services.json
 * @param {boolean} [rawLayer.isSelected] if true, entity is shown
 * @returns {Object} the created entity
 */
function addEntity (rawEntity, dataSource, rawLayer) {
    if (typeof rawEntity.url !== "string") {
        console.warn("Url of entity must be a string, but is:", rawEntity.url);
        return null;
    }
    if (![rawEntity.longitude, rawEntity.latitude, rawEntity.height].every(num => typeof num === "number")) {
        console.warn("longitude, latitude and height of entity must be a number.");
        return null;
    }
    const position = Cesium.Cartesian3.fromDegrees(rawEntity.longitude, rawEntity.latitude, rawEntity.height),
        allowPicking = typeof rawEntity.allowPicking === "boolean" ? rawEntity.allowPicking : true,
        attributes = rawEntity.attributes ? rawEntity.attributes : {};
    let headingPitchRoll = "",
        orientation = "",
        modelOptions = "",
        entityOptions = null,
        entity = "",
        heading = 0,
        pitch = 0,
        roll = 0;

    if (typeof rawEntity.heading === "number") {
        heading = rawEntity.heading / 180 * Math.PI;
    }
    if (typeof rawEntity.pitch === "number") {
        pitch = rawEntity.pitch / 180 * Math.PI;
    }
    if (typeof rawEntity.roll === "number") {
        roll = rawEntity.roll / 180 * Math.PI;
    }
    headingPitchRoll = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    orientation = Cesium.Transforms.headingPitchRollQuaternion(position, headingPitchRoll);
    modelOptions = Object.assign(rawEntity.modelOptions || {}, {
        uri: rawEntity.url,
        scale: typeof rawEntity.scale === "number" ? rawEntity.scale : 1,
        show: typeof rawEntity.show === "boolean" ? rawEntity.show : rawLayer.isSelected
    });
    entityOptions = {
        name: rawEntity.url,
        position,
        orientation,
        show: typeof rawEntity.show === "boolean" ? rawEntity.show : rawLayer.isSelected,
        model: modelOptions
    };
    entity = dataSource.entities.add(entityOptions);
    entity.attributes = attributes;
    entity.allowPicking = allowPicking;
    entity.layerReferenceId = rawLayer.id;
    return entity;
}
/**
 * Creates a Cesium.CustomDataSource and adds it to map's dataSources.
 * Iterates over the entities of the raw layer and adds them to dataSource.
 * @param {Object} rawLayer  attributes of the layer
 * @param {string} [rawLayer.id] the id of the layer
 * @param {string} [rawLayer.entities] array of entities to add
 * @param {boolean} [rawLayer.isSelected] if true, the layer is set visible
 * @param {OLCesium} map ol cesium map
 * @returns {void}
 */

/**
 * Iterates over the entities of the raw layer and adds them to dataSource.
 * @param {Object} rawLayer  attributes of the layer
 * @param {string} [rawLayer.id] the id of the layer
 * @param {string} [rawLayer.entities] array of entities to add
 * @param {boolean} [rawLayer.isSelected] if true, the layer is set visible
 * @param {Cesium.CustomDataSource} dataSource a Cesium.DataSource implementation to manage a group of entities
 * @param {OLCesium} map ol cesium map
 * @returns {void}
 */
function addEntities (rawLayer, dataSource, map) {
    if (rawLayer.entities) {
        rawLayer.entities.forEach(entity => {
            // just created dataSource is an object, but if it is got by name it is contained in an array
            addEntity(entity, Array.isArray(dataSource) ? dataSource[0] : dataSource, rawLayer);
        });
    }
    if (rawLayer.isSelected) {
        setVisible(true, rawLayer, map);
    }
}

export function createDataSource (rawLayer, map) {
    if (!rawLayer) {
        console.warn("Cannot add entities to rawLayer which is null!");
    }
    else if (map && typeof map.getDataSources === "function") {
        const dataSources = map.getDataSources();
        let dataSource = dataSources.getByName(rawLayer.id);

        if (dataSource.length === 0) {
            dataSource = new Cesium.CustomDataSource(rawLayer.id);
            dataSources.add(dataSource).then(function (addedDataSource) {
                addEntities(rawLayer, addedDataSource, map);
            });
        }
        else {
            addEntities(rawLayer, dataSource, map);
        }
    }
}


/**
 * Creates an entities layer to use in ol-Cesium map.
 * @param {Object} rawLayer layer specification as in services.json
 * @param {string} [rawLayer.id] optional id of the layer, passed to help identification in services.json
 * @param {string} [rawLayer.name] optional name of the layer, passed to help identification in services.json
 * @param {string} [rawLayer.typ] typ of the layer, passed to help identification in services.json
 * @param {Array} [rawLayer.entities] array of entities to add
 * @param {boolean} [rawLayer.isSelected] if true, entity is shown
 * @param {OLCesium} map ol cesium map
 * @returns {Object} layer
 */
export function createLayer (rawLayer, map) {
    createDataSource(rawLayer, map);
    this.values = {
        name: rawLayer.name,
        id: rawLayer.id,
        typ: rawLayer.typ
    };
    return this;
}

/**
 * Returns the value for the given key of the rawlayer.
 * @param {String} key to get the value for
 * @returns {*} the value to the key
 */
export function get (key) {
    if (!this.values) {
        return undefined;
    }
    return this.values[key];
}
