/**
 * Sorts objects by the passed nested attribute.
 * @param {Object[]} objects The objects to be sorted.
 * @param {String} nestedAttribute The nested attribute.
 * @param {String} [order="asc"] The order: asc (ascending) or desc (descending).
 * @returns {void}
 */
export function sortObjects (objects, nestedAttribute, order = "asc") {
    objects.sort((a, b) => {
        let firstElement,
            secondElement;

        if (order === "asc") {
            firstElement = getNestedElement(a, nestedAttribute);
            secondElement = getNestedElement(b, nestedAttribute);
        }
        else if (order === "desc") {
            firstElement = getNestedElement(b, nestedAttribute);
            secondElement = getNestedElement(a, nestedAttribute);
        }

        if (firstElement < secondElement) {
            return -1;
        }
        else if (firstElement > secondElement) {
            return 1;
        }
        return 0;
    });
}


/**
 * Searches the object for a nested attribute and returns it as number or string.
 * @param {Object} searchElement The object that is to be searched.
 * @param {String} nestedAttribute The nested attribute.
 * @returns {Number|String} The element as number or string.
 */
export function getNestedElement (searchElement, nestedAttribute) {
    const path = nestedAttribute.split("."),
        nestedElement = path.reduce((object, field) => {
            if (object) {
                return object[field];
            }
            return "";

        }, searchElement);

    return isNaN(parseInt(nestedElement, 10)) ? nestedElement : parseInt(nestedElement, 10);
}

/**
 * Sorts an array of objects by their `layerSequence` property in ascending order.
 * Objects without a `layerSequence` property are moved to the end of the array.
 * Baselayer objects are always moved to the end of the array.
 *
 * @param {Array<Object>} objects - The array of objects to sort.
 *                                  Each object can optionally contain a `layerSequence` property.
 * @return {void} This function modifies the input array in place and does not return a value.
 */
export function sortByLayerSequence (objects) {
    let objectLength = objects.length;

    objects.sort((a, b) => {
        if (a.baselayer && !b.baselayer) {
            return 1;
        }
        if (!a.baselayer && b.baselayer) {
            return -1;
        }
        if (!("layerSequence" in a)) {
            return 1;
        }
        if (!("layerSequence" in b)) {
            return -1;
        }

        if (a.layerSequence !== b.layerSequence) {
            return a.layerSequence - b.layerSequence;
        }

        return b.zIndex - a.zIndex;
    });
    objects.forEach((object) => {
        object.zIndex = --objectLength;
    });
}
export default {sortObjects, getNestedElement};
