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
div.RightSidebar {
    display: flex;
    flex-direction: column;
    flex: 0.5;
    padding: 0 0 0 1rem;
    box-shadow: 3px 3px 1rem #00000050;
}
</style>
