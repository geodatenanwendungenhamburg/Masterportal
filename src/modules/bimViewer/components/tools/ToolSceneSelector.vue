<script>
import {mapGetters} from "vuex";

export default {
    name: "ToolSceneSelector",
    data () {
        return {
            selectedSceneIndex: 0
        };
    },
    computed: {
        ...mapGetters("Modules/BimViewer", {
            allSceneConfigs: "sceneConfigs"
        }),
        selectIsVisible () {
            // Select is only visible if more than one scene is configured.
            return this.allSceneConfigs.length > 1;
        }
    },
    methods: {
        changeScene (event) {
            const index = event.target.value;

            this.selectedSceneIndex = index;

            this.$emit("sceneSelected", index);

            this.$parent.$refs.toolFilter.filterReset();
        }
    }
};
</script>

<template>
    <select
        v-if="selectIsVisible"
        id="sceneSelect"
        v-model="selectedSceneIndex"
        class="ToolSceneSelector form-select w-auto"
        :aria-label="$t('modules.bimViewer.tools.scene')"
        @change="changeScene"
    >
        <option
            v-for="(sceneConfig, index) in allSceneConfigs"
            :key="`sceneConfig_${sceneConfig.id}`"
            :value="index"
        >
            {{ sceneConfig.name }}
        </option>
    </select>
</template>

<style lang="scss">
select.ToolSceneSelector {
    &:focus {
        box-shadow: none;
        outline: none;
    }
}
</style>
