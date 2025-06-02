<script>
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

import {mapActions} from "vuex";

export default {
    name: "ToolSceneFit",
    components: {
        IconButton
    },
    methods: {
        ...mapActions("Modules/BimViewer/ToolSceneFit", {
            fitScene: "fit"
        })
    }
};
</script>

<template>
    <div class="ToolSceneFit">
        <IconButton
            :aria="$t('modules.bimViewer.tools.fitScene')"
            :title="$t('modules.bimViewer.tools.fitScene')"
            class="btn-primary"
            icon="bi-aspect-ratio"
            :interaction="() => fitScene()"
        />
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.ToolSceneFit {
        .btn-primary:hover {
            color: $white;
            background-color: $secondary;
        }
    }
}
</style>
