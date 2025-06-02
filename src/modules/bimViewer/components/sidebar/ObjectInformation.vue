<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import FlatButton from "../../../../shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "ObjectInformation",
    components: {FlatButton},
    data () {
        return {
            objectData: null,
            refreshTimestamp: new Date(),
            isSticky: false,
            objectDataAccordeonisActive: true
        };
    },
    computed: {
        ...mapGetters("Modules/BimViewer/ToolObjectInfo", {
            pickedObjectId: "pickedObjectId",
            objectInformationActivated: "modeObjectInfoActive"
        })
    },
    watch: {
        pickedObjectId (newObjectId) {
            this.loadObjectInformation(newObjectId);
        }
    },
    mounted () {
        this.loadObjectInformation(this.pickedObjectId);
    },
    methods: {
        ...mapMutations("Modules/BimViewer/ToolObjectInfo", [
            "setModeObjectInfoActive"
        ]),
        ...mapActions("Modules/BimViewer", [
            "getObjectDataForId"
        ]),
        loadObjectInformation (objectId) {
            if (objectId) {
                this.getObjectDataForId({objectId: objectId})
                    .then((data) => {
                        if (data) {
                            this.objectData = data;
                            this.objectData.storey = this.getStoreyFromObjectData(data);

                            this.objectData.propertySets.forEach((set) => {
                                set.isActive = true;
                            });
                        }
                    });
            }
            else {
                this.objectData = null;
            }
        },
        getStoreyFromObjectData (data) {
            let analyseData = data;

            // rise in hierachy as long as you find IfcBuildingStorey or no parent is set anymore
            while (analyseData.type !== "IfcBuildingStorey" && analyseData.parent) {
                analyseData = analyseData.parent;
            }

            if (analyseData && analyseData.type === "IfcBuildingStorey") {
                return analyseData.name;
            }

            return "";
        },
        togglePropertiesSet (setId) {
            const properySet = this.objectData.propertySets.find((element) => element.id === setId);

            properySet.isActive = !properySet.isActive;
            this.refreshTimestamp = new Date();
        },
        generatedPsetHyperlinkTitle (completeLinkPath) {
            return completeLinkPath.split(/.*[/|\\]/)[1].split("?")[0];
        },
        activateObjectInformation () {
            this.setModeObjectInfoActive(true);
        }
    }
};
</script>

