/**
 * Global type declarations for externally loaded libraries
 */

// Phaser is loaded globally via CDN
declare const Phaser: typeof import("phaser");

/**
 * RemixSDK is loaded via CDN (@remix-gg/sdk).
 * We declare the subset of the API that the game uses.
 */
interface RemixSDKInstance {
  singlePlayer: {
    actions: {
      gameOver: (data: { score: number }) => void;
    };
  };
  hapticFeedback: () => void;
  onPlayAgain: (callback: () => void) => void;
  onToggleMute: (callback: (data: { isMuted: boolean }) => void) => void;
  hasItem: (itemName: string) => Promise<boolean>;
  purchaseItem: (itemName: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    RemixSDK?: RemixSDKInstance;
  }
}

export {};
