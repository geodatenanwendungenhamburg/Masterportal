<script>
export default {
    name: "LayoutFrame",
    props: {
        borderColor: {
            type: String,
            required: false,
            default: null
        },
        fill: {
            type: String,
            required: false,
            default: null
        },
        triangle: {
            type: Boolean,
            required: false,
            default: false
        },
        trianglePosition: {
            type: Number,
            required: false,
            default: null
        }
    }
};
</script>

<template>
    <div
        :style="{
            '--border-color': borderColor || 'transparent', '--background-color': fill || 'transparent',
            '--triangle-position': trianglePosition ? `${trianglePosition}px` : '50%'}"

        :class="{ 'has-triangle': triangle }"
    >
        <slot />
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
div {
    border: 2px solid var(--border-color);
    border-radius: 10px;
    background-color: var(--background-color);
    padding: 5px;
    position: relative;
    margin-top: 15px;
}
div.has-triangle::before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 15px 15px 15px;
    border-color: transparent transparent var(--border-color) transparent;
    top: -15px;
    bottom: auto;
    transform: translateX(-50%);
    left: var(--triangle-position);
}
</style>
