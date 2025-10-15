<script>
import {mapActions, mapGetters} from "vuex";

/**
 * Mouse Hover
 * @module modules/MouseHover
 */
export default {
    name: "MouseHover",
    computed: {
        ...mapGetters("Modules/MouseHover", [
            "configPaths",
            "infoBox",
            "infoText",
            "pleaseZoom",
            "type",
            "fontFamily",
            "titleFontFamily",
            "fontStyle",
            "titleFontStyle",
            "fontWeight",
            "titleFontWeight",
            "fontSize",
            "titleFontSize",
            "fontColor",
            "titleFontColor",
            "infoBorderRadius",
            "lineHeight"
        ]),
        ...mapGetters(["mouseHover"])
    },
    mounted () {
        this.initializeModule({configPaths: this.configPaths, type: this.type});
        this.initialize();
    },
    methods: {
        ...mapActions("Modules/MouseHover", ["initialize"]),
        ...mapActions(["initializeModule"])
    }
};
</script>

<template>
    <div
        v-if="mouseHover && Object.keys(mouseHover).length > 0"
        id="mousehover-overlay"
    >
        <div
            v-if="infoBox"
            class="mouseHover"
            :style="{
                '--mousehover-font-family': fontFamily,
                '--mousehover-font-style': fontStyle,
                '--mousehover-font-weight': fontWeight,
                '--mousehover-font-size': fontSize + 'px',
                '--mousehover-font-color': fontColor,
                '--mousehover-border-radius': infoBorderRadius + 'px',
                '--mousehover-line-height': lineHeight
            }"
        >
            <div>
                <div
                    v-for="(info, x) in infoBox"
                    :key="x"
                >
                    <span
                        v-for="(text, i) in info"
                        :key="i"
                    >
                        <p
                            v-if="i === 0"
                            class="title"
                            :style="{
                                'font-family': titleFontFamily,
                                'font-style': titleFontStyle,
                                'font-size': titleFontSize + 'px',
                                'font-weight': titleFontWeight,
                                'color': titleFontColor
                            }"
                            v-html="text"
                        />
                        <p
                            v-else
                            v-html="text"
                        />
                    </span>
                    <br v-if="x !== infoBox.length - 1 || pleaseZoom">
                </div><span
                    v-if="pleaseZoom"
                    class="info"
                >
                    <p>{{ $t(infoText) }}</p>
                </span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
@import "~mixins";

.mouseHover {
    font-size: var(--mousehover-font-size, $font-size-base);
    font-family: var(--mousehover-font-family, $font_family_default);
    font-style: var(--mousehover-font-style, normal);
    font-weight: var(--mousehover-font-weight, normal);
    line-height: var(--mousehover-line-height);
    text-align: left;
    max-width: inherit;
    padding: 0.5rem;
    background-color: $white;
    color: var(--mousehover-font-color, $dark-grey);
    white-space: nowrap;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: var(--mousehover-border-radius, 0px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);

    .title {
        font-size: var(--mousehover-title-font-size, $font-size-base);
        color: var(--mousehover-title-font-color);
        font-family: var(--mousehover-title-font-family, $font_family_accent);
    }
    .info {
        font-size: $font_size_sm;
        font-style: italic;
    }
}
</style>
