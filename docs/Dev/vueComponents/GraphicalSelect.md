# The GraphicalSelect Component #
Creates a dropdown to select an area in a map by square, circle, polygon, or line with buffer.
Source folder: src\shared\modules\graphicalSelect

Component may be used like this:

```
<script>

import GraphicalSelect from "src/shared/modules/graphicalSelect/components/GraphicalSelect.vue";

// [...]

export default {
    name: "MyComponent",
    components: {
        GraphicalSelect
    },
    methods: {
        /**
         * Resets the GraphicalSelect.
         * @returns {void}
         */
        resetView: function () {
            this.$refs.graphicalSelection.resetView();
        },
    }
};
</script>

<template>
    <div>
        <GraphicalSelect
            ref="graphicalSelection"
            :label="howToChooseTiles"
            :bufferDistance="50"
        />
    </div>
</template>

<style lang="scss">


#tooltip-overlay {
    position: relative;
    background: $accent_active;
    color: $white;
    max-width: 200px;
    padding: 4px 8px;
}

#circle-overlay {
    position: relative;
    top: -20px;
    background: $accent_active;
    color: $white;
    max-width: 70px;
    padding: 4px 8px;
}
</style>

```

## Properties of Component ##
|Name|Required|Type|Default|Description|
|----|--------|----|-------|-----------|
|selectElement|no|String|"Dropdown"|The used template element for graphical selection.|
|selectedOption|no|String|"Box"|Preselected draw modus.|
|focusOnCreation|no|Boolean||True if focus should be set to this component when it is created.|
|label|yes|String|""|The label of the select.|
|description|no|String|""|The description over the select element.|
|bufferDistance|no|Number|50|The default buffer distance in meters for line selections.|

## Draw Options ##
The component supports different drawing options:
- Box - Draw a rectangular area
- Circle - Draw a circular area
- Polygon - Draw a polygon area
- Line - Draw a line with buffer zone

## Line Drawing with Buffer ##
When the "Line" option is selected, the component allows:
1. Drawing a line on the map
2. Creating a buffer zone around the line
3. Adjusting the buffer distance using a slider that appears after drawing the line
4. The buffer updates interactively as the slider is moved

## Actions ##
GraphicalSelect provides following actions:
updateDrawInteractionListener, featureToGeoJson, showTooltipOverlay, toggleOverlay, createDomOverlay

## Events ##
|Event|Description|
|-----|-----------|
|onDrawEnd|Triggered when drawing is completed (for polygons, circles, boxes) or when buffer is finalized (for lines). The event contains the selected area GeoJSON.|
