<script>
export default {
    name: "ToolSceneFit",
    methods: {
        fitScene () {
            this.$store.dispatch("Modules/BimViewer/ToolSceneFit/fit");
        }
    }
};
</script>

<template>
    <div class="ToolSceneFit">
        <button
            class="btn btn-primary"
            :title="$t('modules.bimViewer.tools.fitScene')"
            @click="fitScene()"
        >
            <i class="bi bi-aspect-ratio" />
        </button>
    </div>
</template>

<style lang="scss">
div.ToolSceneFit {
}
</style>
