<script>
import ObjectInformation from "./ObjectInformation.vue";
import ResizeHandle from "../../../../shared/modules/resize/components/ResizeHandle.vue";

export default {
    name: "RightSidebar",
    components: {
        ObjectInformation,
        ResizeHandle
    }
};
</script>

<template>
    <div class="RightSidebar">
        <ObjectInformation />

        <ResizeHandle
            side="mainMenu"
            :min-width="0.05"
            :max-width="0.95"
            :min-height="1"
            target-selector=".RightSidebar"
            handle-position="left"
        >
            &#8942;
        </ResizeHandle>
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.RightSidebar {
        display: flex;
        flex-direction: column;
        padding: 0 0 0 1rem;
        box-shadow: 0.1875rem 0.1875rem 1rem $shadow;
        position: relative;
        width: 50%;
    }
}
</style>
