<script>
export default {
    name: "IconButton",
    props: {
        interaction: {
            type: Function,
            required: false,
            default: () => {
                return true;
            }
        },
        aria: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: null,
            required: false
        },
        iconArray: {
            type: Array,
            default: null,
            required: false
        },
        classArray: {
            type: Array,
            default: null,
            required: false
        },
        id: {
            type: String,
            default: null,
            required: false
        },
        disabled: {
            type: Boolean,
            default: null,
            required: false
        },
        label: {
            type: String,
            default: null,
            required: false
        },
        drawLayout: {
            type: Boolean,
            default: null,
            required: false
        }
    }
};
</script>

<template>
    <div
        :class="[label && !drawLayout ? 'btn-wrapper flex-column d-flex align-items-center': drawLayout ? 'btn-wrapper draw-layout flex-column d-flex' : '']"
    >
        <button
            :id="id"
            tabindex="0"
            class="btn d-flex justify-items-center mb-auto"
            type="button"
            :title="aria"
            :aria-label="aria"
            :class="classArray"
            :disabled="disabled"
            @click="interaction"
            @keydown.enter="interaction"
        >
            <i
                :class="iconArray ? iconArray : icon"
                role="img"
            />
        </button>
        <label
            v-if="label"
            class="text-center btn-label"
            :for="id"
            :aria-label="label"
        >
            {{ label }}
        </label>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
@import "~mixins";

.btn-wrapper {
    width: 16rem;
}

.btn-wrapper.draw-layout {
    width: 5rem;
}

.btn-wrapper > .btn-label {
    font-size: 0.9rem;
}

 .btn {
    position: relative;
    text-align: center;
    top: auto;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.5rem;
    border-radius: 50%;
    border: solid $white 1px;
    z-index: 2;
    /* position icon in center of button */
    > i {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        // adjust line-height to use same height as ::before Element
        line-height: 0;
    }
}
</style>
