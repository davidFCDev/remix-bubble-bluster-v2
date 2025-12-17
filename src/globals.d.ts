/**
 * Global type declarations for externally loaded libraries
 */

// Phaser is loaded globally via CDN
declare const Phaser: typeof import("phaser");

// Import the actual SDK types from the package
import type { FarcadeSDK as FarcadeSDKType } from "@farcade/game-sdk";

// Extend SDK type with properties that may not be in the type definitions
interface ExtendedFarcadeSDK extends FarcadeSDKType {
  purchasedItems?: string[];
  hasItem?(item: string): boolean;
  purchase?(options: { item: string }): Promise<{ success: boolean }>;
  onPurchaseComplete?(callback: (data: { success: boolean }) => void): void;
}

// Farcade SDK is loaded globally via CDN
declare const FarcadeSDK: ExtendedFarcadeSDK;

// Extend window for global SDK access
declare global {
  interface Window {
    FarcadeSDK?: ExtendedFarcadeSDK;
  }
}

export {};
