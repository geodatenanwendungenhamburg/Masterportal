<script>
import NavTab from "../../../../shared/modules/tabs/components/NavTab.vue";

export default {
    name: "LeftSidebar",
    components: {
        NavTab
    },
    data () {
        return {
            treeviewHierarchyType: "containment"
        };
    },
    methods: {
        setTreeviewHierarchyType (hierarchyType) {
            this.$store.dispatch("Modules/BimViewer/updateXeokitPluginTreeViewHierarchyType", hierarchyType);

            this.treeviewHierarchyType = hierarchyType;
        }
    }
};
</script>

<template>
    <div class="LeftSidebar">
        <ul
            class="nav nav-tabs nav-justified"
            role="tablist"
        >
            <NavTab
                :id="'treeview-containment-tab'"
                :active="treeviewHierarchyType === 'containment'"
                :target="'#treeview-containment-pane'"
                :label="'modules.bimViewer.tools.treeviewHierarchyTypeContainment'"
                :interaction="() => setTreeviewHierarchyType('containment')"
            />

            <NavTab
                :id="'treeview-storeys-tab'"
                :active="treeviewHierarchyType === 'storeys'"
                :target="'#treeview-storeys-pane'"
                :label="'modules.bimViewer.tools.treeviewHierarchyTypeStoreys'"
                :interaction="() => setTreeviewHierarchyType('storeys')"
            />

            <NavTab
                :id="'treeview-types-tab'"
                :active="treeviewHierarchyType === 'types'"
                :target="'#treeview-types-pane'"
                :label="'modules.bimViewer.tools.treeviewHierarchyTypeTypes'"
                :interaction="() => setTreeviewHierarchyType('types')"
            />
        </ul>

        <slot :data="{treeviewHierarchyType}" />
    </div>
</template>

<style lang="scss">
div.LeftSidebar {
  display: flex;
  flex-direction: column;
  flex: 0.5;
  padding: 0 1rem 0 0;
  box-shadow: 0.1875rem 0.1875rem 1rem #00000050;

  div.treeViewContainer {
    height: 100%;
    pointer-events: all;
    overflow: auto;
    color: black;
    margin: 1rem 0 0 0.5rem;
    max-width: 300px;

    ul {
      list-style: none;
      padding-left: 0.75em;
      pointer-events: none;

      &:first-child {
        padding-left: 1.5rem;
      }

      li {
        position: relative;
        width: 100%;
        pointer-events: none;
        padding: 3px 0;
        vertical-align: middle;

        &.xrayed-node {
          > span {
            color: #AAA;
          }
        }

        &.highlighted-node {
          > span {
            font-weight: bold;
          }
        }

        a {
          background-color: #eee;
          border-radius: 50%;
          color: #000;
          display: inline-block;
          height: 1.5em;
          left: -1.5em;
          position: absolute;
          text-align: center;
          text-decoration: none;
          width: 1.5em;
          pointer-events: all;

          &.plus {
            background-color: #ded;
            pointer-events: all;
          }

          &.minus {
            background-color: #eee;
            pointer-events: all;
          }

          &:active {
            top: 1px;
            pointer-events: all;
          }
        }

        span {
          display: inline;
          padding-left: 2px;
          pointer-events: all;
          height: 23px;

          &:hover {
            background-color: #FFF;
            cursor: pointer;
            padding-left: 2px;
            pointer-events: all;
          }
        }
      }
    }
  }
}
</style>
