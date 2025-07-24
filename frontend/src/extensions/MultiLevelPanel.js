const Autodesk = window.Autodesk;

export class MultiLevelPanel extends Autodesk.Viewing.UI.DockingPanel {
  constructor(extension, id, title, options) {
    super(extension.viewer.container, id, title, options);
    this.extension = extension;
    this.container.style.left = (options.x || 0) + "px";
    this.container.style.top = (options.y || 0) + "px";
    this.container.style.width = (options.width || 300) + "px";
    this.container.style.height = (options.height || 400) + "px";
    this.container.style.resize = "both";
    this.levels = [];
  }

  initialize() {
    this.title = this.createTitleBar(this.titleLabel || this.container.id);
    this.initializeMoveHandlers(this.title);
    this.container.appendChild(this.title);

    this.content = document.createElement("div");
    this.content.style.height = "350px";
    this.content.style.backgroundColor = "white";
    this.content.style.padding = "10px";
    this.content.style.overflow = "auto";
    this.content.innerHTML = this.createPanelHTML();
    this.container.appendChild(this.content);

    this.setupEventHandlers();
  }

  createPanelHTML() {
    return `
      <style>
        .multi-level-controls .action-btn:hover {
          opacity: 0.8 !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .multi-level-controls .level-item:hover {
          background: #f3f2f1 !important;
          transform: translateX(2px);
          transition: all 0.2s ease;
        }
        
        .multi-level-controls .level-item.selected {
          background: #e6f3ff !important;
          border-color: #0078d4 !important;
        }
        
        .multi-level-controls .levels-list {
          max-height: 250px;
          overflow-y: auto;
        }
        
        .multi-level-controls .levels-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .multi-level-controls .levels-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .multi-level-controls .levels-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .multi-level-controls .levels-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      </style>
      
      <div class="multi-level-controls">
        <div class="level-actions" style="margin-bottom: 15px; display: flex; gap: 10px;">
          <button id="select-all-levels" class="action-btn" style="flex: 1; padding: 8px; background: #0078d4; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
            Select All
          </button>
          <button id="clear-all-levels" class="action-btn" style="flex: 1; padding: 8px; background: #d83b01; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
            Clear All
          </button>
        </div>
        
        <div class="level-info" style="margin-bottom: 15px; padding: 10px; background: #f3f2f1; border-radius: 3px; font-size: 12px;">
          <div id="selected-count" style="margin-bottom: 4px; font-weight: bold;">Selected: 0 levels</div>
          <div id="total-count">Total: 0 levels</div>
        </div>

        <div class="levels-container">
          <div id="levels-list" class="levels-list">
            <div class="no-levels" style="text-align: center; color: #666; padding: 20px;">
              No levels found. Load an AEC model with level information.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventHandlers() {
    const selectAllBtn = this.content.querySelector("#select-all-levels");
    const clearAllBtn = this.content.querySelector("#clear-all-levels");

    selectAllBtn.addEventListener("click", () => {
      this.extension.selectAllLevels();
    });

    clearAllBtn.addEventListener("click", () => {
      this.extension.clearAllLevels();
    });

    // Add hover effects for buttons
    [selectAllBtn, clearAllBtn].forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        btn.style.opacity = "0.8";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.opacity = "1";
      });
    });
  }

  updateLevels(levels) {
    this.levels = levels;
    this.renderLevels();
    this.updateInfo();
  }

  renderLevels() {
    const levelsList = this.content.querySelector("#levels-list");

    if (!this.levels || this.levels.length === 0) {
      levelsList.innerHTML = `
        <div class="no-levels" style="text-align: center; color: #666; padding: 20px;">
          No levels found. Load an AEC model with level information.
        </div>
      `;
      return;
    }

    const levelsHTML = this.levels
      .map((level) => this.createLevelHTML(level))
      .join("");
    levelsList.innerHTML = levelsHTML;

    // Add event handlers for checkboxes
    this.levels.forEach((level) => {
      const checkbox = levelsList.querySelector(`#level-${level.index}`);
      if (checkbox) {
        // Remove any existing listeners first (in case of re-render)
        checkbox.replaceWith(checkbox.cloneNode(true));
        const newCheckbox = levelsList.querySelector(`#level-${level.index}`);

        newCheckbox.addEventListener("change", (e) => {
          this.extension.toggleLevel(level.index, e.target.checked);
        });
      }

      // Add click handler for level item (excluding checkbox)
      const levelItem = levelsList.querySelector(`#level-item-${level.index}`);
      if (levelItem) {
        levelItem.addEventListener("click", (e) => {
          // Don't trigger if clicking on checkbox
          if (e.target.type !== "checkbox") {
            const checkbox = levelItem.querySelector(`#level-${level.index}`);
            if (checkbox) {
              checkbox.checked = !checkbox.checked;
              checkbox.dispatchEvent(new Event("change"));
            }
          }
        });
      }
    });
  }

  createLevelHTML(level) {
    const elevationText =
      level.elevation !== undefined ? `${level.elevation.toFixed(2)}` : "N/A";
    const heightText =
      level.height !== undefined ? `${level.height.toFixed(2)}` : "N/A";

    return `
      <div id="level-item-${level.index}" class="level-item ${
      level.selected ? "selected" : ""
    }" style="
        display: flex; 
        align-items: center; 
        padding: 10px; 
        margin: 5px 0; 
        border: 1px solid #edebe9; 
        border-radius: 3px; 
        cursor: pointer;
        background: ${level.selected ? "#e6f3ff" : "#ffffff"};
        transition: all 0.2s ease;
      ">
        <input 
          type="checkbox" 
          id="level-${level.index}" 
          ${level.selected ? "checked" : ""} 
          style="margin-right: 10px; cursor: pointer; transform: scale(1.1);"
        />
        <div class="level-details" style="flex: 1;">
          <div class="level-name" style="font-weight: bold; margin-bottom: 4px; color: #323130;">
            ${level.name}
          </div>
          <div class="level-info" style="font-size: 11px; color: #666;">
            <div style="margin-bottom: 2px;">📏 Elevation: ${elevationText}</div>
            <div>📐 Height: ${heightText}</div>
          </div>
        </div>
        <div class="level-index" style="
          background: ${level.selected ? "#0078d4" : "#f3f2f1"}; 
          color: ${level.selected ? "white" : "#666"};
          padding: 4px 8px; 
          border-radius: 12px; 
          font-size: 11px; 
          font-weight: bold;
          min-width: 24px;
          text-align: center;
        ">
          ${level.index}
        </div>
      </div>
    `;
  }

  updateInfo() {
    const selectedCount = this.levels.filter((level) => level.selected).length;
    const totalCount = this.levels.length;

    const selectedCountEl = this.content.querySelector("#selected-count");
    const totalCountEl = this.content.querySelector("#total-count");

    if (selectedCountEl) {
      selectedCountEl.textContent = `Selected: ${selectedCount} levels`;
    }
    if (totalCountEl) {
      totalCountEl.textContent = `Total: ${totalCount} levels`;
    }
  }

  uninitialize() {
    // Clean up any event listeners if needed
    if (this.content) {
      this.content.innerHTML = "";
    }
  }
}
