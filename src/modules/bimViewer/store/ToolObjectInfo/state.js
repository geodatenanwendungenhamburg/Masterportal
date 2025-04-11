/**
 * @typedef {boolean} modeObjectInfoActive If detail mode is activ (true) or not (false)
 * @typedef {array} modeObjectInfoPickedObjects Memkeeper of a picked object for details and to de-highlight later when other object is picked
 */
const state = {
    modeObjectInfoActive: false,
    modeObjectInfoPickedObjects: [],
    pickedObjectId: ""
};

export default state;
