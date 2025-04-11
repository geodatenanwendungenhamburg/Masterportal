<script>
export default {
    name: "ToolCameraReset",
    methods: {
        resetCamera () {
            this.$store.dispatch("Modules/BimViewer/ToolCameraReset/reset");
        }
    }
};
</script>

<template>
    <div class="ToolCameraReset">
        <button
            class="btn btn-primary"
            :title="$t('modules.bimViewer.tools.resetCamera')"
            @click="resetCamera()"
        >
            <i class="bi bi-house" />
        </button>
    </div>
</template>

<style lang="scss">
div.ToolCameraReset {
}
</style>
