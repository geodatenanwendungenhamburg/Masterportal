<script>

/**
 * FileUpload Component: A component to upload files using either a dropzone or a file-choosing dialogue.
 * @module shared/modules/inputs/FileUpload
 * @vue-prop {function} change binds a function to be executed on change of the uploaded file.
 * @vue-prop {function} drop binds a function to be executed on dropping a file into the dropzone for upload.
 */
export default {
    name: "FileUpload",
    props: {
        change: {
            type: Function,
            required: true
        },
        drop: {
            type: Function,
            required: true
        }
    },
    data () {
        return {
            dzIsDropHovering: false
        };
    },
    computed: {
        dropZoneAdditionalClass: function () {
            return this.dzIsDropHovering ? "dzReady" : "";
        }
    },
    methods: {
        onDZDragenter () {
            this.dzIsDropHovering = true;
        },
        onDZDragend () {
            this.dzIsDropHovering = false;
        },
        onDZMouseenter () {
            this.dzIsHovering = true;
        },
        onDZMouseleave () {
            this.dzIsHovering = false;
        },
        onDrop (e) {
            this.dzIsDropHovering = false;
            this.drop(e);
        },
        triggerFileInputClick () {
            this.$refs["upload-input-file"].click();
        }
    }
};
</script>

<template>
    <div class="form-floating mb-3">
        <div
            class="vh-center-outer-wrapper drop-area-fake mb-3"
            :class="dropZoneAdditionalClass"
        >
            <div
                class="vh-center-inner-wrapper"
            >
                <p
                    class="caption"
                >
                    <i class="bi-box-arrow-in-down" />
                    {{ $t("common:shared.modules.inputs.fileUpload.dropzone") }}
                </p>
            </div>
            <div>
                {{ $t("common:shared.modules.inputs.fileUpload.or") }}
                <button
                    ref="upload-label"
                    class="fake-link"
                    type="button"
                    @click="triggerFileInputClick"
                >
                    {{ $t("common:shared.modules.inputs.fileUpload.browse") }}
                    <input
                        ref="upload-input-file"
                        type="file"
                        name="image"
                        multiple="multiple"
                        @change="change"
                    >
                </button>
            </div>
            <!-- Space for preview images or other files -->
            <slot />

            <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
            <div
                class="drop-area"
                role="presentation"
                @drop.prevent="onDrop"
                @dragover.prevent
                @dragenter.prevent="onDZDragenter"
                @dragleave="onDZDragend"
                @mouseenter="onDZMouseenter"
                @mouseleave="onDZMouseleave"
            />
            <!--
                The previous element does not provide a @focusin or @focus reaction as would
                be considered correct by the linting rule set. Since it's a drop-area for file
                dropping by mouse, the concept does not apply. Keyboard users may use the
                matching input fields.
                For the same reason this element has the 'role=presentation' assigned to avoid
                the linter error: 'Visible, non-interactive elements should not have an interactive handler'
            -->
        </div>
    </div>
</template>

<style lang="scss" scoped>


input[type="file"] {
        display: none;
    }
    input[type="button"] {
        display: none;
    }
    .drop-area-fake {
        background-color: $white;
        border-radius: 12px;
        border: 2px dashed $dark_blue;
        padding:24px;
        transition: background 0.25s, border-color 0.25s;

        &.dzReady {
            border-color:transparent;
            background-color: $dark_blue;

            p.caption {
                color: $white;
            }
        }

        p.caption {
            color: $dark_blue;
            margin:0;
            text-align:center;
            transition: color 0.35s;
            font-family: $font_family_accent;
            font-size: $font-size-lg;
        }
    }
    .drop-area {
        position:absolute;
        top:0;
        left:0;
        right:0;
        bottom:0;
        z-index:10;
    }
    .vh-center-outer-wrapper {
        top:0;
        left:0;
        right:0;
        bottom:0;
        text-align:center;
        position:relative;

        &:before {
            content:'';
            display:inline-block;
            height:100%;
            vertical-align:middle;
            margin-right:-0.25rem;
        }
    }
    .vh-center-inner-wrapper {
        text-align:left;
        display:inline-block;
        vertical-align:middle;
        position:relative;
    }
    .fake-link {
        z-index: 20;
        position: relative;
        color: $secondary;
        cursor: pointer;
        background: none;
        border: none;
        margin: 0;
        padding: 0;
        &:hover {
            text-decoration: underline;
        }
    }
</style>
