<script>
import {mapActions} from "vuex";

import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolSceneReset",
    components: {
        IconButton
    },
    methods: {
        ...mapActions("Modules/BimViewer/ToolSceneReset", [
            "resetScene"
        ])
    }
};
</script>

<template>
    <div class="ToolSceneReset">
        <IconButton
            :aria="$t('modules.bimViewer.tools.resetScene')"
            :title="$t('modules.bimViewer.tools.resetScene')"
            class="btn-primary"
            icon="bi-house"
            :interaction="() => resetScene()"
        />
    </div>
</template>

<style lang="scss">
@import "~variables";

div.ToolSceneReset {
    .btn-primary:hover {
        color: $white;
        background-color: $secondary;
    }
}
</style>
