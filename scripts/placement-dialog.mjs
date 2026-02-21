const MODULE_ID = "shaak-loot-helper";

/**
 * Show a dialog allowing the user to edit the container name and pick an image
 * before placement. Uses DialogV2.
 *
 * @param {string} defaultName - Pre-populated container name
 * @param {string} defaultImage - Pre-populated image path
 * @returns {Promise<{name: string, image: string}|null>} User choices, or null if cancelled
 */
export async function showPlacementDialog(defaultName, defaultImage) {
  const content = `
    <div class="shaak-loot-placement-dialog">
      <div class="form-group">
        <label for="dlh-name">
          ${game.i18n.localize("SHAAK_LOOT.Dialog.NameLabel")}
        </label>
        <input type="text"
               name="containerName"
               id="dlh-name"
               value="${defaultName}"
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
                 value="${defaultImage}"
                 placeholder="path/to/image.webp" />
          <button type="button"
                  class="dlh-file-picker-btn"
                  data-target="dlh-image"
                  title="${game.i18n.localize("SHAAK_LOOT.Dialog.BrowseImage")}">
            <i class="fas fa-file-import"></i>
          </button>
        </div>
      </div>
      <div class="form-group">
        <img src="${defaultImage}"
             id="dlh-image-preview"
             alt="Token Preview" />
      </div>
    </div>
  `;

  const result = await foundry.applications.api.DialogV2.wait({
    window: {
      title: game.i18n.localize("SHAAK_LOOT.Dialog.Title")
    },
    content: content,
    buttons: [
      {
        action: "place",
        label: game.i18n.localize("SHAAK_LOOT.Dialog.PlaceButton"),
        icon: "fas fa-map-pin",
        default: true,
        callback: (event, button, dialog) => {
          const form = button.form;
          return {
            name: form.elements.containerName.value || defaultName,
            image: form.elements.containerImage.value || defaultImage
          };
        }
      },
      {
        action: "cancel",
        label: game.i18n.localize("SHAAK_LOOT.Dialog.CancelButton"),
        icon: "fas fa-times",
        callback: () => null
      }
    ],
    render: (event, html) => {
      const btn = html.querySelector(".dlh-file-picker-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          const targetInput = html.querySelector(`#${btn.dataset.target}`);
          const fp = new FilePicker({
            type: "image",
            current: targetInput.value,
            callback: (path) => {
              targetInput.value = path;
              const preview = html.querySelector("#dlh-image-preview");
              if (preview) preview.src = path;
            }
          });
          fp.render(true);
        });
      }
    },
    rejectClose: false,
    modal: true
  });

  return result;
}
