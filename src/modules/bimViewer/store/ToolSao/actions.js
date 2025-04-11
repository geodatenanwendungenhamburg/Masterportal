const actions = {
    /**
     * Set and configure SAO (Scalable Ambient Obscurance)
     *
     * Depending on all given or possible keys via config.json or from vue app.
     * The SaoStatus sets currently: null=Not supported/disabled, true=On, false=Off.
     *
     * @param {Object} store  object {commit, rootGetters}
     * @param {Object} payload Passed parameters like from saoSettings: {
     *      enabled, intensity, bias, scale, minResolution, numSamples, kernelRadius, blendCutoff, blendFactor, blur
     * }
     * @returns {void}
     */
    setSaoSettings ({commit, rootGetters}, payload) {
        const ifcViewer = rootGetters["Modules/BimViewer/xeokitIfcViewer"];

        let saoStatus = null;

        if (payload !== undefined && payload !== null && ifcViewer.scene.sao.supported) {
            //  Set settings from config or vue app if given and supported
            if (payload.enabled !== undefined) {
                ifcViewer.scene.sao.enabled = payload.enabled;
                saoStatus = payload.enabled !== false;
            }

            if (payload.intensity !== undefined) {
                ifcViewer.scene.sao.intensity = payload.intensity;
            }

            if (payload.bias !== undefined) {
                ifcViewer.scene.sao.bias = payload.bias;
            }

            if (payload.scale !== undefined) {
                ifcViewer.scene.sao.scale = payload.scale;
            }

            if (payload.minResolution !== undefined) {
                ifcViewer.scene.sao.minResolution = payload.minResolution;
            }

            if (payload.numSamples !== undefined) {
                ifcViewer.scene.sao.numSamples = payload.numSamples;
            }

            if (payload.kernelRadius !== undefined) {
                ifcViewer.scene.sao.kernelRadius = payload.kernelRadius;
            }

            if (payload.blendCutoff !== undefined) {
                ifcViewer.scene.sao.blendCutoff = payload.blendCutoff;
            }

            if (payload.blendFactor !== undefined) {
                ifcViewer.scene.sao.blendFactor = payload.blendFactor;
            }

            if (payload.blur !== undefined) {
                ifcViewer.scene.sao.blur = payload.blur;
            }
        }
        else if (ifcViewer.scene.sao.supported !== true) {
            saoStatus = null;
        }
        else {
            saoStatus = false;
        }

        commit("setSaoStatus", saoStatus);
    }
};

export default actions;
