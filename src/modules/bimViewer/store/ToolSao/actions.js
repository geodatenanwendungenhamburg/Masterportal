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
        const xeokitViewer = rootGetters["Modules/BimViewer/xeokitViewer"];

        let saoStatus = null;

        if (payload !== undefined && payload !== null && xeokitViewer.scene.sao.supported) {
            //  Set settings from config or vue app if given and supported
            if (payload.enabled !== undefined) {
                xeokitViewer.scene.sao.enabled = payload.enabled;
                saoStatus = payload.enabled !== false;
            }

            if (payload.intensity !== undefined) {
                xeokitViewer.scene.sao.intensity = payload.intensity;
            }

            if (payload.bias !== undefined) {
                xeokitViewer.scene.sao.bias = payload.bias;
            }

            if (payload.scale !== undefined) {
                xeokitViewer.scene.sao.scale = payload.scale;
            }

            if (payload.minResolution !== undefined) {
                xeokitViewer.scene.sao.minResolution = payload.minResolution;
            }

            if (payload.numSamples !== undefined) {
                xeokitViewer.scene.sao.numSamples = payload.numSamples;
            }

            if (payload.kernelRadius !== undefined) {
                xeokitViewer.scene.sao.kernelRadius = payload.kernelRadius;
            }

            if (payload.blendCutoff !== undefined) {
                xeokitViewer.scene.sao.blendCutoff = payload.blendCutoff;
            }

            if (payload.blendFactor !== undefined) {
                xeokitViewer.scene.sao.blendFactor = payload.blendFactor;
            }

            if (payload.blur !== undefined) {
                xeokitViewer.scene.sao.blur = payload.blur;
            }
        }
        else if (xeokitViewer.scene.sao.supported !== true) {
            saoStatus = null;
        }
        else {
            saoStatus = false;
        }

        commit("setSaoStatus", saoStatus);
    }
};

export default actions;
