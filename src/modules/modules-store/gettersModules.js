import {defineAsyncComponent} from "vue";

const getters = {
    componentMap: () => {
        const coreModules = {
            about: defineAsyncComponent(() => import("../about/components/AboutModule.vue")),
            addWMS: defineAsyncComponent(() => import("../addWMS/components/AddWMS.vue")),
            bufferAnalysis: defineAsyncComponent(() => import("../bufferAnalysis/components/BufferAnalysis.vue")),
            contact: defineAsyncComponent(() => import("../contact/components/ContactFormular.vue")),
            coordToolkit: defineAsyncComponent(() => import("../coordToolkit/components/CoordToolkit.vue")),
            copyrightConstraints: defineAsyncComponent(() => import("../copyrightConstraints/components/CopyrightConstraints.vue")),
            compareFeatures: defineAsyncComponent(() => import("../compareFeatures/components/CompareFeatures.vue")),
            compareMaps: defineAsyncComponent(() => import("../compareMaps/components/CompareMaps.vue")),
            customMenuElement: defineAsyncComponent(() => import("../menu/components/CustomMenuElement.vue")),
            draw: defineAsyncComponent(() => import("../draw/components/DrawModule.vue")),
            draw_old: defineAsyncComponent(() => import("../draw_old/components/DrawItem.vue")),
            featureLister: defineAsyncComponent(() => import("../featureLister/components/FeatureLister.vue")),
            fileImport: defineAsyncComponent(() => import("../fileImport/components/FileImport.vue")),
            filter: defineAsyncComponent(() => import("../filter/components/FilterGeneral.vue")),
            folder: defineAsyncComponent(() => import("../menu/components/MenuFolder.vue")),
            graphicalSelect: defineAsyncComponent(() => import("../../shared/modules/graphicalSelect/components/GraphicalSelect.vue")),
            language: defineAsyncComponent(() => import("../language/components/LanguageItem.vue")),
            layerClusterToggler: defineAsyncComponent(() => import("../layerClusterToggler/components/LayerClusterToggler.vue")),
            layerInformation: defineAsyncComponent(() => import("../layerInformation/components/LayerInformation.vue")),
            layerPills: defineAsyncComponent(() => import("../layerPills/components/LayerPills.vue")),
            layerSelection: defineAsyncComponent(() => import("../layerSelection/components/LayerSelection.vue")),
            layerSlider: defineAsyncComponent(() => import("../layerSlider/components/LayerSlider.vue")),
            layerSwiper: defineAsyncComponent(() => import("../../shared/modules/layerSwiper/components/LayerSwiper.vue")),
            legend: defineAsyncComponent(() => import("../legend/components/LegendContainer.vue")),
            login: defineAsyncComponent(() => import("../login/components/LoginComponent.vue")),
            measure: defineAsyncComponent(() => import("../measure/components/MeasureInMap.vue")),
            modeler3D: defineAsyncComponent(() => import("../modeler3D/components/Modeler3D.vue")),
            mouseHover: defineAsyncComponent(() => import("../mouseHover/components/MouseHover.vue")),
            news: defineAsyncComponent(() => import("../news/components/NewsView.vue")),
            openConfig: defineAsyncComponent(() => import("../openConfig/components/OpenConfig.vue")),
            portalFooter: defineAsyncComponent(() => import("../portalFooter/components/PortalFooter.vue")),
            print: defineAsyncComponent(() => import("../print/components/PrintMap.vue")),
            routing: defineAsyncComponent(() => import("../routing/components/RoutingTemplate.vue")),
            searchBar: defineAsyncComponent(() => import("../searchBar/components/SearchBar.vue")),
            scaleSwitcher: defineAsyncComponent(() => import("../scaleSwitcher/components/ScaleSwitcher.vue")),
            selectFeatures: defineAsyncComponent(() => import("../selectFeatures/components/SelectFeatures.vue")),
            shadow: defineAsyncComponent(() => import("../shadow/components/ShadowTool.vue")),
            shareView: defineAsyncComponent(() => import("../shareView/components/ShareView.vue")),
            statisticDashboard: defineAsyncComponent(() => import("../statisticDashboard/components/StatisticDashboard.vue")),
            styleVT: defineAsyncComponent(() => import("../styleVT/components/StyleVT.vue")),
            wfsSearch: defineAsyncComponent(() => import("../wfsSearch/components/WfsSearch.vue")),
            wfst: defineAsyncComponent(() => import("../wfst/components/WfsTransaction.vue")),
            wmsTime: defineAsyncComponent(() => import("../wmsTime/components/WmsTime.vue"))
        };

        moduleCollection = {...coreModules, ...moduleCollection};
        return moduleCollection;
    }
};

export default getters;
