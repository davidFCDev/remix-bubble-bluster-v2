import GameSettings from "./config/GameSettings";
import { BubbleStyleScene } from "./scenes/BubbleStyleScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GameScene } from "./scenes/GameScene";
import { PowerupsScene } from "./scenes/PowerupsScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { StartScene } from "./scenes/StartScene";
import { getCurrentAspectRatioInfo } from "./utils/AspectRatio";

// --- Dynamic height: keep width=720, adjust height to fill viewport ---
const GAME_WIDTH = GameSettings.canvas.width; // 720

// Use visualViewport for accurate mobile dimensions (excludes browser chrome)
function getViewportSize() {
  const vv = window.visualViewport;
  return {
    width: vv ? vv.width : window.innerWidth,
    height: vv ? vv.height : window.innerHeight,
  };
}

const viewport = getViewportSize();
const viewportRatio = viewport.width / viewport.height;
// On tall screens -> taller canvas; on wide screens -> clamp to base 1080
const GAME_HEIGHT = Math.max(
  GameSettings.canvas.height, // never shorter than 1080
  Math.round(GAME_WIDTH / viewportRatio),
);

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: document.body,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
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

// --- Aspect Ratio detection (see ASPECT-RATIO-GUIDE.md) ---
function updateAspectRatioInfo() {
  const info = getCurrentAspectRatioInfo(GAME_HEIGHT);
  game.registry.set("aspectRatio", info.ratio);
  game.registry.set("isTallScreen", info.isTall);
  game.registry.set("topOffset", info.topOffset);
}

// Run on init + every resize
updateAspectRatioInfo();
window.addEventListener("resize", updateAspectRatioInfo);

// Initialize Remix SDK after game is created
game.events.once("ready", () => {
  // RemixSDK: listen for play_again to restart the game
  if (window.RemixSDK) {
    window.RemixSDK.onPlayAgain(() => {
      const activeScene = game.scene.getScenes(true)[0];
      if (activeScene) {
        activeScene.scene.start("CharacterSelectScene");
      }
    });

    // RemixSDK: handle mute toggle from platform
    window.RemixSDK.onToggleMute((data) => {
      game.sound.mute = data.isMuted;
    });
  }
});
