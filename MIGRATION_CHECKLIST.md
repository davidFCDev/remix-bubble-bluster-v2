# Migration Checklist

- [x] **Project Configuration**
  - [x] Update `src/config/GameSettings.ts` with grid dimensions, colors, and character data.
- [x] **Assets & Preloading**

  - [x] Create `src/scenes/PreloadScene.ts`.
  - [x] Load background image.
  - [x] Load character sprites (idle/attack).
  - [x] Load music tracks.
  - [x] Implement loading bar.

- [x] **Start Scene**

  - [x] Create `src/scenes/StartScene.ts`.
  - [x] Implement Title text with "Pixelify Sans".
  - [x] Implement Start button with hover effects.
  - [x] Link to Character Selection.

- [x] **Character Selection**

  - [x] Create `src/scenes/CharacterSelectScene.ts`.
  - [x] Implement Carousel logic (Prev/Next).
  - [x] Display Character Card (Preview, Name, Lore, Skill).
  - [x] Implement Character Selection logic passing data to GameScene.

- [x] **Game Scene (Core Gameplay)**

  - [x] Update `src/scenes/GameScene.ts`.
  - [x] Implement Grid System (Hexagonal layout).
  - [x] Implement Bubble Spawning & Shooting.
  - [x] Implement Collision Detection (Wall, Ceiling, Bubbles).
  - [x] Implement "Snap to Grid" logic.
  - [x] Implement Match Finding (Flood Fill).
  - [x] Implement Floating Bubble Removal.
  - [x] Implement Ceiling Drop mechanism.
  - [x] Implement Game Over condition.
  - [x] Implement Character Skills (Pinky, Bluey, Whitey).
  - [x] Implement UI (Score, Level, Next Bubbles).

- [x] **Main Entry Point**
  - [x] Update `src/main.ts` to include new scenes in correct order.

## Next Steps / Improvements

- Add sound effects (SFX) for shooting and popping (currently only BGM is loaded).
- Polish the "Game Over" screen (currently a simple text overlay).
- Add particle effects for popping bubbles (placeholder comments in code).
- Fine-tune collision hitboxes if needed.
