<script>
import {mapActions} from "vuex";

import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolCameraReset",
    components: {
        IconButton
    },
    methods: {
        ...mapActions("Modules/BimViewer/ToolCameraReset", {
            resetCamera: "reset"
        })
    }
};
</script>

<template>
    <div class="ToolCameraReset">
        <IconButton
            :aria="$t('modules.bimViewer.tools.resetCamera')"
            :title="$t('modules.bimViewer.tools.resetCamera')"
            class="btn-primary"
            icon="bi-house"
            :interaction="() => resetCamera()"
        />
    </div>
</template>

<style lang="scss">
@import "~variables";

div.ToolCameraReset {
    .btn-primary:hover {
        color: $white;
        background-color: $secondary;
    }
}
</style>
