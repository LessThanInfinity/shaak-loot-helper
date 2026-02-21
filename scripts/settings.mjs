const MODULE_ID = "shaak-loot-helper";

export function registerSettings() {
  game.settings.register(MODULE_ID, "defaultContainerName", {
    name: "SHAAK_LOOT.Settings.DefaultName.Name",
    hint: "SHAAK_LOOT.Settings.DefaultName.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "Container"
  });

  game.settings.register(MODULE_ID, "tokenImageFolder", {
    name: "SHAAK_LOOT.Settings.ImageFolder.Name",
    hint: "SHAAK_LOOT.Settings.ImageFolder.Hint",
    scope: "world",
    config: true,
    type: String,
    default: ""
  });

  game.settings.register(MODULE_ID, "placementMode", {
    name: "SHAAK_LOOT.Settings.PlacementMode.Name",
    hint: "SHAAK_LOOT.Settings.PlacementMode.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      silent: "SHAAK_LOOT.Settings.PlacementMode.Silent",
      dialog: "SHAAK_LOOT.Settings.PlacementMode.Dialog"
    },
    default: "silent"
  });
}

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}
