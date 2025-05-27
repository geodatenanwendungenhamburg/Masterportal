
<script>
import {mapGetters} from "vuex";
import clickOutside from "../../utils/clickOutside";
import IconButton from "../../../../shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ToolSceneSelector",
    components: {IconButton},
    directives: {
        clickOutside
    },
    data () {
        return {
            selectedSceneIndex: 0,
            dropdownVisible: false,
            isToolSelectorActive: false
        };
    },
    computed: {
        ...mapGetters("Modules/BimViewer", [
            "sceneConfigs"
        ])
    },
    methods: {
        toggleDropdown () {
            this.dropdownVisible = !this.dropdownVisible;
            this.isToolSelectorActive = !this.isToolSelectorActive;
        },
        hideDropdown () {
            this.dropdownVisible = false;
            this.isToolSelectorActive = false;
        },
        handleClickOutside (event) {
            const container = this.$refs.dropdownWrapper;

            if (container && container.contains(event.target)) {
                return;
            }

            this.hideDropdown();
        },
        selectScene (index) {
            this.selectedSceneIndex = index;
            this.$emit("sceneSelected", index);
            this.hideDropdown();
        }
    }
};
</script>

<template>
    <div
        ref="dropdownWrapper"
        v-click-outside="handleClickOutside"
        class="ToolSceneSelector"
    >
        <IconButton
            icon="bi-layers"
            :class-array="[
                'btn-primary',
                isToolSelectorActive ? 'bim-btn-highlight' : ''
            ]"
            :title="$t('modules.bimViewer.tools.scene')"
            :aria="$t('modules.bimViewer.tools.scene')"
            :interaction="() => toggleDropdown()"
            @keydown.enter="toggleDropdown"
        />

        <ul
            v-if="dropdownVisible"
            class="custom-dropdown"
        >
            <li
                v-for="(sceneConfig, index) in sceneConfigs"
                :key="sceneConfig.id"
                :class="{ selected: selectedSceneIndex == index }"
            >
                <a
                    href="#"
                    tabindex="0"
                    role="menuitem"
                    :aria-current="selectedSceneIndex == index ? 'true' : undefined"
                    class="scene-link"
                    @click.prevent="selectScene(index)"
                >
                    {{ sceneConfig.name }}
                </a>
            </li>
        </ul>
    </div>
</template>

<style lang="scss">
@import "~variables";
#bim-viewer {
    div.ToolSceneSelector {
        display: flex;
        position: relative;
        ul.custom-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 1000;
            background: $white;
            box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.15);
            border-radius: 0.25rem;
            padding: 0;
            margin-top: 0.25rem;
            list-style: none;
            min-width: 13rem;
            overflow: hidden;

            li {
                padding: 0;
                margin: 0;

                .scene-link {
                    display: block;
                    width: 100%;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    text-decoration: none;
                    color: inherit;
                    background: none;
                    border: none;
                    text-align: left;
                    transition: background-color 0.2s;

                    &:hover,
                    &:focus {
                        background-color: #f0f0f0;
                        outline: none;
                    }
                }

                &.selected .scene-link {
                    font-weight: bold;
                    background-color: #e9ecef;
                }
            }
        }
    }
}
</style>
