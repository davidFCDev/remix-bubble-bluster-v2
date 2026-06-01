import GameSettings from "../config/GameSettings";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  init(): void {
    this.cameras.main.setBackgroundColor("#000000");
  }

  preload(): void {
    // --- Backgrounds y audio prioritario ---
    this.load.image("bg_start", GameSettings.assets.backgroundStart);
    this.load.image("bg_level_0", GameSettings.assets.backgroundsLevel[0]);
    // Usar URL directa (sin objeto { url, type }) para evitar fallos de
    // canPlayType en WebViews móviles estrictos.
    this.load.audio("bgm_0", GameSettings.assets.music[0]);

    // SFX
    Object.entries(GameSettings.assets.sfx).forEach(([key, url]) => {
      if (url && !url.includes("path/to/")) {
        this.load.audio(`sfx_${key}`, url);
      }
    });

    // Spritesheets de personajes
    GameSettings.characters.forEach((char: any) => {
      const frameWidth = char.frameConfig?.frameWidth || 32;
      const frameHeight = char.frameConfig?.frameHeight || 32;
      this.load.spritesheet(`${char.id}_idle`, char.spriteIdle, {
        frameWidth,
        frameHeight,
      });
    });
  }

  create(): void {
    // Aplicar filtro NEAREST a los sprites de personaje para pixel-art nítido
    GameSettings.characters.forEach((char: any) => {
      const tex = this.textures.get(`${char.id}_idle`);
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    });

    // Ir directo al selector de personaje
    this.scene.start("CharacterSelectScene");
  }
}

// Lazy load de backgrounds y música extra
export function loadExtraAssets(scene: Phaser.Scene): Promise<void> {
  return new Promise((resolve) => {
    let hasAssetsToLoad = false;
    for (let i = 1; i < GameSettings.assets.backgroundsLevel.length; i++) {
      if (!scene.textures.exists(`bg_level_${i}`)) {
        scene.load.image(
          `bg_level_${i}`,
          GameSettings.assets.backgroundsLevel[i],
        );
        hasAssetsToLoad = true;
      }
    }
    for (let i = 1; i < GameSettings.assets.music.length; i++) {
      if (!scene.cache.audio.exists(`bgm_${i}`)) {
        scene.load.audio(`bgm_${i}`, GameSettings.assets.music[i]);
        hasAssetsToLoad = true;
      }
    }
    if (!hasAssetsToLoad) {
      resolve();
      return;
    }
    scene.load.on("complete", () => resolve());
    scene.load.start();
  });
}
