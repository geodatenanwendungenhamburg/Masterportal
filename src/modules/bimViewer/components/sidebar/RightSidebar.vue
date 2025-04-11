<script>
import ObjectInformation from "./ObjectInformation.vue";

export default {
    name: "RightSidebar",
    components: {
        ObjectInformation
    },
    computed: {
        toggleRightSidebar () {
            return this.$store.getters["Modules/BimViewer/toggleRightSidebar"];
        }
    },
    watch: {
        toggleRightSidebar () {
            this.toggleSidebarButton();
        }
    },
    methods: {
        onToolToggleRightSidebar () {
            this.$store.commit("Modules/BimViewer/setToggleRightSidebar", !this.toggleRightSidebar, {root: true});
        },
        toggleSidebarButton () {
            const button = document.getElementById("sidebarButton");

            if (this.toggleRightSidebar) {
                button.style.transform = "translateX(100vw)";
                button.style.display = "none";
            }
            else {
                button.style.display = "block";
                setTimeout(()=> {
                    button.style.transform = "translateX(0)";
                }, 400);
            }
        }
    }
};
</script>

<template>
    <transition name="slide">
        <div
            v-if="toggleRightSidebar"
            id="RightSidebar"
            class="rightSidebar"
        >
            <button
                class="btn btn-primary bim-btn-highlight closeButton"
                @click="onToolToggleRightSidebar"
            >
                <i class="bi bi-x-circle" />
            </button>

            <ObjectInformation />
        </div>
    </transition>
</template>

<style lang="scss">
#RightSidebar {
    width: 55%;
    background-color: #003063;
    color: #FFF;
    z-index: 100000;
    height: 100%;
    overflow: auto;
    position: relative;

    button.closeButton {
        position: sticky;
        float: right;
        top: 0.5rem;
        right: 0;
        box-shadow: none;
        z-index:1000;
        background-color:#313961;
        border: none;
        font-size: large;
        color: white;
    }

    button.closeButton:hover {
        color:red;
    }
}

.slide-enter-active,
.slide-leave-active {
    transition: transform 0.5s ease;
}

.slide-enter,
.slide-leave-to {
    transform: translateX(100%);
}
</style>
