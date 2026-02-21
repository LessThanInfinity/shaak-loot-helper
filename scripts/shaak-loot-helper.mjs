import { registerSettings } from "./settings.mjs";
import { ensureTemplateActor } from "./template-manager.mjs";
import { handleCanvasDrop } from "./token-placer.mjs";
import { getDefaultChestIcon } from "./image-picker.mjs";

const MODULE_ID = "shaak-loot-helper";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Shaak's Loot Helper`);
  registerSettings();
});

Hooks.once("ready", async () => {
  console.log(`${MODULE_ID} | Ready`);

  if (game.user.isGM) {
    await ensureTemplateActor();
    await _ensureMacroExists();
  }
});

Hooks.on("dropCanvasData", (canvas, data) => {
  return handleCanvasDrop(canvas, data);
});

/**
 * Ensure the "Create Loot Container" macro exists in the world.
 * Identified by flag to prevent duplicates.
 */
async function _ensureMacroExists() {
  const existingMacro = game.macros.find(m =>
    m.getFlag(MODULE_ID, "isModuleMacro") === true
  );
  if (existingMacro) return;

  const chestIcon = await getDefaultChestIcon();

  const macroCommand = `// Shaak's Loot Helper - Create Container Macro
const module = game.modules.get("shaak-loot-helper");
if (!module?.active) {
  ui.notifications.warn("Shaak's Loot Helper module is not active!");
  return;
}
const { createContainerActor } = await import(
  "modules/shaak-loot-helper/scripts/token-placer.mjs"
);
await createContainerActor();`;

  await Macro.create({
    name: "Create Loot Container",
    type: "script",
    img: chestIcon,
    command: macroCommand,
    flags: {
      [MODULE_ID]: {
        isModuleMacro: true
      }
    }
  });

  ui.notifications.info("Shaak's Loot Helper: Created 'Create Loot Container' macro.");
}
