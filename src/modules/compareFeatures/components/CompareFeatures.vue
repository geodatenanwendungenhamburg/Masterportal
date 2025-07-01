<script>
import TableComponent from "@shared/modules/table/components/TableComponent.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";

export default {
    name: "CompareFeatures",
    components: {
        TableComponent
    },
    data () {
        const iconEmptyStar = "<span class=\"bootstrap-icon\" style=\"font-size:22px;\"><i class=\"bi-star\"></i></span>",
            iconYellowStar = "<span class=\"bootstrap-icon\" style=\"color:#fec44f; font-size:22px;\"><i class=\"bi-star-fill\"></i></span>";

        return {
            iconEmptyStar,
            iconYellowStar,
            sortable: true
        };
    },
    computed: {
        ...mapGetters("Modules/CompareFeatures", ["hasFeatures", "hasMultipleLayers", "selectedLayerId", "preparedListDisplayTable", "selectableLayers", "numberOfAttributesToShow"]),
        selected: {
            get () {
                return this.$store.state.Modules.CompareFeatures.selectedLayerId;
            },
            set (newValue) {
                this.selectLayerWithFeatures(newValue);
            }
        },
        tableId () {
            return this.hasMultipleLayers ? "module-compareFeatures-comparisonListMultipleLayers" : "module-compareFeatures-comparisonListSingleLayer";
        },
        tableData () {
            return this.hasMultipleLayers ? this.preparedListDisplayTable[this.selectedLayerId] : this.preparedListDisplayTable[Object.keys(this.preparedListDisplayTable)[0]];
        }
    },
    methods: {
        ...mapActions("Modules/CompareFeatures", ["removeFeature"]),
        ...mapMutations("Modules/CompareFeatures", ["selectLayerWithFeatures"]),

        removeItem (idFeature, idLayer) {
            this.removeFeature({idFeature, idLayer});
        }
    }
};
</script>

<template>
    <div
        id="compare-features"
    >
        <div
            v-if="hasMultipleLayers"
            id="module-compareFeatures-select-container"
        >
            <hr>
            <div class="form-floating mb-3">
                <select
                    id="module-compareFeatures-select"
                    v-model="selected"
                    class="form-select"
                >
                    <option
                        v-for="(layer, i) in selectableLayers"
                        :key="i"
                        :value="layer.layerId"
                    >
                        {{ layer.layerName }}
                    </option>
                </select>
                <label
                    for="module-compareFeatures-select"
                >
                    {{ $t("common:modules.compareFeatures.topicsSelection") }}
                </label>
            </div>
        </div>
        <div
            v-if="!hasFeatures"
            id="module-compareFeatures-no-features"
        >
            <hr>
            <p class="bold">
                {{ $t("common:modules.compareFeatures.noFeatures.nothingSelected", {objects:
                    $t("common:modules.compareFeatures.noFeatures.objectName")}) }}
            </p>
            <br>
            <p
                v-html="$t('common:modules.compareFeatures.noFeatures.info', {iconEmptyStar, iconYellowStar, interpolation: {escapeValue: false}})"
            />
            <p
                v-html="$t('common:modules.compareFeatures.noFeatures.info2')"
            />
        </div>
        <TableComponent
            v-if="hasFeatures"
            :id="tableId"
            :data="tableData"
            :sortable="true"
            :filterable="true"
            :downloadable="true"
            :removable="true"
            :enable-settings="true"
            :max-attributes-to-show="numberOfAttributesToShow"
            @removeItem="removeItem"
        />
    </div>
</template>

<style lang="scss" scoped>


#module-compareFeatures-no-features {
    padding: 15px;
    padding-top: 0;

    p {
        line-height: 22px;

        &:first-child {
            font-size: $font_size_big;
        }
    }
}
</style>
