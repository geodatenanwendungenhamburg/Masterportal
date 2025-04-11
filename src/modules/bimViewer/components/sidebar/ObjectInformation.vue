<script>
import {mapGetters, mapMutations} from "vuex";
import getters from "../../store/gettersBimViewer";
import mutations from "../../store/mutationsBimViewer";

export default {
    name: "ObjectInformation",
    data () {
        return {
            objectData: null,
            refreshTimestamp: new Date(),
            isSticky: false,
            currentCameraInfo: ""
        };
    },
    computed: {
        ...mapGetters("Modules/BimViewer", Object.keys(getters)),
        pickedObjectId () {
            return this.$store.getters["Modules/BimViewer/ToolObjectInfo/pickedObjectId"];
        }
    },
    watch: {
        pickedObjectId (newObjectId) {
            this.loadObjectInformation(newObjectId);
        }
    },
    mounted () {
        this.loadObjectInformation(this.pickedObjectId);

        this.xeokitIfcViewer.scene.camera.on("viewMatrix", () => {

            const
                cameraValuesEye = [
                    this.xeokitIfcViewer.camera.eye[0],
                    this.xeokitIfcViewer.camera.eye[1],
                    this.xeokitIfcViewer.camera.eye[2]
                ],
                cameraValuesLook = [
                    this.xeokitIfcViewer.camera.look[0],
                    this.xeokitIfcViewer.camera.look[1],
                    this.xeokitIfcViewer.camera.look[2]
                ],
                cameraValuesUp = [
                    this.xeokitIfcViewer.camera.up[0],
                    this.xeokitIfcViewer.camera.up[1],
                    this.xeokitIfcViewer.camera.up[2]
                ];

            // Indent is needed, because info is rendered into an HTML pre tag.
            this.currentCameraInfo = `
"cameraSettings": {
    "eye": [${cameraValuesEye.join(", ")}],
    "look": [${cameraValuesLook.join(", ")}],
    "up": [${cameraValuesUp.join(", ")}]
}
            `.trim();
        });

    },
    methods: {
        ...mapMutations("Modules/BimViewer", Object.keys(mutations)),
        loadObjectInformation (objectId) {
            if (objectId) {
                this.$store.dispatch("Modules/BimViewer/getObjectDataForId", {objectId: objectId}).then((data) => {
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
            return completeLinkPath.split(/.*[/|\\]/)[1];
        }
    }
};
</script>

<template lang="html">
    <div class="ObjectInformation">
        <h4 class="stickyHeader">
            {{ $t("modules.bimViewer.objectInformation.title") }}
        </h4>

        <div
            v-if="!objectData"
            class="noData"
        >
            <p>
                {{ $t("modules.bimViewer.objectInformation.noData") }}
            </p>

            <div class="cameraValues">
                <span> {{ $t("modules.bimViewer.objectInformation.cameraSettings") }} </span>

                <pre>{{ currentCameraInfo }}</pre>
            </div>
        </div>

        <div
            v-else
            class="dataAvailable"
        >
            <table class="propertiesTable active">
                <tbody>
                    <tr>
                        <td class="tdLabel">
                            {{ `${$t('modules.bimViewer.objectInformation.table.name')}:` }}
                        </td>

                        <td class="tdValue">
                            <strong>{{ objectData.name }}</strong>
                        </td>
                    </tr>

                    <tr>
                        <td class="tdLabel">
                            {{ `${$t('modules.bimViewer.objectInformation.table.class')}:` }}
                        </td>

                        <td class="tdValue">
                            {{ objectData.type }}
                        </td>
                    </tr>

                    <tr>
                        <td class="tdLabel">
                            {{ `${$t('modules.bimViewer.objectInformation.table.uuid')}:` }}
                        </td>

                        <td class="tdValue">
                            {{ objectData.id }}
                        </td>
                    </tr>

                    <tr>
                        <td class="tdLabel">
                            {{ `${$t('modules.bimViewer.objectInformation.table.storey')}:` }}
                        </td>

                        <td class="tdValue">
                            {{ objectData.storey }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div
                v-for="(propertySet) in objectData.propertySets"
                :key="propertySet.id + refreshTimestamp"
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
                                v-if="propertySet.name === 'Pset_Hyperlink'"
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

<style lang="scss" scoped>
    div.ObjectInformation {
        h4 {
            padding: 1rem;
        }

        h4.stickyHeader {
            position: sticky;
            top:0;
            background-color:#313961;
            font-weight: 500;
            border-radius: 5px;
            z-index:999;
        }

        button.accordionButton {
            margin: 0;
            position: relative;
            padding: 15px 15px;
            color: #ffffff;
            display: block;
            font-weight: 500;
            background-color: #313961;
            cursor: pointer;
            transition: all 0.3s ease-in-out;
            border-radius: 5px;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23ffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 6 5 6 6-6'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
            background-size: 16px 12px;
            width: 100%;
            text-align: left;

            &.active {
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23ffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 6 6-6 6 6'/%3e%3c/svg%3e");
            }
        }

        table.propertiesTable {
            width: 95%;
            margin: 0.5rem 0.5rem 1rem 0.5rem;
            display: none;
            box-sizing: border-box;

            &.active {
                display: table;
            }

            td.tdLabel {
                padding: 0.6em;
                vertical-align: top;
                border-top: 1px solid #81819a;
                border-right: 1px solid #81819a;
                font-weight: bold;
                width: 100px;
                max-width: 150px;
            }

            td.tdValue {
                padding: 0.5em;
                vertical-align: top;
                border-top: 1px solid #81819a;
                overflow-wrap: anywhere;

                a {
                    text-decoration: underline;
                }
            }

            tr:first-child td {
                border-top: 0;
            }
        }

        div.noData {
            margin: 2rem 1rem;

            p {
                color: white;
                font-size: 1rem;
            }

            div.cameraValues {
                margin-top: 2rem;
                border: solid 1px #79b3e2;
                padding: 0.5rem;
                color: #79b3e2;

                span {
                    display: block;
                    margin-bottom: 0.25rem;
                }

                pre {
                    text-wrap: wrap;
                    margin-bottom: 0;
                }
            }
        }
    }
</style>
