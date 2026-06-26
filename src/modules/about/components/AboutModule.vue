<script setup>
import {computed, onMounted} from "vue";
import {useStore} from "vuex";
import {storeToRefs} from "pinia";
import {useTranslation} from "i18next-vue";
import {useAboutStore} from "../store/aboutStore.js";
import LightButton from "@shared/modules/buttons/components/LightButton.vue";

const {t} = useTranslation();
const aboutStore = useAboutStore();
const vuexStore = useStore();

const {
    abstractText,
    contact,
    logo,
    logoLink,
    logoText,
    metaUrl,
    showAdditionalMetaData,
    title,
    version,
    versionLink,
    ustId,
    privacyStatementText,
    privacyStatementUrl,
    accessibilityText,
    accessibilityUrl
} = storeToRefs(aboutStore);

const mainMenu = computed(() => vuexStore.getters["Menu/mainMenu"]);
const secondaryMenu = computed(() => vuexStore.getters["Menu/secondaryMenu"]);

const contactConfigured = computed(() => mainMenu.value.sections[0].find(m => m.type === "contact")
    || secondaryMenu.value.sections[0].find(m => m.type === "contact"));

const menuIndicator = computed(() => {
    return mainMenu.value.sections[0].find(m => m.type === "about")
        ? "mainMenu"
        : "secondaryMenu";
});

onMounted(() => {
    aboutStore.initializeAboutInfo();
});

/**
 * Opens the privacy statement URL in a new browser tab.
 * @returns {void}
 */
function openDataPrivacyLink () {
    window.open(privacyStatementUrl.value, "_blank");
}

/**
 * Opens the accessibility statement URL in a new browser tab.
 * @returns {void}
 */
function openAccessibilityLink () {
    window.open(accessibilityUrl.value, "_blank");
}

/**
 * Opens the contact module in the menu side where the about module is configured.
 * @returns {void}
 */
function openContactModule () {
    vuexStore.dispatch("Menu/changeCurrentComponent", {type: "contact", side: menuIndicator.value, props: {name: t("common:modules.contact.name")}});
}

/**
 * Checks if a value is a non-empty string.
 * @param {String} inputString The string to check.
 * @returns {String|null} The input string if it is a non-empty string, otherwise null.
 */
function checkStringContent (inputString) {
    return typeof inputString === "string" && inputString.length ? inputString : null;
}
</script>

<template lang="html">
    <div
        id="modules-about"
        class="d-flex flex-column justify-content-between"
    >
        <div class="content d-flex flex-column">
            <div v-if="title">
                <h5
                    class="title"
                    v-html="title"
                />
            </div>
            <div>
                <div
                    class="pb-2 abstract"
                    v-html="abstractText"
                />
            </div>
            <div v-if="showAdditionalMetaData && metaUrl.length > 0">
                <p
                    class="float-end"
                >
                    <a
                        :href="metaUrl"
                        target="_blank"
                    >
                        {{ $t("common:modules.about.additionalMetadata") }}
                    </a>
                </p>
            </div>
            <div
                v-if="checkStringContent(privacyStatementUrl)"
                class="pt-5 privacyStatementWrapper"
            >
                <h4>
                    {{ $t("common:modules.about.privacyStatement") }}
                </h4>
                <span class="pb-3 privacyStatementText">
                    {{ checkStringContent(privacyStatementText) || $t("common:modules.about.privacyStatementText") }}
                </span>
                <LightButton
                    class="mt-3 privacyStatementButton"
                    :interaction="openDataPrivacyLink"
                    :text="$t('common:modules.about.privacyStatement')"
                    icon="bi-box-arrow-up-right"
                    customclass="w-100"
                    :title="privacyStatementUrl"
                />
            </div>
            <div
                v-if="checkStringContent(accessibilityUrl)"
                class="pt-5 accessibilityStatementWrapper"
            >
                <h4>
                    {{ $t("common:modules.about.accessibilityStatement") }}
                </h4>
                <span class="pb-3 accessibilityText">
                    {{ checkStringContent(accessibilityText) || $t("common:modules.about.accessibilityText") }}
                </span>
                <LightButton
                    class="mt-3 accessibilityStatementButton"
                    :interaction="openAccessibilityLink"
                    :text="$t('common:modules.about.accessibilityStatement')"
                    icon="bi-box-arrow-up-right"
                    customclass="w-100"
                    :title="accessibilityUrl"
                />
            </div>
            <div
                id="imprint"
                class="pt-5"
            >
                <h4>
                    {{ $t("common:modules.about.imprintTitle") }}
                </h4>
                <div
                    v-if="contact"
                    class="pt-3 contact"
                >
                    <h4>{{ $t("common:modules.about.contact") }}</h4>
                    <p
                        v-html="contact.name"
                    />
                    <p
                        v-for="(positionName) in contact.positionName"
                        :key="positionName"
                        v-html="positionName"
                    />
                    <p>
                        {{ contact.street }}
                    </p>
                    <p>
                        {{ contact.postalCode }} {{ contact.city }}
                    </p>
                    <a
                        :href="'mailto:' + contact.email"
                    >
                        {{ contact.email }}
                    </a>
                </div>
                <LightButton
                    v-if="contactConfigured"
                    class="mt-3 openContactButton"
                    :interaction="openContactModule"
                    :text="$t('common:modules.about.contactButton')"
                    icon="bi-envelope"
                    customclass="w-100"
                    :title="$t('common:modules.about.contactButton')"
                />
                <div
                    v-if="checkStringContent(ustId)"
                    class="pt-4 ustIdWrapper"
                >
                    <p>
                        {{ $t("common:modules.about.ustId") }}
                    </p>
                    <p class="ustId">
                        {{ ustId }}
                    </p>
                </div>
            </div>
        </div>
        <div
            v-if="logo || version"
            class="d-flex flex-row justify-content-between mb-3 mt-5 align-items-center logoAndVersion"
        >
            <a
                class="logo"
                :href="logoLink ? logoLink : '#'"
                :target="logoLink ? '_blank' : '_self'"
            >
                <img
                    v-if="logo"
                    :src="logo"
                    :alt="logoText"
                >
            </a>
            <span
                v-if="version"
                class="version"
            >
                <a
                    :href="versionLink ? versionLink : '#'"
                    :target="versionLink ? '_blank' : '_self'"
                >
                    {{ $t("common:modules.about.version") + version }}

                </a>
            </span>
        </div>
    </div>
</template>

<style lang="scss">
    #modules-about {
        height: 100%;
        overflow-y: hidden;

        .content {
            overflow-y: auto;

            p {
                font-size: $font-size-base;
                margin-bottom: 0rem;
            }
        }

        .logoAndVersion {
            background-color: white;
            margin-top: auto;

            .logo {
                width: 5rem;
            }
            .version {
                display: flex;
                font-size: small;
            }
        }
    }

</style>
