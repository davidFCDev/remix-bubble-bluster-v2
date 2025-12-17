import { initRemix } from "@insidethesim/remix-dev";
import GameSettings from "./config/GameSettings";
import { BubbleStyleScene } from "./scenes/BubbleStyleScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GameScene } from "./scenes/GameScene";
import { PowerupsScene } from "./scenes/PowerupsScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { StartScene } from "./scenes/StartScene";

// SDK mock is automatically initialized by the framework (dev-init.ts)

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GameSettings.canvas.width,
  height: GameSettings.canvas.height,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: document.body,
    width: GameSettings.canvas.width,
    height: GameSettings.canvas.height,
  },
  backgroundColor: "#1a1a1a",
  scene: [
    PreloadScene,
    StartScene,
    BubbleStyleScene,
    PowerupsScene,
    CharacterSelectScene,
    GameScene,
  ],
  physics: {
    default: "arcade",
  },
  fps: {
    target: 60,
  },
  pixelArt: false,
  antialias: true,
};

// Create the game instance
const game = new Phaser.Game(config);

// Store globally for performance monitoring and HMR cleanup
(window as any).game = game;

// SDK: Handle play again requests globally
if (window.FarcadeSDK) {
  window.FarcadeSDK.on("play_again", () => {
    // Restart the game from the beginning
    game.scene.stop("GameScene");
    game.scene.stop("CharacterSelectScene");
    game.scene.start("StartScene");
  });
}

// Initialize Remix framework after game is created
game.events.once("ready", () => {
  initRemix(game, {
    multiplayer: false,
  });
});
