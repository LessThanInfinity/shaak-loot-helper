const MODULE_ID = "shaak-loot-helper";
const TEMPLATE_FLAG = "isTemplate";

/**
 * Ensure the "Default Chest" template actor exists in the world.
 * Called on "ready" hook, only by the GM.
 */
export async function ensureTemplateActor() {
  let templateActor = findTemplateActor();

  if (templateActor) {
    console.log(`${MODULE_ID} | Template actor already exists: ${templateActor.name} (${templateActor.id})`);
    return templateActor;
  }

  console.log(`${MODULE_ID} | Creating template actor...`);
  templateActor = await Actor.create({
    name: "Default Chest (Template)",
    type: "loot",
    img: `modules/${MODULE_ID}/assets/tokens/chest-01.svg`,
    system: {
      lootSheetType: "Loot",
      details: {
        description: "<p>Drag this template onto a scene to create an independent loot container.</p>",
        level: { value: 0 }
      },
      hiddenWhenEmpty: false
    },
    prototypeToken: {
      name: "Container",
      texture: {
        src: `modules/${MODULE_ID}/assets/tokens/chest-01.svg`
      },
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
        [TEMPLATE_FLAG]: true
      }
    }
  });

  console.log(`${MODULE_ID} | Template actor created: ${templateActor.name} (${templateActor.id})`);
  return templateActor;
}

/**
 * Find the template actor by checking flags.
 */
export function findTemplateActor() {
  return game.actors.find(a => a.getFlag(MODULE_ID, TEMPLATE_FLAG) === true);
}

/**
 * Check if a given actor IS the template actor.
 */
export function isTemplateActor(actor) {
  if (!actor) return false;
  return actor.getFlag(MODULE_ID, TEMPLATE_FLAG) === true;
}

/**
 * Check if a given actor ID belongs to the template actor.
 */
export function isTemplateActorId(actorId) {
  const actor = game.actors.get(actorId);
  return isTemplateActor(actor);
}
