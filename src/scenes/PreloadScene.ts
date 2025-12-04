import * as Phaser from "phaser";
import GameSettings from "../config/GameSettings";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // Load background
    this.load.image("bg_start", GameSettings.assets.backgroundStart);
    GameSettings.assets.backgroundsLevel.forEach((bg, index) => {
      this.load.image(`bg_level_${index}`, bg);
    });

    // Load loader sprite (if needed for in-game usage, though it was for splash)
    this.load.spritesheet("loader", GameSettings.assets.loader, {
      frameWidth: 241,
      frameHeight: 345,
    });

    // Load character sprites
    GameSettings.characters.forEach((char) => {
      this.load.spritesheet(`${char.id}_idle`, char.spriteIdle, {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.spritesheet(`${char.id}_attack`, char.spriteAttack, {
        frameWidth: 32,
        frameHeight: 32,
      });
    });

    // Load music
    GameSettings.assets.music.forEach((track, index) => {
      // Force type to mp3 as the URL has query params and extension might be ambiguous
      this.load.audio(`bgm_${index}`, { url: track, type: "mp3" });
    });

    // Create a simple loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        color: "#ffffff",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      this.scene.start("StartScene");
    });
  }
}
