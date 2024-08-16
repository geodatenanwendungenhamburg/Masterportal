<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getGfiFeatures from "../../../../api/gfi/getGfiFeaturesByTileFeature";
import getters from "../store/gettersModeler3D";
import actions from "../store/actionsModeler3D";
import mutations from "../store/mutationsModeler3D";

export default {
    name: "Modeler3DFilter",
    data () {
        return {
            selectedAttribute: null,
            attributes: ["Height", "Area", "Volume"], // Beispiele
            minValue: 0,
            maxValue: 100,
            selectedColor: "#ff0000",
            transparency: 50
        };
    },
    computed: {
        ...mapGetters("Tools/Modeler3D", Object.keys(getters))
    },
    mounted () {
        this.logVisibleTiles();
    },
    methods: {
        ...mapActions("Tools/Modeler3D", Object.keys(actions)),
        ...mapMutations("Tools/Modeler3D", Object.keys(mutations)),
        applyFilter () {
            // Platzhalter
        },
        applyStyle () {
            // Platzhalter
        },
        logVisibleTiles () {
            const scene = mapCollection.getMap("3D").getCesiumScene(),
                camera = scene.camera,
                cullingVolume = camera.frustum.computeCullingVolume(camera.position, camera.direction, camera.up),
                primitives = scene.primitives;

            for (let i = 0; i < primitives.length; i++) {
                const primitive = primitives.get(i);

                if (primitive instanceof Cesium.Cesium3DTileset) {
                    const tileset = primitive;

                    tileset.root.children.forEach((tile) => {
                        if (tile.contentReady && cullingVolume.computeVisibility(tile.boundingVolume.boundingVolume) === Cesium.Intersect.INSIDE) {
                            const content = tile.content;

                            for (let j = 0; j < content.featuresLength; j++) {
                                const feature = content.getFeature(j),
                                    gfiFeature = getGfiFeatures.getGfiFeaturesByTileFeature(feature)[0];

                                gmlId = gfiFeature.getProperties().gmlid;

                                console.log(gfiFeature.getProperties());

                                if (gmlId) {
                                    console.log(`Visible feature with gmlId: ${gmlId}`, feature);

                                    const featureGmlId = `'${gmlId}'`;

                                    tileset.style = new Cesium.Cesium3DTileStyle({
                                        show: `Boolean(${featureGmlId})`,
                                        color: {
                                            conditions: [
                                                [`${featureGmlId} !== undefined`, "color('cyan')"],
                                                ["true", "color('white')"]
                                            ]
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
            }
        }

    }
};
</script>

<template>
    <div id="modeler3d-filter">
        <h2>{{ $t('modules.tools.modeler3D.filterTitle') }}</h2>

        <!-- Filter Options -->
        <div class="filter-options">
            <h3>{{ $t('modules.tools.modeler3D.filterOptionsTitle') }}</h3>
            <div class="filter-group">
                <label for="attributeSelect">{{ $t('modules.tools.modeler3D.selectAttribute') }}</label>
                <select
                    id="attributeSelect"
                    v-model="selectedAttribute"
                >
                    <option
                        v-for="attribute in attributes"
                        :key="attribute"
                        :value="attribute"
                    >
                        {{ attribute }}
                    </option>
                </select>
            </div>

            <div class="filter-group">
                <label for="minValue">{{ $t('modules.tools.modeler3D.minValue') }}</label>
                <input
                    id="minValue"
                    v-model="minValue"
                    type="number"
                >
            </div>

            <div class="filter-group">
                <label for="maxValue">{{ $t('modules.tools.modeler3D.maxValue') }}</label>
                <input
                    id="maxValue"
                    v-model="maxValue"
                    type="number"
                >
            </div>

            <button @click="applyFilter">
                {{ $t('modules.tools.modeler3D.applyFilter') }}
            </button>
        </div>

        <div class="style-options">
            <h3>{{ $t('modules.tools.modeler3D.styleOptionsTitle') }}</h3>

            <div class="style-group">
                <label for="colorPicker">{{ $t('modules.tools.modeler3D.selectColor') }}</label>
                <input
                    id="colorPicker"
                    v-model="selectedColor"
                    type="color"
                >
            </div>

            <div class="style-group">
                <label for="transparency">{{ $t('modules.tools.modeler3D.transparency') }}</label>
                <input
                    id="transparency"
                    v-model="transparency"
                    type="range"
                    min="0"
                    max="100"
                >
            </div>

            <button @click="applyStyle">
                {{ $t('modules.tools.modeler3D.applyStyle') }}
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~/css/mixins.scss";
@import "~variables";
</style>
