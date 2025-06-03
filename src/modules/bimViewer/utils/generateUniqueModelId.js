/**
 * Generates a unique model ID by appending an incrementing number if the base ID is already taken.
 * For example, if "my-id" and "my-id (2)" are taken, returns "my-id (3)".
 * @param {string} id - The base ID to make unique.
 * @param {string[]} takenIds - Array of IDs that are already taken.
 * @returns {string} A unique ID based on the given base ID.
 */
export default function generateUniqueModelId (id, takenIds) {
    const takenIdsSet = new Set(takenIds);

    if (!takenIdsSet.has(id)) {
        return id;
    }

    let
        counter = 2,
        generatedId = `${id} (${counter})`;

    while (takenIdsSet.has(generatedId)) {
        counter++;

        generatedId = `${id} (${counter})`;
    }

    return generatedId;
}
