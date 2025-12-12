<script>
import {mapGetters} from "vuex";
import {isPhoneNumber, getPhoneNumberAsWebLink} from "@shared/js/utils/isPhoneNumber.js";
import {isWebLink} from "@shared/js/utils/urlHelper.js";
import {isEmailAddress} from "@shared/js/utils/isEmailAddress.js";
import toBold from "@shared/js/utils/toBold.js";


export default {
    name: "FeatureDetailView",
    computed: {
        ...mapGetters("Modules/FeatureLister", [
            "featureDetails"
        ])
    },
    methods: {
        isWebLink,
        isPhoneNumber,
        getPhoneNumberAsWebLink,
        isEmailAddress,
        toBold,
        removeVerticalBar (value) {
            return value.replaceAll("|", "<br>");
        }
    }
};

</script>

<template>
    <div
        id="feature-lister-details"
        class="panel panel-default feature-lister-details"
    >
        <ul
            v-for="(value, key) in featureDetails"
            :key="'module-feature-lister-' + key"
            class="list-group feature-lister-details-ul"
        >
            <li class="list-group-item feature-lister-details-li">
                <strong>
                    {{ key }}
                </strong>
            </li>
            <li class="list-group-item feature-lister-details-li">
                <p v-if="isWebLink(value)">
                    <a
                        :href="value"
                        target="_blank"
                    >{{ value }}</a>
                </p>
                <p v-else-if="isPhoneNumber(value)">
                    <a :href="getPhoneNumberAsWebLink(value)">{{ value }}</a>
                </p>
                <p v-else-if="isEmailAddress(value)">
                    <a :href="`mailto:${value}`">{{ value }}</a>
                </p>
                <p
                    v-else-if="typeof value === 'string' && value.includes(';')"
                >
                    <span v-html="toBold(value, key)" />
                </p>
                <p
                    v-else-if="typeof value === 'string' && value.includes('|')"
                >
                    <span v-html="removeVerticalBar(value)" />
                </p>
                <p
                    v-else-if="typeof value === 'string' && value.includes('<br>')"
                >
                    <span v-html="value" />
                </p>
                <p v-else>
                    {{ value }}
                </p>
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>

.feature-lister-details-ul {
    max-height: 400px;
    overflow: auto;
    cursor: auto;
}
.feature-lister-details {
    display: block;
    margin-bottom: 0;
    max-height: 100%;
    overflow: auto;
}
</style>
