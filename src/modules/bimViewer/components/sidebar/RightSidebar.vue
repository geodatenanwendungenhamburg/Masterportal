<script>
import ObjectInformation from "./ObjectInformation.vue";

export default {
    name: "RightSidebar",
    components: {
        ObjectInformation
    }
};
</script>

<template>
    <div class="RightSidebar">
        <ObjectInformation />
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.RightSidebar {
        display: flex;
        flex-direction: column;
        flex: 0.5;
        padding: 0 0 0 1rem;
        box-shadow: 0.1875rem 0.1875rem 1rem $shadow;
    }
}
</style>
