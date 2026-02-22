import { getRandomTokenImage } from "./image-picker.mjs";
import { showPlacementDialog } from "./placement-dialog.mjs";
import { getSetting } from "./settings.mjs";

const MODULE_ID = "shaak-loot-helper";

/**
 * Register hooks for folder-based container creation.
 * Call once from the main entry point (GM only).
 */
export function setupFolderControls() {
  // Inject chest button into folder headers when Actor Directory renders
  Hooks.on("renderActorDirectory", (app, html, data) => {
    if (!game.user.isGM) return;
    _addFolderButtons(html);
  });

  // Add "Create Loot Container" to folder right-click context menu
  Hooks.on("getActorDirectoryFolderContext", (html, contextOptions) => {
    if (!game.user.isGM) return;
    contextOptions.push({
      name: "SHAAK_LOOT.FolderContext.CreateContainer",
      icon: '<i class="fas fa-treasure-chest"></i>',
      condition: () => true,
      callback: (li) => {
        const folderId = li.dataset?.folderId ?? li.data?.("folderId");
        const folder = game.folders.get(folderId);
        if (folder) _createContainerInFolder(folder);
      }
    });
  });
}

/**
 * Inject a chest icon button into each folder header in the Actor Directory.
 */
function _addFolderButtons(html) {
  // html may be a jQuery object or raw element — normalize
  const root = html instanceof jQuery ? html[0] : html;
  const folders = root.querySelectorAll(".directory-item.folder");

  for (const folderEl of folders) {
    const folderId = folderEl.dataset.folderId ?? folderEl.dataset.documentId;
    if (!folderId) continue;

    const folder = game.folders.get(folderId);
    if (!folder || folder.type !== "Actor") continue;

    // Find the action buttons container (try common Foundry v13 selectors)
    const actionButtons = folderEl.querySelector(".folder-header .action-buttons")
      ?? folderEl.querySelector(".folder-header .header-actions")
      ?? folderEl.querySelector(".folder-header");
    if (!actionButtons) continue;

    // Don't add duplicate buttons
    if (actionButtons.querySelector(".shaak-loot-folder-btn")) continue;

    const button = document.createElement("button");
    button.className = "shaak-loot-folder-btn";
    button.type = "button";
    button.title = game.i18n.localize("SHAAK_LOOT.FolderButton.Tooltip");
    button.innerHTML = `
      <span class="shaak-loot-icon-stack">
        <i class="fas fa-treasure-chest"></i>
        <i class="fas fa-plus shaak-loot-plus"></i>
      </span>`;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      _createContainerInFolder(folder);
    });

    actionButtons.appendChild(button);
  }
}

/**
 * Create a loot container actor inside a specific folder.
 * Respects the placementMode setting for silent vs dialog.
 * Always opens the actor sheet after creation.
 */
async function _createContainerInFolder(folder) {
  try {
    const mode = getSetting("placementMode");
    const defaultName = getSetting("defaultContainerName") || "Container";
    const imagePath = await getRandomTokenImage();

    let name = defaultName;
    let image = imagePath;

    if (mode === "dialog") {
      const result = await showPlacementDialog(defaultName, imagePath, "create");
      if (!result) return; // Cancelled
      name = result.name;
      image = result.image;
    }

    const newActor = await Actor.create({
      name,
      type: "loot",
      img: image,
      folder: folder.id,
      system: {
        lootSheetType: "Loot",
        details: {
          description: "",
          level: { value: 0 }
        },
        hiddenWhenEmpty: false
      },
      prototypeToken: {
        name,
        texture: { src: image },
        actorLink: false,
        disposition: 0,
        displayName: 20,
        displayBars: 0,
        width: 1,
        height: 1,
        lockRotation: true
      },
      flags: {
        [MODULE_ID]: {
          isTemplate: false,
          createdByModule: true
        }
      }
    });

    if (newActor) {
      ui.notifications.info(`Created container "${newActor.name}" in "${folder.name}"`);
      newActor.sheet.render(true);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | Error creating container in folder:`, err);
    ui.notifications.error("Shaak Loot Helper: Failed to create container. See console for details.");
  }
}
