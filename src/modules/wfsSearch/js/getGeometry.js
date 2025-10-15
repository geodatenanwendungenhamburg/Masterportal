/**
* Returns 'geometry' or 'geom' from row. If not available geometry from feature in resultlist is returned.
* @param {Array} results An array of features to be inspected.
* @param {Object} row fields are used to identify feature or geometry is contained and returned.
* @returns {Object} The geometry
*/
export default function getGeometry (results, row) {
    if (row.geometry || row.geom) {
        return row.geometry || row.geom;
    }
    let amount = Object.keys(row).length === 1 ? 1 : Object.keys(row).length - 1,
        consistency = false;

    for (let index = 0; index < results.length; index++) {
        const result = results[index];

        for (const key in row) {
            const value = row[key];

            if (result.get(key) === value) {
                amount--;
                consistency = true;
            }
            if (amount === 0 && consistency) {
                return result.get("geometry") || result.get("geom");
            }
        }
    }
    return null;
}
