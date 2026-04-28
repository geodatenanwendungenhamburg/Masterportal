import {mapGetters} from "vuex";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import layerCollection from "@core/layers/js/layerCollection.js";

/**
 * Mixin to provide scaleIsOutOfRange behaviour.
 * @param {String} containerName the name of the itm, that holds the layerId
 */
export default (containerName) => ({
    computed: {
        ...mapGetters("Maps", ["scale", "scales", "mode"]),
        ...mapGetters(["layerConfigById"]),

        /**
         * @returns {object[]} raw layers of this item; if this item is a group layer with maxScale or minScale, only the group layer is returned.
         */
        rawLayers () {
            if (this[containerName].typ === "GROUP" && (this[containerName].minScale || this[containerName].maxScale)) {
                return [this[containerName]];
            }

            const ids = (this[containerName].id ?? "").split("-");

            return ids
                .map((id) => rawLayerList.getLayerWhere({id}) ?? null)
                .filter((rawLayer) => Boolean(rawLayer));

        },

        /**
         * @returns {[number, number]} [minScale, maxScale] across all layers
         */
        rawLayersScaleBoundaries () {
            return this.rawLayers.reduce(
                ([accumulatorMinScale, accumulatorMaxScale], current) => {
                    const conf = this.layerConfigById(current.id),
                        minScale = conf ? conf.minScale : current.minScale,
                        maxScale = conf ? conf.maxScale : current.maxScale,
                        currentMinScale = parseInt(minScale, 10),
                        currentMaxScale = parseInt(maxScale, 10);

                    return [
                        isNaN(currentMinScale)
                            ? accumulatorMinScale
                            : Math.min(currentMinScale, accumulatorMinScale ?? Number.POSITIVE_INFINITY),
                        isNaN(currentMaxScale)
                            ? accumulatorMaxScale
                            : Math.max(currentMaxScale, accumulatorMaxScale ?? Number.NEGATIVE_INFINITY)
                    ];
                },
                [undefined, undefined]
            );
        },

        /**
         * Tooltip text explaining why a layer is disabled due to scale restrictions.
         * Returns a formatted scale range explanation.
         * If no scale limits exist, an empty string is returned.
         *
         * @returns {String} The tooltip text for layers out of visible scale range.
         */
        tooltipText () {
            const [fallbackMinScale, fallbackMaxScale] = this.rawLayersScaleBoundaries || [],
                container = this[containerName],
                minScaleRaw = container?.minScale !== undefined
                    ? parseInt(container.minScale, 10)
                    : fallbackMinScale ?? null,

                maxScale = container?.maxScale !== undefined
                    ? parseInt(container.maxScale, 10)
                    : fallbackMaxScale ?? null,


                minScale = minScaleRaw === 0
                    ? this.scales[this.scales.length - 1]
                    : minScaleRaw;

            if (minScale && maxScale) {
                return this.$t("common:modules.layerTree.invisibleLayer", {
                    minScale: "1: " + thousandsSeparator(minScale),
                    maxScale: "1: " + thousandsSeparator(maxScale)
                });
            }

            if (minScale) {
                return this.$t("common:modules.layerTree.invisibleLayerMinScale", {
                    minScale: "1: " + thousandsSeparator(minScale)
                });
            }

            if (maxScale) {
                return this.$t("common:modules.layerTree.invisibleLayerMaxScale", {
                    maxScale: "1: " + thousandsSeparator(maxScale)
                });
            }

            return "";
        },

        /**
         * Returns true, if this layer is not visible in the maps current scale.
         * In mode 3D the layer is set visible/invisible depending on scale restrictions.
         * @returns {Boolean}  true, if this layer is not visible in the maps current scale
         */
        scaleIsOutOfRange () {
            const rawLayer = this.rawLayers.length > 0 ? this.rawLayers[0] : null,
                container = this[containerName],
                minScale = container?.minScale ?? rawLayer?.minScale,
                maxScale = container?.maxScale ?? rawLayer?.maxScale;

            if (maxScale === undefined) {
                return false;
            }

            const isOutOfRange =
                    this.scale > parseInt(maxScale, 10) ||
                    this.scale < parseInt(minScale, 10),
                layerId = rawLayer?.id ?? null,
                conf = this.layerConfigById(layerId);

            if (this.mode === "3D" && conf?.visibility !== false) {
                const layerEntry = layerCollection.getLayerById(layerId);

                if (layerEntry?.attributes?.is3DLayer) {
                    layerEntry.layer.setVisible(!isOutOfRange, mapCollection.getMap("3D"), layerEntry.attributes);
                }
                else if (layerEntry?.attributes) {
                    layerEntry.layer.setVisible(!isOutOfRange);
                }
            }
            return isOutOfRange;
        }
    }
});
