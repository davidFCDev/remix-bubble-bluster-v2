/**
 * Aspect Ratio detection utility for games designed at 2:3 (720×1080).
 *
 * On devices with taller screens (9:16, 9:19.5, etc.) the top of the viewport
 * may sit under a notch or status bar. This module exposes helpers so that
 * Phaser scenes can push their UI down when needed.
 *
 * See ASPECT-RATIO-GUIDE.md for full rationale.
 */

/** Tolerance used to decide whether a ratio is "close enough" to 2:3. */
const TOLERANCE = 0.02;
const BASE_RATIO = 2 / 3; // ≈ 0.6667

export interface AspectRatioInfo {
  /** Current viewport width / height. */
  ratio: number;
  /** `true` when the viewport is noticeably taller than 2:3. */
  isTall: boolean;
  /** Extra Y offset (px, in game-space) to apply to top-anchored UI elements. */
  topOffset: number;
}

/**
 * Analyse the given viewport dimensions and return positioning hints.
 *
 * @param viewportWidth  – real CSS-pixel width  (e.g. `window.innerWidth`)
 * @param viewportHeight – real CSS-pixel height (e.g. `window.innerHeight`)
 * @param gameHeight     – the base game height (default 1080)
 */
export function getAspectRatioInfo(
  viewportWidth: number,
  viewportHeight: number,
  gameHeight = 1080,
): AspectRatioInfo {
  const ratio = viewportWidth / viewportHeight;
  const is2by3 = Math.abs(ratio - BASE_RATIO) < TOLERANCE;
  const isTall = !is2by3 && ratio < BASE_RATIO;

  // On tall screens we add extra top padding (scaled to game-space).
  // 50 px in a 1080-tall game ≈ ~4.6 % of height.
  const topOffset = isTall ? 50 : 0;

  return { ratio, isTall, topOffset };
}

/**
 * Convenience: read the current viewport and return info.
 * Uses visualViewport API for accurate mobile dimensions.
 */
export function getCurrentAspectRatioInfo(
  gameHeight?: number,
): AspectRatioInfo {
  const vv = window.visualViewport;
  const w = vv ? vv.width : window.innerWidth;
  const h = vv ? vv.height : window.innerHeight;
  return getAspectRatioInfo(w, h, gameHeight);
}
