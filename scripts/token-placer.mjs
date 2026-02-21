import { isTemplateActorId, findTemplateActor } from "./template-manager.mjs";
import { getRandomTokenImage } from "./image-picker.mjs";
import { showPlacementDialog } from "./placement-dialog.mjs";
import { getSetting } from "./settings.mjs";

const MODULE_ID = "shaak-loot-helper";

/**
 * Handle the dropCanvasData hook.
 * Returns false to prevent default handling when intercepting our template actor.
 */
export function handleCanvasDrop(canvas, data) {
  if (data.type !== "Actor") return;

  // Resolve actor ID from UUID or plain ID
  let actorId;
  if (data.uuid) {
    const parts = data.uuid.split(".");
    if (parts[0] !== "Actor") return;
    actorId = parts[1];
  } else if (data.id) {
    actorId = data.id;
  } else {
    return;
  }

  if (!isTemplateActorId(actorId)) return;

  // It IS our template — prevent default token creation
  const dropPosition = { x: data.x, y: data.y };
  const mode = getSetting("placementMode");

  if (mode === "dialog") {
    _handleDialogPlacement(dropPosition);
  } else {
    _handleSilentPlacement(dropPosition);
  }

  // Return false synchronously to block Foundry's default token drop
  return false;
}

/**
 * Silent placement: create actor with default name + random image, place token.
 */
async function _handleSilentPlacement(position) {
  try {
    const defaultName = getSetting("defaultContainerName") || "Container";
    const tokenImage = await getRandomTokenImage();
    await _createContainerAndPlaceToken(defaultName, tokenImage, position);
  } catch (err) {
    console.error(`${MODULE_ID} | Error during silent placement:`, err);
    ui.notifications.error("Shaak Loot Helper: Failed to place container. See console for details.");
  }
}

/**
 * Dialog placement: show dialog, then place on confirm.
 */
async function _handleDialogPlacement(position) {
  try {
    const defaultName = getSetting("defaultContainerName") || "Container";
    const tokenImage = await getRandomTokenImage();
    const result = await showPlacementDialog(defaultName, tokenImage);

    if (result === null) return; // User cancelled

    await _createContainerAndPlaceToken(result.name, result.image, position);
  } catch (err) {
    console.error(`${MODULE_ID} | Error during dialog placement:`, err);
    ui.notifications.error("Shaak Loot Helper: Failed to place container. See console for details.");
  }
}

/**
 * Create a new independent loot actor and place its token on the canvas.
 */
async function _createContainerAndPlaceToken(name, imagePath, position) {
  const newActor = await Actor.create({
    name: name,
    type: "loot",
    img: imagePath,
    system: {
      lootSheetType: "Loot",
      details: {
        description: "",
        level: { value: 0 }
      },
      hiddenWhenEmpty: false
    },
    prototypeToken: {
      name: name,
      texture: { src: imagePath },
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

  if (!newActor) {
    ui.notifications.error("Shaak Loot Helper: Failed to create actor!");
    return;
  }

  const tokenData = (await newActor.getTokenDocument({
    x: position.x,
    y: position.y,
    hidden: false
  })).toObject();

  await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);
  console.log(`${MODULE_ID} | Placed container "${name}" at (${position.x}, ${position.y})`);
}

/**
 * Standalone function for macro use:
 * Creates a new loot actor with random image and default name, opens its sheet.
 */
export async function createContainerActor() {
  const defaultName = getSetting("defaultContainerName") || "Container";
  const tokenImage = await getRandomTokenImage();

  const newActor = await Actor.create({
    name: defaultName,
    type: "loot",
    img: tokenImage,
    system: {
      lootSheetType: "Loot",
      details: {
        description: "",
        level: { value: 0 }
      },
      hiddenWhenEmpty: false
    },
    prototypeToken: {
      name: defaultName,
      texture: { src: tokenImage },
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
    ui.notifications.info(`Created new container: "${newActor.name}"`);
    newActor.sheet.render(true);
  }

  return newActor;
}
