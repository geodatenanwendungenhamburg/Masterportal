<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "DrawEditAttributes",
    components: {
        InputText,
        IconButton
    },
    props: {
        selectedFeature: {
            type: Object,
            required: false,
            default: undefined
        },
        layer: {
            type: Object,
            required: false,
            default: undefined
        },
        attributesKeyList: {
            type: Array,
            required: false,
            default: undefined
        }
    },
    data () {
        return {
            featureSelected: false,
            attributes: []
        };
    },
    mounted () {
        console.warn("Hey", this.borderColor);
    }
};
</script>

<template>
    <form id="draw-attributes">
        <div
            v-if="featureSelected"
            class="form-group form-group-sm"
        >
            <div
                v-for="(attribute, idx) in attributes"
                :key="idx"
                class="row"
            >
                <InputText
                    :id="'key-input-' + idx"
                    v-model="attribute.key"
                    aria-label="attribute"
                    :title="validKeys[attribute.key].valid === null ? validKeys[attribute.key].message : null"
                    :class-obj="[validKeys[attribute.key].valid === false ? 'is-invalid' : '']"
                    :placeholder="$t('common:modules.draw_old.attributeSelect.input.key')"
                    :label="$t('common:modules.draw_old.attributeSelect.input.key')"
                />
            </div>
        </div>
        <div v-else>
            <span>{{ $t("common:modules.draw_old.attributeSelect.noFeatureSelected") }}</span>
        </div>
    </form>
</template>

<style lang="scss" scoped>
@import "~variables";

</style>
