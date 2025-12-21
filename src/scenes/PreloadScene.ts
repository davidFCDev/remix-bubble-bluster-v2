import GameSettings from "../config/GameSettings";

export class PreloadScene extends Phaser.Scene {
  private assetsLoaded: boolean = false;
  private fontsLoaded: boolean = false;
  private animationComplete: boolean = false;
  private bootSprite!: Phaser.GameObjects.Sprite;

  constructor() {
    super({ key: "PreloadScene" });
  }

  init(): void {
    this.cameras.main.setBackgroundColor("#000000");
  }

  preload(): void {
    // SOLO el sprite aquí (es pequeño, carga rápido)
    this.load.spritesheet(
      "bootSprite",
      "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/sprite-start-oVCq0bchsVLwbLqAPbLgVOrQqxcVh5.webp?Cbzd",
      { frameWidth: 241, frameHeight: 345 }
    );
  }

  create(): void {
    // Crear animación
    const frames = this.anims.generateFrameNumbers("bootSprite", {
      start: 0,
      end: 17, // 18 frames - 1
    });

    // Hacer que el último frame dure más (ej. 500ms) para mejor efecto visual
    if (frames.length > 0) {
      frames[frames.length - 1].duration = 500;
    }

    this.anims.create({
      key: "boot",
      frames: frames,
      frameRate: 12,
      repeat: 0, // Una sola vez, se queda en último frame
    });

    // Mostrar sprite centrado
    const { width, height } = this.scale;
    this.bootSprite = this.add.sprite(width / 2, height / 2, "bootSprite");
    const scale = Math.min(width / 300, height / 400, 1.5);
    this.bootSprite.setScale(scale);
    this.bootSprite.play("boot");

    // Cuando termine la animación
    this.bootSprite.on("animationcomplete", () => {
      this.animationComplete = true;
      this.checkTransition();
    });

    // Cargar el resto de assets prioritarios
    this.loadRemainingAssets();
  }

  private loadRemainingAssets(): void {
    // WebFont loader para fuentes
    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );

    // Iniciar carga de fuentes cuando el script esté listo
    this.load.on("filecomplete-script-webfont", () => {
      // @ts-ignore
      if (window.WebFont) {
        // @ts-ignore
        window.WebFont.load({
          google: {
            families: ["Pixelify Sans"],
          },
          active: () => {
            console.log("Fonts loaded");
            this.fontsLoaded = true;
            this.checkTransition();
          },
          inactive: () => {
            console.warn("Fonts failed to load");
            this.fontsLoaded = true; // Continuar aunque falle
            this.checkTransition();
          },
        });
      }
    });

    // --- ASSETS PRIORITARIOS ---
    this.load.image("bg_start", GameSettings.assets.backgroundStart);
    this.load.image("bg_level_0", GameSettings.assets.backgroundsLevel[0]);
    this.load.audio("bgm_0", {
      url: GameSettings.assets.music[0],
      type: "mp3",
    });

    // SFX
    Object.entries(GameSettings.assets.sfx).forEach(([key, url]) => {
      if (url && !url.includes("path/to/")) {
        this.load.audio(`sfx_${key}`, { url: url, type: "mp3" });
      }
    });

    // Personajes
    GameSettings.characters.forEach((char: any) => {
      const frameWidth = char.frameConfig?.frameWidth || 32;
      const frameHeight = char.frameConfig?.frameHeight || 32;
      this.load.spritesheet(`${char.id}_idle`, char.spriteIdle, {
        frameWidth: frameWidth,
        frameHeight: frameHeight,
      });
    });

    this.load.on("complete", () => {
      GameSettings.characters.forEach((char: any) => {
        const idleTexture = this.textures.get(`${char.id}_idle`);
        if (idleTexture)
          idleTexture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      });
      this.assetsLoaded = true;
      this.checkTransition();
    });
    this.load.start();
  }

  private checkTransition(): void {
    // Aseguramos que:
    // 1. La animación de carga terminó
    // 2. Todos los assets de la cola de Phaser cargaron (incluye sfx_button)
    // 3. Las fuentes web cargaron
    if (this.animationComplete && this.assetsLoaded && this.fontsLoaded) {
      // Verificación extra de seguridad
      if (!this.cache.audio.exists("sfx_button")) {
        console.warn("sfx_button missing, but proceeding");
      }
      this.scene.start("StartScene");
    }
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
          GameSettings.assets.backgroundsLevel[i]
        );
        hasAssetsToLoad = true;
      }
    }
    for (let i = 1; i < GameSettings.assets.music.length; i++) {
      if (!scene.cache.audio.exists(`bgm_${i}`)) {
        scene.load.audio(`bgm_${i}`, {
          url: GameSettings.assets.music[i],
          type: "mp3",
        });
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
