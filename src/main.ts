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

// ---------------------------------------------------------------------------
// AudioContext pre-creado y compartido con Phaser.
//
// PROBLEMA RAÍZ: en Phaser 3.90, AudioFile.onProcess() llama a
// context.decodeAudioData() DURANTE preload(). Si el AudioContext está
// "suspended" (siempre en mobile antes de un gesto), algunos WebViews
// rechazan la decodificación y el audio nunca entra en el caché → silencio
// total aunque los sonidos "existan".
//
// SOLUCIÓN: crear el AudioContext aquí (antes de Phaser) y pasarlo via
// audio.context para que Phaser lo reutilice. En el primer gesto del usuario
// lo reanudamos explícitamente y forzamos los flags internos de Phaser.
// ---------------------------------------------------------------------------
const AudioContextClass: typeof AudioContext =
  window.AudioContext || (window as any).webkitAudioContext;

let sharedAudioCtx: AudioContext | undefined;
try {
  if (AudioContextClass) {
    sharedAudioCtx = new AudioContextClass();
  }
} catch {}

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
  // Pasar el AudioContext pre-creado para que Phaser lo reutilice.
  // Así decodeAudioData() usa nuestro contexto que luego reanudamos
  // manualmente en el primer gesto del usuario.
  audio: sharedAudioCtx
    ? { context: sharedAudioCtx, noAudio: false, disableWebAudio: false }
    : {},
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

// Desbloquear AudioContext en el primer gesto del usuario (iOS/Android).
//
// CAUSA RAÍZ: AudioFile.onProcess() llama context.decodeAudioData() durante
// preload(). En algunos WebViews móviles, si el contexto está suspended en ese
// momento, la decodificación falla y el audio nunca entra al caché → silencio.
//
// SOLUCIÓN ROBUSTA:
//  1. sharedAudioCtx se pre-creó antes de Phaser y se pasó via audio.context.
//     Phaser reutiliza ese contexto para decodificar y reproducir.
//  2. En el primer gesto: reproducimos un buffer silencioso (activa iOS
//     sincrónicamente), llamamos resume(), y forzamos los flags de Phaser.
const unlockAudio = () => {
  // Reanudar nuestro AudioContext pre-creado (= game.sound.context)
  if (sharedAudioCtx) {
    try {
      const buf = sharedAudioCtx.createBuffer(1, 1, 22050);
      const src = sharedAudioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(sharedAudioCtx.destination);
      src.start(0); // activa el contexto sincrónicamente en iOS
    } catch {}
    sharedAudioCtx.resume().catch(() => {});
  }

  // Forzar los flags de Phaser sin esperar la Promise de resume()
  const sm = game.sound as any;
  if (sm) {
    sm.unlocked = true; // BaseSoundManager lo convierte en locked=false en el próximo tick
    sm.locked = false; // También directamente por si el game-loop aún no corrió
  }

  document.removeEventListener("touchstart", unlockAudio, true);
  document.removeEventListener("touchend", unlockAudio, true);
  document.removeEventListener("pointerdown", unlockAudio, true);
};
document.addEventListener("touchstart", unlockAudio, true);
document.addEventListener("touchend", unlockAudio, true);
document.addEventListener("pointerdown", unlockAudio, true);

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
