import getters from "./gettersModules.js";

import About from "../about/store/indexAbout.js";
import AddWMS from "../addWMS/store/indexAddWMS.js";
import BaselayerSwitcher from "../baselayerSwitcher/store/indexBaselayerSwitcher.js";
import BufferAnalysis from "../bufferAnalysis/store/indexBufferAnalysis.js";
import Contact from "../contact/store/indexContact.js";
import CompareMaps from "../compareMaps/store/indexCompareMaps.js";
import CompareFeatures from "../compareFeatures/store/indexCompareFeatures.js";
import CoordToolkit from "../coordToolkit/store/indexCoordToolkit.js";
import CopyrightConstraints from "../copyrightConstraints/store/indexCopyrightConstraints.js";
import Draw from "../draw/store/indexDraw.js";
import Draw_old from "../draw_old/store/indexDraw.js";
import FeatureLister from "../featureLister/store/indexFeatureLister.js";
import FileImport from "../fileImport/store/indexFileImport.js";
import Filter from "../filter/store/indexFilter.js";
import GetFeatureInfo from "../getFeatureInfo/store/indexGetFeatureInfo.js";
import GraphicalSelect from "@shared/modules/graphicalSelect/store/indexGraphicalSelect.js";
import Language from "../language/store/indexLanguage.js";
import LayerClusterToggler from "../layerClusterToggler/store/indexLayerClusterToggler.js";
import LayerInformation from "../layerInformation/store/indexLayerInformation.js";
import LayerPills from "../layerPills/store/indexLayerPills.js";
import LayerPreview from "@shared/modules/layerPreview/store/indexLayerPreview.js";
import LayerSelection from "../layerSelection/store/indexLayerSelection.js";
import LayerSlider from "../layerSlider/store/indexLayerSlider.js";
import LayerSwiper from "@shared/modules/layerSwiper/store/indexLayerSwiper.js";
import LayerTree from "../layerTree/store/indexLayerTree.js";
import Legend from "../legend/store/indexLegend.js";
import Login from "../login/store/indexLogin.js";
import Measure from "../measure/store/indexMeasure.js";
import Modeler3D from "../modeler3D/store/indexModeler3D.js";
import MouseHover from "../mouseHover/store/indexMouseHover.js";
import News from "../news/store/indexNewsView.js";
import OpenConfig from "../openConfig/store/indexOpenConfig.js";
import PortalFooter from "../portalFooter/store/indexPortalFooter.js";
import Print from "../print/store/indexPrint.js";
import ResizeHandle from "@shared/modules/resize/store/indexResizeHandle.js";
import Routing from "../routing/store/indexRouting.js";
import ScaleSwitcher from "../scaleSwitcher/store/indexScaleSwitcher.js";
import SearchBar from "../searchBar/store/indexSearchBar.js";
import SelectFeatures from "../selectFeatures/store/indexSelectFeatures.js";
import Shadow from "../shadow/store/indexShadow.js";
import ShareView from "../shareView/store/indexShareView.js";
import StatisticDashboard from "../statisticDashboard/store/indexStatisticDashboard.js";
import StyleVT from "../styleVT/store/indexStyleVT.js";
import WfsSearch from "../wfsSearch/store/indexWfsSearch.js";
import Wfst from "../wfst/store/indexWfst.js";
import WmsTime from "../wmsTime/store/indexWmsTime.js";

export default {
    namespaced: true,
    getters,
    modules: {
        // modules must be copied, else tests fail in watch mode
        About: {...About},
        AddWMS: {...AddWMS},
        BaselayerSwitcher: {...BaselayerSwitcher},
        BufferAnalysis: {...BufferAnalysis},
        Contact: {...Contact},
        CoordToolkit: {...CoordToolkit},
        CompareMaps: {...CompareMaps},
        CompareFeatures: {...CompareFeatures},
        CopyrightConstraints: {...CopyrightConstraints},
        Draw: {...Draw},
        Draw_old: {...Draw_old},
        FeatureLister: {...FeatureLister},
        FileImport: {...FileImport},
        Filter: {...Filter},
        GetFeatureInfo: {...GetFeatureInfo},
        GraphicalSelect: {...GraphicalSelect},
        Language: {...Language},
        LayerClusterToggler: {...LayerClusterToggler},
        LayerInformation: {...LayerInformation},
        LayerPills: {...LayerPills},
        LayerPreview: {...LayerPreview},
        LayerSelection: {...LayerSelection},
        LayerSlider: {...LayerSlider},
        LayerSwiper: {...LayerSwiper},
        LayerTree: {...LayerTree},
        Legend: {...Legend},
        Login: {...Login},
        Measure: {...Measure},
        Modeler3D: {...Modeler3D},
        MouseHover: {...MouseHover},
        News: {...News},
        OpenConfig: {...OpenConfig},
        ResizeHandle: {...ResizeHandle},
        Routing: {...Routing},
        PortalFooter: {...PortalFooter},
        Print: {...Print},
        ScaleSwitcher: {...ScaleSwitcher},
        SearchBar: {...SearchBar},
        SelectFeatures: {...SelectFeatures},
        Shadow: {...Shadow},
        ShareView: {...ShareView},
        StatisticDashboard: {...StatisticDashboard},
        StyleVT: {...StyleVT},
        WfsSearch: {...WfsSearch},
        Wfst: {...Wfst},
        WmsTime: {...WmsTime}
    }
};