<template lang="html">
    <div class="ObjectInformation">
        <div
            v-if="!objectData"
            class="noData"
        >
            <h4 class="stickyHeader">
                {{ $t("modules.bimViewer.objectInformation.title") }}
            </h4>

            <p>
                {{ $t("modules.bimViewer.objectInformation.noData") }}
            </p>

            <FlatButton
                v-if="!objectInformationActivated"
                :text="$t('modules.bimViewer.objectInformation.noDataButtonActivateObjectInformation')"
                :interaction="() => activateObjectInformation()"
            />
            <em v-else>
                {{ $t('modules.bimViewer.objectInformation.noDataObjectInformationActivated') }}
            </em>
        </div>

        <div
            v-else
            class="dataAvailable"
        >
            <div class="section">
                <button
                    :class="{
                        'accordionButton': true,
                        'active': objectDataAccordeonisActive
                    }"
                    @click="objectDataAccordeonisActive = !objectDataAccordeonisActive"
                    @keyup.enter="objectDataAccordeonisActive = !objectDataAccordeonisActive"
                >
                    {{ $t("modules.bimViewer.objectInformation.title") }}
                </button>

                <table
                    :class="{
                        'propertiesTable': true,
                        'active': objectDataAccordeonisActive
                    }"
                >
                    <tbody>
                        <tr>
                            <td class="tdLabel">
                                {{ $t('modules.bimViewer.objectInformation.table.name') }}:
                            </td>

                            <td class="tdValue">
                                {{ objectData.name }}
                            </td>
                        </tr>

                        <tr>
                            <td class="tdLabel">
                                {{ $t('modules.bimViewer.objectInformation.table.class') }}:
                            </td>

                            <td class="tdValue">
                                {{ objectData.type }}
                            </td>
                        </tr>

                        <tr>
                            <td class="tdLabel">
                                {{ $t('modules.bimViewer.objectInformation.table.schema') }}:
                            </td>

                            <td class="tdValue">
                                {{ objectData.metaModels[0].schema }}
                            </td>
                        </tr>

                        <tr>
                            <td class="tdLabel">
                                {{ $t('modules.bimViewer.objectInformation.table.uuid') }}:
                            </td>

                            <td class="tdValue">
                                {{ objectData.id }}
                            </td>
                        </tr>

                        <tr>
                            <td class="tdLabel">
                                {{ $t('modules.bimViewer.objectInformation.table.storey') }}:
                            </td>

                            <td class="tdValue">
                                {{ objectData.storey }}
                            </td>
                        </tr>

                        <tr>
                            <td class="tdLabel">
                                {{ $t('modules.bimViewer.objectInformation.table.model') }}:
                            </td>

                            <td class="tdValue">
                                {{ objectData.metaModels[0].id }}
                            </td>
                        </tr>

                        <tr>
                            <td class="tdLabel">
                                {{ $t('modules.bimViewer.objectInformation.table.createdAt') }}:
                            </td>

                            <td class="tdValue">
                                {{ objectData.metaModels[0].createdAt }}
                            </td>
                        </tr>

                        <tr>
                            <td class="tdLabel">
                                {{ $t('modules.bimViewer.objectInformation.table.author') }}:
                            </td>

                            <td class="tdValue">
                                {{ objectData.metaModels[0].author }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div
                v-for="(propertySet) in objectData.propertySets"
                :key="propertySet.id + refreshTimestamp"
                class="section"
            >
                <button
                    :class="{
                        'accordionButton': true,
                        'active': propertySet.isActive
                    }"
                    @click="togglePropertiesSet(propertySet.id)"
                    @keyup.enter="togglePropertiesSet(propertySet.id)"
                >
                    {{ propertySet.name }}
                </button>

                <table
                    :class="{
                        'propertiesTable': true,
                        'active': propertySet.isActive
                    }"
                >
                    <tbody>
                        <tr
                            v-for="(property) in propertySet.properties"
                            :key="property.name"
                        >
                            <td class="tdLabel">
                                {{ `${property.name}: ` }}
                            </td>

                            <td
                                v-if="propertySet.name.startsWith('Pset_Hyperlink') && property.value.startsWith('http')"
                                class="tdValue"
                            >
                                <a
                                    :href="property.value"
                                    target="_blank"
                                >
                                    {{ generatedPsetHyperlinkTitle(property.value) }}
                                </a>
                            </td>

                            <td
                                v-else
                                class="tdValue"
                            >
                                {{ property.value }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
@import "~variables";

#bim-viewer {
    div.ObjectInformation {
        overflow-y: scroll;
        margin-top: 1rem;
        min-width: 15rem;

        div.section {
            margin: 0 0 0.5rem 0;

            span.accordionHeader {
                display: block;
                color: $black;
                background-color: $light_blue;
                cursor: pointer;
                width: 100%;
                text-align: left;
                padding: 0.25rem 0.5rem;
            }

            button.accordionButton {
                margin: 0;
                color: $black;
                background-color: $light_blue;
                cursor: pointer;
                transition: all 0.3s ease-in-out;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 6 6 6 6-6'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 0.75rem top 0.6rem;
                background-size: 1rem 0.75rem;
                width: 100%;
                text-align: left;
                border: none;
                padding: 0.25rem 0.5rem;

                &.active {
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 11 6-6 6 6'/%3e%3c/svg%3e");
                }
            }

            table.propertiesTable {
                width: 100%;
                display: none;
                box-sizing: border-box;
                border: solid 0.0625rem #DDD;

                &.active {
                    display: table;
                }

                td.tdLabel {
                    padding: 0.25em;
                    vertical-align: top;
                    border-top: 0.0625rem solid #DDD;
                    border-right: 0.0625rem solid #DDD;
                    max-width: 9.375rem;
                    width: 50%;
                    overflow-wrap: anywhere;
                }

                td.tdValue {
                    padding: 0.25em;
                    vertical-align: top;
                    border-top: 0.0625rem solid #DDD;
                    overflow-wrap: anywhere;
                    width: 50%;

                    a {
                        text-decoration: underline;
                    }
                }

                tr:first-child td {
                    border-top: 0;
                }
            }
        }

        div.noData {
            margin: 2rem 1rem;
        }
    }
}
</style>
