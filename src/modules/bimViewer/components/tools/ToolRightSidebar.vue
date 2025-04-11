<script>
export default {
    name: "ToolRightSidebar",
    computed: {
        toggleRightSidebar: {
            get () {
                return this.$store.getters["Modules/BimViewer/toggleRightSidebar"];
            },
            set (value) {
                this.$store.commit("Modules/BimViewer/setToggleRightSidebar", value);
            }
        }
    },
    methods: {
        onToolToggleRightSidebar () {
            this.toggleRightSidebar = !this.toggleRightSidebar;
        }
    }
};
</script>

<template>
    <div class="ToolRightSidebar">
        <button
            id="sidebarButton"
            class="btn btn-primary"
            :title="toggleRightSidebar ? $t('modules.bimViewer.hideRightSideBar') : $t('modules.bimViewer.showRightSideBar')"
            @click="onToolToggleRightSidebar()"
        >
            <i class="bi bi-layout-sidebar-inset-reverse" />
        </button>
    </div>
</template>

<style lang="scss">
.ToolRightSidebar {
    #sidebarButton {
        transition: transform 0.5s ease-in-out;
    }
}
</style>
