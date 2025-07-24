import { BaseExtension } from "./BaseExtension.js";
import { MultiLevelPanel } from "./MultiLevelPanel.js";

const Autodesk = window.Autodesk;

class MultiLevelExtension extends BaseExtension {
  constructor(viewer, options) {
    super(viewer, options);
    this._button = null;
    this._panel = null;
    this._levelsExtension = null;
    this._selectedLevels = new Set();
    this._originalVisibilityStates = new Map();
  }

  async load() {
    super.load();

    // Wait for LevelsExtension to be loaded
    this._levelsExtension = await this.viewer.getExtensionAsync(
      "Autodesk.AEC.LevelsExtension"
    );
    if (!this._levelsExtension) {
      console.warn(
        "MultiLevelExtension: LevelsExtension not found. Loading it..."
      );
      this._levelsExtension = await this.viewer.loadExtension(
        "Autodesk.AEC.LevelsExtension"
      );
    }

    // Add event listeners for better synchronization
    this.viewer.addEventListener(
      Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
      this.onObjectTreeCreated.bind(this)
    );
    this.viewer.addEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      this.onGeometryLoaded.bind(this)
    );

    console.log("MultiLevelExtension loaded.");
    return true;
  }

  unload() {
    super.unload();

    // Remove event listeners
    this.viewer.removeEventListener(
      Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
      this.onObjectTreeCreated.bind(this)
    );
    this.viewer.removeEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      this.onGeometryLoaded.bind(this)
    );

    if (this._button) {
      this.removeToolbarButton(this._button);
      this._button = null;
    }
    if (this._panel) {
      this._panel.setVisible(false);
      this._panel.uninitialize();
      this._panel = null;
    }
    // Restore original visibility states
    this.restoreOriginalVisibility();
    console.log("MultiLevelExtension unloaded.");
    return true;
  }

  onToolbarCreated() {
    this._panel = new MultiLevelPanel(
      this,
      "multi-level-panel",
      "Multi-Level Selection",
      { x: 10, y: 10, width: 300, height: 400 }
    );

    this._button = this.createToolbarButton(
      "multi-level-button",
      "https://img.icons8.com/small/32/floor-plan.png",
      "Show Multi-Level Selection"
    );

    this._button.onClick = () => {
      this._panel.setVisible(!this._panel.isVisible());
      this._button.setState(
        this._panel.isVisible()
          ? Autodesk.Viewing.UI.Button.State.ACTIVE
          : Autodesk.Viewing.UI.Button.State.INACTIVE
      );
      if (this._panel.isVisible() && this.viewer.model) {
        this.update();
      }
    };
  }

  onModelLoaded(model) {
    super.onModelLoaded(model);

    // Reset state when a new model is loaded
    this._selectedLevels.clear();
    this._originalVisibilityStates.clear();

    if (this._panel && this._panel.isVisible()) {
      // Wait a bit for the model to fully load before updating
      setTimeout(() => {
        this.update();
      }, 1000);
    }
  }

  onObjectTreeCreated() {
    console.log("MultiLevelExtension: Object tree created, updating levels");
    if (this._panel && this._panel.isVisible()) {
      setTimeout(() => {
        this.update();
      }, 500);
    }
  }

  onGeometryLoaded() {
    console.log(
      "MultiLevelExtension: Geometry loaded, refreshing if levels are selected"
    );
    if (this._selectedLevels.size > 0) {
      // Re-apply visibility to ensure geometry is properly displayed
      setTimeout(() => {
        this.applyMultiLevelVisibility();
      }, 100);
    }
  }

  async update() {
    if (!this._levelsExtension) {
      console.warn("MultiLevelExtension: LevelsExtension not available");
      return;
    }

    // Wait for AEC model data to be available
    let retries = 0;
    const maxRetries = 10;

    while (!this._levelsExtension.aecModelData && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries++;
    }

    if (!this._levelsExtension.aecModelData) {
      console.warn(
        "MultiLevelExtension: No AEC model data available after waiting"
      );
      if (this._panel) {
        this._panel.updateLevels([]);
      }
      return;
    }

    const levels = this.getLevels();
    if (this._panel) {
      this._panel.updateLevels(levels);
    }
  }

  getLevels() {
    if (!this._levelsExtension || !this._levelsExtension.aecModelData) {
      return [];
    }

    const aecData = this._levelsExtension.aecModelData;
    const levels = [];

    if (aecData.levels) {
      aecData.levels.forEach((level, index) => {
        levels.push({
          index: index,
          name: level.name || `Level ${index + 1}`,
          elevation: level.elevation || 0,
          height: level.height || 0,
          zMin: level.zMin,
          zMax: level.zMax,
          selected: this._selectedLevels.has(index),
        });
      });
    }

    return levels;
  }

  toggleLevel(levelIndex, selected) {
    console.log(
      `MultiLevelExtension: Toggling level ${levelIndex} to ${
        selected ? "selected" : "deselected"
      }`
    );

    if (selected) {
      this._selectedLevels.add(levelIndex);
    } else {
      this._selectedLevels.delete(levelIndex);
    }

    console.log(
      `MultiLevelExtension: Currently selected levels:`,
      Array.from(this._selectedLevels)
    );

    this.applyMultiLevelVisibility();

    // Update the panel to reflect the new selection state
    if (this._panel) {
      this._panel.updateLevels(this.getLevels());
    }
  }

  selectAllLevels() {
    const levels = this.getLevels();
    levels.forEach((level) => {
      this._selectedLevels.add(level.index);
    });
    this.applyMultiLevelVisibility();
    if (this._panel) {
      this._panel.updateLevels(this.getLevels());
    }
  }

  clearAllLevels() {
    this._selectedLevels.clear();
    this.restoreOriginalVisibility();
    if (this._panel) {
      this._panel.updateLevels(this.getLevels());
    }
  }

  applyMultiLevelVisibility() {
    if (!this._levelsExtension || !this._levelsExtension.aecModelData) {
      return;
    }

    // Store original visibility states if not already stored
    if (this._originalVisibilityStates.size === 0) {
      this.storeOriginalVisibility();
    }

    const model = this.viewer.model;
    if (!model) return;

    const aecData = this._levelsExtension.aecModelData;
    const selectedLevelIndices = Array.from(this._selectedLevels);

    if (selectedLevelIndices.length === 0) {
      // If no levels selected, restore original visibility
      this.restoreOriginalVisibility();
      return;
    }

    // Try to use the floor selector's approach first
    let visibleDbIds = new Set();
    let successfullyApplied = false;

    if (
      this._levelsExtension.floorSelector &&
      this._levelsExtension.floorSelector.floorData
    ) {
      selectedLevelIndices.forEach((levelIndex) => {
        const floorData = this._levelsExtension.floorSelector.floorData;
        if (floorData && floorData[levelIndex]) {
          const floor = floorData[levelIndex];
          if (floor.dbIds && floor.dbIds.length > 0) {
            floor.dbIds.forEach((dbId) => visibleDbIds.add(dbId));
          }
        }
      });
    }

    // Fallback to AEC data levels
    if (visibleDbIds.size === 0) {
      selectedLevelIndices.forEach((levelIndex) => {
        const level = aecData.levels[levelIndex];
        if (level && level.dbIds) {
          level.dbIds.forEach((dbId) => visibleDbIds.add(dbId));
        }
      });
    }

    // Apply visibility changes with proper refresh
    if (visibleDbIds.size > 0) {
      console.log(
        `MultiLevelExtension: Showing ${visibleDbIds.size} elements for levels:`,
        selectedLevelIndices
      );

      // Clear any existing cut planes first
      this.viewer.setCutPlanes([]);

      // Use isolation for better performance and visual clarity
      this.viewer.isolate(Array.from(visibleDbIds));

      // Force a refresh to ensure geometry is rendered
      this.viewer.impl.invalidate(true, true, true);

      successfullyApplied = true;
    } else {
      // Fallback: try original levels extension first, then Z-range filtering
      console.log(
        "MultiLevelExtension: No dbIds found, trying original levels extension first"
      );
      successfullyApplied =
        this.applyUsingOriginalLevelsExtension(selectedLevelIndices);

      if (!successfullyApplied) {
        console.log(
          "MultiLevelExtension: Original extension failed, trying Z-range filtering"
        );
        successfullyApplied = this.applyZRangeFiltering(selectedLevelIndices);
      }
    }

    // Trigger level changed event with multiple levels
    this.viewer.dispatchEvent({
      type: "multiLevelChanged",
      selectedLevels: selectedLevelIndices,
      visibleDbIds: Array.from(visibleDbIds),
    });
  }

  applyZRangeFiltering(levelIndices) {
    if (!this._levelsExtension || !this._levelsExtension.aecModelData) {
      return false;
    }

    const model = this.viewer.model;
    if (!model) return false;

    // Get combined Z-range for all selected levels
    let minZ = Infinity;
    let maxZ = -Infinity;

    levelIndices.forEach((levelIndex) => {
      const zRange = this._levelsExtension.getZRange(levelIndex);
      if (zRange) {
        minZ = Math.min(minZ, zRange.zMin);
        maxZ = Math.max(maxZ, zRange.zMax);
      }
    });

    if (minZ === Infinity || maxZ === -Infinity) {
      console.warn(
        "MultiLevelExtension: Could not determine Z-range for selected levels, showing all instead"
      );
      // Show everything if we can't determine range
      this.viewer.showAll();
      this.viewer.isolate([]);
      this.viewer.setCutPlanes([]);
      this.viewer.impl.invalidate(true, true, true);
      return true;
    }

    console.log(
      `MultiLevelExtension: Applying Z-range filtering: ${minZ} to ${maxZ}`
    );

    // Clear isolation first
    this.viewer.isolate([]);

    // Show all elements first
    this.viewer.showAll();

    // Add some padding to the Z-range to ensure we don't cut too close
    const padding = Math.abs(maxZ - minZ) * 0.1; // 10% padding
    const paddedMinZ = minZ - padding;
    const paddedMaxZ = maxZ + padding;

    console.log(
      `MultiLevelExtension: Using padded Z-range: ${paddedMinZ} to ${paddedMaxZ}`
    );

    // Apply cut planes to show only the selected Z-range
    // Note: The normal vector (0,0,1) points up, and the distance is negative
    const cutPlanes = [
      new window.THREE.Vector4(0, 0, 1, -paddedMinZ), // Bottom plane (cuts below minZ)
      new window.THREE.Vector4(0, 0, -1, paddedMaxZ), // Top plane (cuts above maxZ)
    ];

    this.viewer.setCutPlanes(cutPlanes);

    // Force a refresh to ensure geometry is rendered
    this.viewer.impl.invalidate(true, true, true);

    // Add a timeout to check if geometry is visible, if not, fall back to showing all
    setTimeout(() => {
      const visibleBounds = this.viewer.getVisibleBounds();
      if (!visibleBounds || visibleBounds.isEmpty()) {
        console.warn(
          "MultiLevelExtension: Cut planes resulted in empty bounds, showing all instead"
        );
        this.viewer.setCutPlanes([]);
        this.viewer.showAll();
        this.viewer.impl.invalidate(true, true, true);
      }
    }, 500);

    return true;
  }

  applyUsingOriginalLevelsExtension(selectedLevelIndices) {
    // Use the original LevelsExtension's floor selector approach
    if (!this._levelsExtension.floorSelector) {
      console.warn("MultiLevelExtension: No floor selector available");
      return false;
    }

    try {
      // For multiple levels, we'll apply each one sequentially
      if (selectedLevelIndices.length === 1) {
        // If only one level is selected, use the original extension directly
        console.log(
          `MultiLevelExtension: Using original extension for single level: ${selectedLevelIndices[0]}`
        );
        this._levelsExtension.floorSelector.selectFloor(
          selectedLevelIndices[0],
          false
        );

        // Check if the level selection worked
        setTimeout(() => {
          const visibleBounds = this.viewer.getVisibleBounds();
          if (!visibleBounds || visibleBounds.isEmpty()) {
            console.warn(
              "MultiLevelExtension: Original extension resulted in empty bounds"
            );
            this.viewer.showAll();
          }
        }, 200);

        return true;
      } else {
        // For multiple levels, combine their visibility
        console.log(
          `MultiLevelExtension: Using original extension for multiple levels: ${selectedLevelIndices}`
        );
        const floorSelector = this._levelsExtension.floorSelector;

        // Clear any existing state
        this.viewer.showAll();
        this.viewer.setCutPlanes([]);
        this.viewer.isolate([]);

        // Collect all dbIds for selected levels
        const allDbIds = new Set();
        let foundAnyDbIds = false;

        selectedLevelIndices.forEach((levelIndex) => {
          const floorData = floorSelector.floorData;
          if (
            floorData &&
            floorData[levelIndex] &&
            floorData[levelIndex].dbIds
          ) {
            floorData[levelIndex].dbIds.forEach((dbId) => allDbIds.add(dbId));
            foundAnyDbIds = true;
          }
        });

        if (foundAnyDbIds && allDbIds.size > 0) {
          console.log(
            `MultiLevelExtension: Found ${allDbIds.size} dbIds from original extension`
          );
          this.viewer.isolate(Array.from(allDbIds));
        } else {
          console.warn(
            "MultiLevelExtension: No dbIds found in original extension data"
          );
          return false;
        }

        // Force refresh
        this.viewer.impl.invalidate(true, true, true);
        return true;
      }
    } catch (error) {
      console.error(
        "MultiLevelExtension: Error in original levels extension approach:",
        error
      );
      return false;
    }
  }

  storeOriginalVisibility() {
    if (!this.viewer.model) return;

    const model = this.viewer.model;
    const instanceTree = model.getInstanceTree();

    if (instanceTree) {
      // Store the current visibility state of all nodes
      instanceTree.enumNodeChildren(
        instanceTree.getRootId(),
        (dbId) => {
          this._originalVisibilityStates.set(
            dbId,
            this.viewer.isNodeVisible(dbId)
          );
        },
        true
      );
    }
  }

  restoreOriginalVisibility() {
    // Clear any cut planes first
    this.viewer.setCutPlanes([]);

    // Clear any isolation
    this.viewer.isolate([]);

    if (this._originalVisibilityStates.size === 0) {
      // If no original states stored, just show all
      this.viewer.showAll();
    } else {
      // Restore original visibility states
      this._originalVisibilityStates.forEach((wasVisible, dbId) => {
        if (wasVisible) {
          this.viewer.show(dbId);
        } else {
          this.viewer.hide(dbId);
        }
      });
    }

    // Force a refresh to ensure geometry is rendered properly
    this.viewer.impl.invalidate(true, true, true);

    // Clear the stored states for next time
    this._originalVisibilityStates.clear();

    console.log("MultiLevelExtension: Original visibility restored");
  }

  getSelectedLevels() {
    return Array.from(this._selectedLevels);
  }

  setSelectedLevels(levelIndices) {
    this._selectedLevels.clear();
    levelIndices.forEach((index) => this._selectedLevels.add(index));
    this.applyMultiLevelVisibility();
    if (this._panel) {
      this._panel.updateLevels(this.getLevels());
    }
  }

  // Get level information by index
  getLevelInfo(levelIndex) {
    if (!this._levelsExtension || !this._levelsExtension.aecModelData) {
      return null;
    }

    const level = this._levelsExtension.aecModelData.levels[levelIndex];
    if (!level) return null;

    return {
      index: levelIndex,
      name: level.name || `Level ${levelIndex + 1}`,
      elevation: level.elevation || 0,
      height: level.height || 0,
      zMin: level.zMin,
      zMax: level.zMax,
      dbIds: level.dbIds || [],
    };
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  "MultiLevelExtension",
  MultiLevelExtension
);
