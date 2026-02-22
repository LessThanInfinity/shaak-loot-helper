const MODULE_ID = "shaak-loot-helper";

/**
 * Floating, draggable application for customizing a loot container before placement.
 * Uses ApplicationV2 (not DialogV2) so we get a proper framed window with drag support.
 */
class PlacementApplication extends foundry.applications.api.ApplicationV2 {
  constructor(defaultName, defaultImage, resolve, mode = "place") {
    super();
    this._defaultName = defaultName;
    this._defaultImage = defaultImage;
    this._resolve = resolve;
    this._submitted = false;
    this._mode = mode;
  }

  static DEFAULT_OPTIONS = {
    id: "shaak-loot-placement",
    tag: "form",
    window: {
      title: "SHAAK_LOOT.Dialog.Title",
      resizable: false,
    },
    position: {
      width: 420,
    },
    form: {
      handler: PlacementApplication._handleSubmit,
      closeOnSubmit: true,
    },
  };

  get title() {
    return this._mode === "create"
      ? game.i18n.localize("SHAAK_LOOT.Dialog.CreateTitle")
      : game.i18n.localize("SHAAK_LOOT.Dialog.Title");
  }

  async _prepareContext(options) {
    return {
      defaultName: this._defaultName,
      defaultImage: this._defaultImage,
      mode: this._mode,
    };
  }

  async _renderHTML(context, options) {
    const div = document.createElement("div");
    div.className = "shaak-loot-placement-dialog";
    div.innerHTML = `
      <div class="form-group">
        <label for="dlh-name">
          ${game.i18n.localize("SHAAK_LOOT.Dialog.NameLabel")}
        </label>
        <input type="text"
               name="containerName"
               id="dlh-name"
               value="${foundry.utils.escapeHTML(context.defaultName)}"
               autofocus
               placeholder="${game.i18n.localize("SHAAK_LOOT.Dialog.NamePlaceholder")}" />
      </div>
      <div class="form-group">
        <label for="dlh-image">
          ${game.i18n.localize("SHAAK_LOOT.Dialog.ImageLabel")}
        </label>
        <div class="form-fields">
          <input type="text"
                 name="containerImage"
                 id="dlh-image"
                 value="${foundry.utils.escapeHTML(context.defaultImage)}"
                 placeholder="path/to/image.webp" />
          <button type="button"
                  class="dlh-file-picker-btn"
                  title="${game.i18n.localize("SHAAK_LOOT.Dialog.BrowseImage")}">
            <i class="fas fa-file-import"></i>
          </button>
        </div>
      </div>
      <div class="form-group">
        <img src="${foundry.utils.escapeHTML(context.defaultImage)}"
             id="dlh-image-preview"
             alt="Token Preview" />
      </div>
      <footer class="dlh-footer">
        <button type="submit">
          <i class="fas ${context.mode === "create" ? "fa-plus" : "fa-map-pin"}"></i>
          ${game.i18n.localize(context.mode === "create" ? "SHAAK_LOOT.Dialog.CreateButton" : "SHAAK_LOOT.Dialog.PlaceButton")}
        </button>
        <button type="button" class="dlh-cancel-btn">
          <i class="fas fa-times"></i>
          ${game.i18n.localize("SHAAK_LOOT.Dialog.CancelButton")}
        </button>
      </footer>
    `;
    return div;
  }

  /** @override - signature is (result, content, options) per ApplicationV2 docs */
  _replaceHTML(result, content, options) {
    content.replaceChildren(result);
  }

  _onRender(context, options) {
    this.element.querySelector(".dlh-file-picker-btn")?.addEventListener("click", () => {
      const imageInput = this.element.querySelector("#dlh-image");
      new FilePicker({
        type: "image",
        current: imageInput?.value ?? "",
        callback: (path) => {
          if (imageInput) imageInput.value = path;
          const preview = this.element.querySelector("#dlh-image-preview");
          if (preview) preview.src = path;
        },
      }).render(true);
    });

    this.element.querySelector(".dlh-cancel-btn")?.addEventListener("click", () => {
      this.close();
    });
  }

  static async _handleSubmit(event, form, formData) {
    this._submitted = true;
    const { containerName, containerImage } = formData.object;
    this._resolve?.({
      name: containerName || this._defaultName,
      image: containerImage || this._defaultImage,
    });
    this._resolve = null;
  }

  async close(options) {
    if (!this._submitted) {
      this._resolve?.(null);
      this._resolve = null;
    }
    return super.close(options);
  }
}

/**
 * Show a floating dialog allowing the user to edit the container name and pick an image
 * before placement.
 *
 * @param {string} defaultName - Pre-populated container name
 * @param {string} defaultImage - Pre-populated image path
 * @param {"place"|"create"} [mode="place"] - Controls dialog title and button labels
 * @returns {Promise<{name: string, image: string}|null>} User choices, or null if cancelled
 */
export async function showPlacementDialog(defaultName, defaultImage, mode = "place") {
  return new Promise((resolve) => {
    new PlacementApplication(defaultName, defaultImage, resolve, mode).render(true);
  });
}
