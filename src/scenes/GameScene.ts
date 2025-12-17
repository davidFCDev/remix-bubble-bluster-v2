import GameSettings from "../config/GameSettings";
import { BubbleVisuals } from "../objects/BubbleVisuals";

interface Bubble {
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  moving: boolean;
  isSpecial?: boolean;
  isWild?: boolean;
  isBomb?: boolean;
  isIceLance?: boolean;
  isMagicGift?: boolean;
  sprite?:
    | Phaser.GameObjects.Arc
    | Phaser.GameObjects.Sprite
    | Phaser.GameObjects.Container;
}

export class GameScene extends Phaser.Scene {
  private static musicPlaylist: number[] = [];
  private static currentPlaylistIndex: number = 0;
  private static seenTutorials: Set<number> = new Set(); // Track which tutorials have been shown

  private grid: (string | null)[][] = [];
  private bubbleSprites: (Phaser.GameObjects.Arc | null)[][] = [];
  private currentBubble: Bubble | null = null;
  private flyingBubbles: Bubble[] = [];
  private nextBubbles: string[] = [];
  private launcherAngle: number = Math.PI / 2;
  private score: number = 0;
  private level: number = 1;
  private ceilingOffset: number = 0;
  private ceilingFrozen: boolean = false;
  private shotCount: number = 0;
  private slimeTurnCount: number = 0;
  private chameleonTurnCount: number = 0;
  private gameOver: boolean = false;
  private gameStarted: boolean = false;
  private selectedCharacter: any = null;
  private abilityAvailable: boolean = true;
  private whiteyWildShotsLeft: number = 0;
  private canShoot: boolean = true;
  private shootDelay: number = 500; // ms
  private levelTime: number = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private nextBubblePreviews: Phaser.GameObjects.Container[] = [];
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private ceilingGraphics!: Phaser.GameObjects.Graphics;
  private gameContainer!: Phaser.GameObjects.Container;
  private skillBtn!: Phaser.GameObjects.Container;
  private stopClockBtn!: Phaser.GameObjects.Container;
  private freezeBtn!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: any;
  private characterSprite!: Phaser.GameObjects.Sprite;
  private arrowGraphics!: Phaser.GameObjects.Graphics;
  private limitLineGraphics!: Phaser.GameObjects.Graphics;
  private launcherSpeed: number = 0;
  private lastSpeechText: string = "";
  private bgImage!: Phaser.GameObjects.Image;
  private lastBgIndex: number = -1;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private skillButtonPressed: boolean = false; // Track if skill button was pressed
  private lastTouchX: number = 0; // Track last touch X position for relative aiming
  private recentColors: string[] = []; // Track recent bubble colors to prevent 3+ consecutive
  private bubbleStyle: string = "classic"; // Selected bubble visual style

  // Power-ups (one-time use per game)
  private hasExtraLife: boolean = false;
  private extraLifeUsed: boolean = false;
  private hasStopClock: boolean = false;
  private stopClockUsed: boolean = false;
  private stopClockActive: boolean = false;
  private hasFreeze: boolean = false;
  private freezeUsed: boolean = false;
  private freezeActive: boolean = false;
  private levelStartScore: number = 0; // Score when level started (for extra life)

  // Constants
  private BUBBLE_SIZE!: number;
  private GRID_WIDTH = GameSettings.grid.width;
  private GRID_HEIGHT = GameSettings.grid.height;
  private LIMIT_LINE_Y!: number;
  private GRID_OFFSET_Y = 80; // Start grid below header

  constructor() {
    super("GameScene");
  }

  init(data: any) {
    this.selectedCharacter = data.character || GameSettings.characters[0];
    this.bubbleStyle = this.registry.get("bubbleStyle") || "classic";
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.gameStarted = false;
    this.ceilingOffset = 0;
    this.ceilingFrozen = false;
    this.shotCount = 0;
    this.slimeTurnCount = 0;
    this.chameleonTurnCount = 0;
    this.abilityAvailable = true;
    this.whiteyWildShotsLeft = 0;
    this.launcherAngle = Math.PI / 2;
    this.canShoot = true;
    this.levelTime = GameSettings.gameplay.levelTime;
    this.recentColors = []; // Reset recent colors tracking

    // Initialize power-ups from registry (unlocked = available)
    this.hasExtraLife = this.registry.get("powerup_extraLife") || false;
    this.extraLifeUsed = false;
    this.hasStopClock = this.registry.get("powerup_stopClock") || false;
    this.stopClockUsed = false;
    this.stopClockActive = false;
    this.hasFreeze = this.registry.get("powerup_freeze") || false;
    this.freezeUsed = false;
    this.freezeActive = false;
    this.levelStartScore = 0;
  }

  create() {
    const { width, height } = this.cameras.main;
    this.BUBBLE_SIZE = width / this.GRID_WIDTH;
    this.LIMIT_LINE_Y = height - 200;

    // Load saved game state (tutorials seen)
    this.loadGameState();

    // Background
    this.bgImage = this.add
      .image(width / 2, height / 2, "bg_level_0") // Default initial
      .setDisplaySize(width, height);

    // Background Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

    // Limit Line
    this.limitLineGraphics = this.add.graphics();
    this.drawLimitLine();

    // Generate Textures (Particles, Special Bubbles)
    BubbleVisuals.generateTextures(this);

    // Game Container (for grid and bubbles)
    this.gameContainer = this.add.container(0, this.GRID_OFFSET_Y);

    // Ceiling Graphics (outside container to cover top area)
    this.ceilingGraphics = this.add.graphics();

    // Trajectory Graphics
    this.trajectoryGraphics = this.add.graphics();

    // Arrow Graphics (Aiming)
    this.arrowGraphics = this.add.graphics();

    // Character Sprite (Bottom Left, larger)
    const charScale = this.selectedCharacter.frameConfig?.scale || 6;
    this.characterSprite = this.add
      .sprite(80, height, `${this.selectedCharacter.id}_idle`)
      .setOrigin(0.5, 1) // Anchor at bottom center
      .setScale(charScale)
      .play(`${this.selectedCharacter.id}_idle_anim`);

    // Ensure crisp pixel art look
    if (this.characterSprite.texture) {
      this.characterSprite.texture.setFilter(
        Phaser.Textures.FilterMode.NEAREST
      );
    }

    // UI Header (Retro Style - Single Row)
    // Dark gray background
    this.add.rectangle(width / 2, 40, width, 80, 0x111111, 1).setOrigin(0.5);

    const headerY = 40;
    const fontStyle = {
      fontFamily: "Pixelify Sans",
      fontSize: "32px", // Increased from 24px
      color: "#B7FF00", // Neon Green
      align: "center",
      fontStyle: "bold",
    };

    this.scoreText = this.add
      .text(width * 0.25, headerY, "Score: 0", fontStyle)
      .setOrigin(0.5);

    this.levelText = this.add
      .text(width * 0.5, headerY, "L: 1", fontStyle)
      .setOrigin(0.5);

    this.timerText = this.add
      .text(width * 0.75, headerY, "Time: 0", fontStyle)
      .setOrigin(0.5);

    // Next Bubbles UI (Bottom Right)
    // Positioned at bottom right corner
    const nextX = width - 80;
    const nextY = height - 60;

    // Background for next bubbles? Maybe just the bubbles
    this.nextBubblePreviews = [
      this.createBubbleVisual(nextX, nextY, 35, "#FFFFFF"),
      this.createBubbleVisual(nextX + 50, nextY, 35, "#FFFFFF"),
    ];

    // Skill Button (Right of Launcher)
    this.createSkillButton();

    // Power-up Buttons (Left of Launcher)
    this.createPowerupButtons();

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("A,D");

      this.input.keyboard.on("keydown-SPACE", () => {
        if (!this.gameStarted) {
          this.startGame();
        } else {
          this.shootBubble();
        }
      });

      // Power-up hotkeys
      this.input.keyboard.on("keydown-ONE", () =>
        this.activatePowerup("extraLife")
      );
      this.input.keyboard.on("keydown-TWO", () =>
        this.activatePowerup("stopClock")
      );
      this.input.keyboard.on("keydown-THREE", () =>
        this.activatePowerup("freeze")
      );
    }

    // Touch Controls (mobile only - not mouse)
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Only respond to touch, not mouse
      if (!pointer.wasTouch) return;

      if (!this.gameStarted) {
        this.startGame();
        return;
      }

      // Just store the initial touch position, don't move the aimer
      this.lastTouchX = pointer.x;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // Only respond to touch, not mouse
      if (!pointer.wasTouch) return;
      if (!this.gameStarted || this.gameOver) return;

      // Update aim while dragging based on relative movement
      if (pointer.isDown) {
        // Calculate delta from last position
        const deltaX = pointer.x - this.lastTouchX;
        this.lastTouchX = pointer.x;

        // Adjust angle based on horizontal movement (sensitivity factor)
        const sensitivity = 0.005;
        this.launcherAngle -= deltaX * sensitivity;
        this.launcherAngle = Phaser.Math.Clamp(
          this.launcherAngle,
          0.2,
          Math.PI - 0.2
        );
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      // Only respond to touch, not mouse
      if (!pointer.wasTouch) return;

      if (this.gameStarted && !this.gameOver && !this.skillButtonPressed) {
        // Shoot on release (only if skill button wasn't pressed)
        this.shootBubble();
      }
      // Reset skill button flag
      this.skillButtonPressed = false;
    });

    // Initialize Level
    this.startLevel();

    // Play Music
    this.playBackgroundMusic();
  }

  drawLimitLine() {
    this.limitLineGraphics.clear();
    this.limitLineGraphics.lineStyle(4, 0xb7ff00, 1); // Neon Green, thicker
    this.limitLineGraphics.beginPath();
    this.limitLineGraphics.moveTo(0, this.LIMIT_LINE_Y);
    this.limitLineGraphics.lineTo(this.cameras.main.width, this.LIMIT_LINE_Y);
    this.limitLineGraphics.strokePath();
  }

  createSkillButton() {
    const { width, height } = this.cameras.main;
    // Position skill button to the right of the launcher (center)
    // Launcher is at width/2. Let's put it at width/2 + 160 (further away)
    const btnX = width / 2 + 160;
    const btnY = height - 80; // Slightly up from bottom

    const btn = this.add.container(btnX, btnY);

    // Neon Style Button - Larger
    const bg = this.add.circle(0, 0, 45, 0x000000).setStrokeStyle(4, 0xb7ff00);
    const inner = this.add.circle(0, 0, 36, 0xb7ff00, 0.2);

    const text = this.add
      .text(0, 0, "SKILL", {
        fontFamily: "Pixelify Sans",
        fontSize: "22px",
        color: "#B7FF00",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    btn.add([bg, inner, text]);
    btn.setSize(90, 90);
    btn.setInteractive({ useHandCursor: true });

    btn.on(
      "pointerdown",
      (pointer: any, localX: any, localY: any, event: any) => {
        event.stopPropagation(); // Prevent shooting when clicking skill
        this.skillButtonPressed = true; // Mark that skill button was pressed
        this.playSound("sfx_button");
        this.activateAbility();
      }
    );

    this.skillBtn = btn;
  }

  createPowerupButtons() {
    const { width, height } = this.cameras.main;
    // Position power-up buttons between character (x=80) and launcher (x=width/2)
    // Character is at x=80, launcher at width/2 (360). Midpoint around 220
    const btnX = 180;
    const btnBaseY = height - 170;
    const spacing = 80;

    // DEV: Force unlocked for testing
    const stopClockAvailable = true; // this.hasStopClock && !this.stopClockUsed
    const freezeAvailable = true; // this.hasFreeze && !this.freezeUsed

    // Stop Clock Button (top)
    this.stopClockBtn = this.createPowerupButton(
      btnX,
      btnBaseY,
      "⏱️",
      "stopClock",
      stopClockAvailable
    );

    // Freeze Button (bottom)
    this.freezeBtn = this.createPowerupButton(
      btnX,
      btnBaseY + spacing,
      "❄️",
      "freeze",
      freezeAvailable
    );
  }

  createPowerupButton(
    x: number,
    y: number,
    icon: string,
    powerupId: string,
    isAvailable: boolean
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);

    // Button background
    const bg = this.add
      .circle(0, 0, 40, 0x000000)
      .setStrokeStyle(3, isAvailable ? 0xffd700 : 0x444444);
    const inner = this.add.circle(0, 0, 32, isAvailable ? 0xffd700 : 0x222222, 0.3);

    // Icon
    const text = this.add
      .text(0, 0, icon, {
        fontFamily: "Pixelify Sans",
        fontSize: "32px",
      })
      .setOrigin(0.5);

    btn.add([bg, inner, text]);
    btn.setSize(80, 80);

    if (isAvailable) {
      btn.setInteractive({ useHandCursor: true });
      btn.on("pointerdown", (pointer: any, localX: any, localY: any, event: any) => {
        event.stopPropagation();
        this.playSound("sfx_button");
        this.activatePowerup(powerupId);
        // Update button appearance after use
        this.updatePowerupButtonState(btn, false);
      });
    } else {
      btn.setAlpha(0.4);
    }

    return btn;
  }

  updatePowerupButtonState(btn: Phaser.GameObjects.Container, isAvailable: boolean) {
    btn.setAlpha(isAvailable ? 1 : 0.4);
    btn.disableInteractive();
  }

  startGame() {
    this.gameStarted = true;
  }

  playBackgroundMusic() {
    // Initialize playlist if empty
    if (GameScene.musicPlaylist.length === 0) {
      const indices = GameSettings.assets.music.map((_, i) => i);
      GameScene.musicPlaylist = Phaser.Utils.Array.Shuffle(indices);
      GameScene.currentPlaylistIndex = 0;
    }

    if (this.currentMusic) {
      this.currentMusic.stop();
    }

    const index = GameScene.musicPlaylist[GameScene.currentPlaylistIndex];
    const musicKey = `bgm_${index}`;

    this.currentMusic = this.sound.add(musicKey, {
      volume: 0.3,
      loop: false,
    });
    this.currentMusic.play();

    // Advance playlist index for next time (or if this song ends)
    GameScene.currentPlaylistIndex =
      (GameScene.currentPlaylistIndex + 1) % GameScene.musicPlaylist.length;

    this.currentMusic.once("complete", () => {
      this.playBackgroundMusic();
    });
  }

  setRandomBackground() {
    let newIndex;
    // Try to pick a different background, but if it's the first time (lastBgIndex -1), just pick any.
    // We have 3 backgrounds: 0, 1, 2
    if (this.lastBgIndex === -1) {
      newIndex = Phaser.Math.Between(0, 2);
    } else {
      do {
        newIndex = Phaser.Math.Between(0, 2);
      } while (newIndex === this.lastBgIndex);
    }

    this.lastBgIndex = newIndex;
    this.bgImage.setTexture(`bg_level_${newIndex}`);

    const { width, height } = this.cameras.main;
    this.bgImage.setDisplaySize(width, height);
  }

  startLevel() {
    // Set Random Background
    this.setRandomBackground();

    // Save score at level start (for Extra Life)
    this.levelStartScore = this.score;

    // Reset power-up effects for this level
    this.stopClockActive = false;
    this.freezeActive = false;
    this.ceilingFrozen = false;

    // Reset Ceiling
    this.ceilingOffset = 0;
    this.shotCount = 0; // Reset shot count for ceiling drop
    // Remove frost line if it exists
    if ((this as any).frostLineContainer) {
      (this as any).frostLineContainer.destroy();
      (this as any).frostLineContainer = null;
    }
    this.gameContainer.y = this.GRID_OFFSET_Y;
    this.drawCeiling(); // Force redraw immediately to avoid visual glitch during transition

    // Reset Launcher Angle
    this.launcherAngle = Math.PI / 2;

    // Reset Ability
    this.abilityAvailable = true;
    if (this.skillBtn) this.skillBtn.setAlpha(1);

    // Reset Timer
    this.levelTime = GameSettings.gameplay.levelTime;
    if (this.timerEvent) this.timerEvent.remove();
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });
    this.updateUI();

    // Cleanup visual glitches (ghost bubbles)
    if (this.currentBubble && this.currentBubble.sprite) {
      this.currentBubble.sprite.destroy();
    }
    this.currentBubble = null;

    this.flyingBubbles.forEach((b) => {
      if (b.sprite) b.sprite.destroy();
    });
    this.flyingBubbles = [];

    this.lastSpeechText = ""; // Reset speech check

    // Reset Grid
    this.grid = Array(this.GRID_HEIGHT)
      .fill(null)
      .map(() => Array(this.GRID_WIDTH).fill(null));
    this.bubbleSprites = Array(this.GRID_HEIGHT)
      .fill(null)
      .map(() => Array(this.GRID_WIDTH).fill(null));
    this.gameContainer.removeAll(true); // Clear existing bubbles
    // Ceiling graphics is now outside container, so we don't add it here

    // Populate Grid - Fixed 6 rows for all levels
    const initialRows = 6;
    const usedColors = new Set<string>();

    for (let row = 0; row < initialRows; row++) {
      const isOddRow = row % 2 === 1;
      const numBubbles = isOddRow ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let col = 0; col < numBubbles; col++) {
        let color;
        // Standard colors only for now (Slime is added separately below)
        color =
          GameSettings.colors.all[
            Math.floor(Math.random() * GameSettings.colors.all.length)
          ];
        usedColors.add(color);

        this.grid[row][col] = color;
        this.createBubbleSprite(row, col, color);
      }
    }

    // Level Progression: Special Bubbles
    this.placeSpecialBubblesForLevel(initialRows);

    // Setup Next Bubbles
    this.nextBubbles = [
      this.getRandomColor(Array.from(usedColors)),
      this.getRandomColor(Array.from(usedColors)),
    ];

    // Show level overlay for all levels (tutorial info for levels 1-5)
    this.showLevelOverlay(this.level, () => {
      this.spawnBubble();
      this.updateUI();
      this.gameStarted = true;
    });
  }

  // Get tutorial text for new bubble types introduced in each level
  getNewBubbleInfo(
    level: number
  ): { name: string; description: string } | null {
    switch (level) {
      case 1:
        return {
          name: "PRISM",
          description: "Universal wildcard.\nMatches with any color!",
        };
      case 2:
        return {
          name: "BOMB",
          description: "Explodes on contact!\nDestroys all adjacent bubbles.",
        };
      case 3:
        return {
          name: "STONE",
          description: "Solid obstacle.\nOnly falls if you break its support.",
        };
      case 4:
        return {
          name: "STOP",
          description:
            "Drop it to freeze the ceiling!\nLasts the entire level.",
        };
      case 5:
        return {
          name: "CHAMELEON",
          description: "Changes color every 2 turns.\nOnly to neighbor colors!",
        };
      case 6:
        return {
          name: "ANCHOR",
          description: "Immune to abilities.\nOnly falls by dropping it.",
        };
      case 7:
        return {
          name: "SLIME",
          description: "Infects neighbors every 6 turns.\nShoot it to cure!",
        };
      default:
        return null;
    }
  }

  showLevelOverlay(level: number, onComplete: () => void) {
    const { width, height } = this.cameras.main;
    const overlay = this.add.container(0, 0);

    const bg = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.85
    );

    const levelText = this.add
      .text(width / 2, height / 2 - 60, `LEVEL ${level}`, {
        fontFamily: "Pixelify Sans",
        fontSize: "80px",
        color: "#B7FF00",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0);

    overlay.add([bg, levelText]);

    // Check if this level introduces a new bubble type AND if we haven't seen it before
    const bubbleInfo = this.getNewBubbleInfo(level);
    const showTutorial = bubbleInfo && !GameScene.seenTutorials.has(level);

    let bubbleNameText: Phaser.GameObjects.Text | null = null;
    let bubbleDescText: Phaser.GameObjects.Text | null = null;

    if (showTutorial && bubbleInfo) {
      // Mark this tutorial as seen and save state
      GameScene.seenTutorials.add(level);
      this.saveGameState();

      bubbleNameText = this.add
        .text(width / 2, height / 2 + 50, bubbleInfo.name, {
          fontFamily: "Pixelify Sans",
          fontSize: "48px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setAlpha(0);

      bubbleDescText = this.add
        .text(width / 2, height / 2 + 120, bubbleInfo.description, {
          fontFamily: "Pixelify Sans",
          fontSize: "32px",
          color: "#CCCCCC",
          align: "center",
        })
        .setOrigin(0.5)
        .setAlpha(0);

      overlay.add([bubbleNameText, bubbleDescText]);
    }

    overlay.setDepth(100); // Ensure it's on top

    // Animation
    this.tweens.add({
      targets: levelText,
      scale: 1,
      duration: 500,
      ease: "Back.out",
      onComplete: () => {
        // Show bubble info after level text appears
        if (bubbleNameText && bubbleDescText) {
          this.tweens.add({
            targets: [bubbleNameText, bubbleDescText],
            alpha: 1,
            duration: 300,
            onComplete: () => {
              // Wait longer to read the info
              this.time.delayedCall(2500, () => {
                this.tweens.add({
                  targets: overlay,
                  alpha: 0,
                  duration: 500,
                  onComplete: () => {
                    overlay.destroy();
                    onComplete();
                  },
                });
              });
            },
          });
        } else {
          this.time.delayedCall(1500, () => {
            this.tweens.add({
              targets: overlay,
              alpha: 0,
              duration: 500,
              onComplete: () => {
                overlay.destroy();
                onComplete();
              },
            });
          });
        }
      },
    });
  }

  createBubbleSprite(row: number, col: number, color: string) {
    const { x, y } = this.getBubblePos(row, col);
    const container = this.createBubbleVisual(x, y, this.BUBBLE_SIZE, color);
    this.gameContainer.add(container);

    // Store container instead of just circle, but cast to any to satisfy type for now or update type
    // Updating type is better but for quick fix we store container.
    // The type definition says Arc | Sprite. We should update it to Container | Arc | Sprite or just any.
    // Let's update the type definition at the top of the file later or cast here.
    this.bubbleSprites[row][col] = container as any;
  }

  createBubbleVisual(x: number, y: number, size: number, color: string) {
    return BubbleVisuals.createWithStyle(
      this,
      x,
      y,
      size,
      color,
      this.bubbleStyle
    );
  }

  getBubblePos(row: number, col: number) {
    const isOddRow = row % 2 === 1;
    const offset = isOddRow ? this.BUBBLE_SIZE / 2 : 0;
    const x = col * this.BUBBLE_SIZE + offset + this.BUBBLE_SIZE / 2;
    const y =
      row * ((this.BUBBLE_SIZE * Math.sqrt(3)) / 2) + this.BUBBLE_SIZE / 2;
    return { x, y };
  }

  getRandomColor(availableColors: string[]) {
    // Get colors currently on the grid
    const gridColors = new Set<string>();
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        const val = this.grid[r][c];
        if (val) {
          // Only add standard colors (hex codes) to the pool
          // Exclude special types like STONE, ICE, etc.
          if (val.startsWith("#")) {
            gridColors.add(val);
          }
        }
      }
    }

    // Also include colors currently in the queue (nextBubbles) to avoid starvation if grid is empty but queue has colors
    this.nextBubbles.forEach((c) => {
      if (c.startsWith("#")) {
        gridColors.add(c);
      }
    });

    // If we have colors on grid, pick from them. Otherwise fallback to all colors (e.g. start of game or empty grid)
    const pool = gridColors.size > 0 ? Array.from(gridColors) : availableColors;

    return (
      pool[Math.floor(Math.random() * pool.length)] ||
      GameSettings.colors.all[0]
    );
  }

  spawnBubble() {
    const color = this.nextBubbles.shift()!;

    // Track this color in recent history
    this.recentColors.push(color);
    if (this.recentColors.length > 3) {
      this.recentColors.shift(); // Keep only last 3
    }

    // Generate new color for queue, avoiding 3+ consecutive
    let newColor = this.getRandomColor(GameSettings.colors.all);

    // Check consecutive count: current bubble + queue + new color
    // We need to check if adding newColor would make 3+ in a row
    const checkSequence = [...this.nextBubbles, newColor];
    let consecutiveCount = 1;

    for (let i = checkSequence.length - 2; i >= 0; i--) {
      if (checkSequence[i] === newColor) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    // Also check recent colors (what was just shot)
    if (consecutiveCount < 3 && this.recentColors.length > 0) {
      const lastRecent = this.recentColors[this.recentColors.length - 1];
      if (this.nextBubbles.length === 0 && lastRecent === newColor) {
        // Count consecutive in recent history
        let recentConsecutive = 0;
        for (let i = this.recentColors.length - 1; i >= 0; i--) {
          if (this.recentColors[i] === newColor) {
            recentConsecutive++;
          } else {
            break;
          }
        }
        consecutiveCount = Math.max(consecutiveCount, recentConsecutive + 1);
      }
    }

    // If we would have 3+ consecutive, pick a different color
    if (consecutiveCount >= 3) {
      const otherColors = GameSettings.colors.all.filter((c) => c !== newColor);
      newColor =
        otherColors[Math.floor(Math.random() * otherColors.length)] || newColor;
    }

    this.nextBubbles.push(newColor);

    const { width, height } = this.cameras.main;

    // Use the same visual style as grid bubbles
    const visual = this.createBubbleVisual(
      width / 2,
      height - 20,
      this.BUBBLE_SIZE,
      color
    );

    this.currentBubble = {
      x: width / 2,
      y: height - 20,
      color: color,
      velocity: { x: 0, y: 0 },
      moving: false,
      isSpecial: false,
      isWild: false,
      sprite: visual,
    };

    // Whitey Skill Check
    if (
      this.selectedCharacter.id === "Whitey" &&
      this.whiteyWildShotsLeft > 0
    ) {
      this.currentBubble.isWild = true;
      this.currentBubble.color = "#FFFFFF";
      this.applySkillVisuals(this.currentBubble, "Whitey");
      this.whiteyWildShotsLeft--;
    }

    this.updateUI();
  }

  // Load saved game state from SDK
  private loadGameState() {
    if (window.FarcadeSDK) {
      try {
        // Try to get saved state from localStorage as fallback
        // The SDK's loadGameState is async, so we use localStorage for immediate access
        const saved = localStorage.getItem("bubbleBlusterState");
        if (saved) {
          const state = JSON.parse(saved);
          if (state.seenTutorials && Array.isArray(state.seenTutorials)) {
            GameScene.seenTutorials = new Set(state.seenTutorials);
          }
        }
      } catch (e) {
        console.warn("Failed to load game state:", e);
      }
    }
  }

  // Save game state using SDK
  private saveGameState() {
    if (window.FarcadeSDK) {
      const gameState = {
        seenTutorials: Array.from(GameScene.seenTutorials),
      };

      // Save to SDK
      window.FarcadeSDK.singlePlayer.actions.saveGameState({ gameState });

      // Also save to localStorage as backup
      try {
        localStorage.setItem("bubbleBlusterState", JSON.stringify(gameState));
      } catch (e) {
        console.warn("Failed to save to localStorage:", e);
      }
    }
  }

  private playSound(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    // Check if the sound exists in the manager or cache before playing
    if (this.sound.get(key) || this.cache.audio.exists(key)) {
      this.sound.play(key, config);
    }
    // Silently ignore missing sounds to prevent console spam/lag
  }

  shootBubble() {
    if (!this.canShoot || !this.currentBubble) return;

    // Play shoot sound safely
    this.playSound("sfx_shoot");

    // SDK: Haptic feedback on shoot
    if (window.FarcadeSDK) {
      window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
    }

    this.canShoot = false;

    const speed = 15; // Increased speed for Phaser
    this.currentBubble.velocity.x = Math.cos(this.launcherAngle) * speed;
    this.currentBubble.velocity.y = -Math.sin(this.launcherAngle) * speed;
    this.currentBubble.moving = true;

    this.flyingBubbles.push(this.currentBubble);
    this.currentBubble = null;

    this.shotCount++;

    // Delay next shot
    this.time.delayedCall(this.shootDelay, () => {
      this.canShoot = true;
      if (!this.gameOver && this.gameStarted) {
        this.spawnBubble();
      }
    });
  }

  activateAbility() {
    if (!this.abilityAvailable || !this.currentBubble) return;

    // Play generic skill sound with reduced volume
    this.playSound("sfx_skill", { volume: 0.4 });

    // SDK: Haptic feedback on skill activation
    if (window.FarcadeSDK) {
      window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
    }

    if (this.selectedCharacter.id === "Pinky") {
      this.currentBubble.color = "#FF6600";
      this.currentBubble.isSpecial = true;
      this.applySkillVisuals(this.currentBubble, "Pinky");
      // this.playSound("sfx_special_pinky"); // Removed specific sound for now
    } else if (this.selectedCharacter.id === "Bluey") {
      this.currentBubble.color = "#000000";
      this.currentBubble.isBomb = true;
      this.applySkillVisuals(this.currentBubble, "Bluey");
      // this.playSound("sfx_special_bluey"); // Removed specific sound for now
    } else if (this.selectedCharacter.id === "Whitey") {
      this.currentBubble.isIceLance = true;
      this.currentBubble.color = "#00FFFF"; // Cyan/Ice color
      this.applySkillVisuals(this.currentBubble, "Whitey");
      // this.playSound("sfx_special_whitey"); // Removed specific sound for now
    } else if (this.selectedCharacter.id === "WitchKitty") {
      // Hex Bubble: Transform all bubbles of touched color
      this.currentBubble.isMagicGift = true;
      this.currentBubble.color = "#9932CC"; // Dark orchid purple
      this.applySkillVisuals(this.currentBubble, "WitchKitty");
    }

    this.abilityAvailable = false;
    this.skillBtn.setAlpha(0.5);
  }

  createHexParticles(x: number, y: number) {
    // Create magical particle effect for Witch Kitty's hex
    const colors = [0x9932cc, 0x00ff88, 0x8b008b, 0xffffff]; // Purple, Witch Green, Magenta, White

    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(
        x,
        y,
        4,
        Phaser.Utils.Array.GetRandom(colors)
      );
      const angle = (i / 8) * Math.PI * 2;
      const distance = 40 + Math.random() * 20;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  drawCeiling() {
    this.ceilingGraphics.clear();

    const ceilingY = this.GRID_OFFSET_Y + this.ceilingOffset;
    const width = this.cameras.main.width;

    // Main Piston Shaft (Dark Grey)
    this.ceilingGraphics.fillStyle(0x222222);
    this.ceilingGraphics.fillRect(0, 0, width, ceilingY);

    // Hazard Stripes (Yellow/Black) - Full Height
    // Draw stripes across the entire piston shaft
    const stripeWidth = 40;
    const stripeGap = 40;

    this.ceilingGraphics.fillStyle(0xffd700, 0.2); // Yellow stripes, low opacity to look like painted on dark metal

    for (
      let i = -ceilingY;
      i < width + ceilingY;
      i += stripeWidth + stripeGap
    ) {
      this.ceilingGraphics.beginPath();
      this.ceilingGraphics.moveTo(i, 0);
      this.ceilingGraphics.lineTo(i + stripeWidth, 0);
      this.ceilingGraphics.lineTo(i + stripeWidth - ceilingY, ceilingY); // Diagonal slope
      this.ceilingGraphics.lineTo(i - ceilingY, ceilingY);
      this.ceilingGraphics.closePath();
      this.ceilingGraphics.fillPath();
    }

    // Piston Head / Plate (Metallic)
    this.ceilingGraphics.fillStyle(0x111111);
    this.ceilingGraphics.fillRect(0, ceilingY - 20, width, 20);

    // Sync grid bubbles position with ceiling offset
    this.gameContainer.y = this.GRID_OFFSET_Y + this.ceilingOffset;
  }

  update(time: number, delta: number) {
    if (!this.gameStarted || this.gameOver) return;

    // Input Handling (Keyboard: Arrows + A/D) with Acceleration
    const baseSpeed = 0.005; // Reduced for finer control on short taps
    const maxSpeed = 0.04; // Reduced max speed for better control
    const acceleration = 0.0015;

    if (this.cursors.left.isDown || this.keys.A.isDown) {
      this.launcherSpeed = Math.min(
        this.launcherSpeed + acceleration,
        maxSpeed
      );
      this.launcherAngle += Math.max(baseSpeed, this.launcherSpeed);
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      this.launcherSpeed = Math.min(
        this.launcherSpeed + acceleration,
        maxSpeed
      );
      this.launcherAngle -= Math.max(baseSpeed, this.launcherSpeed);
    } else {
      this.launcherSpeed = 0;
    }

    // Clamp Angle (approx 10 to 170 degrees)
    this.launcherAngle = Phaser.Math.Clamp(
      this.launcherAngle,
      0.2,
      Math.PI - 0.2
    );

    // Update Arrow Graphics (Launcher Visuals)
    this.arrowGraphics.clear();
    const startX = this.cameras.main.width / 2;
    const startY = this.cameras.main.height - 20;
    const length = 120; // Longer arrow
    const endX = startX + Math.cos(this.launcherAngle) * length;
    const endY = startY - Math.sin(this.launcherAngle) * length;

    // Draw Outer Ring (Neon Green) - Larger
    this.arrowGraphics.lineStyle(6, 0xb7ff00); // Neon Green, thicker
    this.arrowGraphics.strokeCircle(startX, startY, this.BUBBLE_SIZE / 2 + 25);

    // Draw Arrow Line (Thick Neon Green)
    this.arrowGraphics.lineStyle(8, 0xb7ff00);
    this.arrowGraphics.beginPath();
    // Start from edge of bubble
    this.arrowGraphics.moveTo(
      startX + Math.cos(this.launcherAngle) * (this.BUBBLE_SIZE / 2),
      startY - Math.sin(this.launcherAngle) * (this.BUBBLE_SIZE / 2)
    );
    this.arrowGraphics.lineTo(endX, endY);
    this.arrowGraphics.strokePath();

    // Draw Arrow Head (Neon Green)
    const arrowSize = 25;
    const angle = this.launcherAngle;
    const leftX = endX - arrowSize * Math.cos(angle - Math.PI / 6);
    const leftY = endY + arrowSize * Math.sin(angle - Math.PI / 6);
    const rightX = endX - arrowSize * Math.cos(angle + Math.PI / 6);
    const rightY = endY + arrowSize * Math.sin(angle + Math.PI / 6);

    this.arrowGraphics.fillStyle(0xb7ff00);
    this.arrowGraphics.beginPath();
    this.arrowGraphics.moveTo(endX, endY);
    this.arrowGraphics.lineTo(leftX, leftY);
    this.arrowGraphics.lineTo(rightX, rightY);
    this.arrowGraphics.closePath();
    this.arrowGraphics.fillPath();

    // Update Ceiling Graphics (Industrial Press Style)
    this.drawCeiling();

    // Update Flying Bubbles
    for (let i = this.flyingBubbles.length - 1; i >= 0; i--) {
      const bubble = this.flyingBubbles[i];
      bubble.x += bubble.velocity.x * (delta / 16);
      bubble.y += bubble.velocity.y * (delta / 16);

      if (bubble.sprite) {
        bubble.sprite.setPosition(bubble.x, bubble.y);

        // Rotate special bubbles
        if (
          bubble.isSpecial ||
          bubble.isBomb ||
          bubble.isWild ||
          bubble.isIceLance ||
          bubble.isMagicGift
        ) {
          if (bubble.isIceLance) {
            // Align rotation with velocity for Ice Lance
            const angle = Math.atan2(bubble.velocity.y, bubble.velocity.x);
            (bubble.sprite as Phaser.GameObjects.Container).rotation =
              angle + Math.PI / 2;
          } else {
            (bubble.sprite as Phaser.GameObjects.Container).rotation += 0.1;
          }

          // Particle Trail
          // More frequent and distinct for special bubbles
          if (Math.random() > 0.3) {
            // Increased frequency
            let color = 0xffffff;
            let size = 3;
            let duration = 300;

            if (bubble.isSpecial) {
              // Pinky: Orange/Yellow trail
              color = Math.random() > 0.5 ? 0xff6600 : 0xffff00;
              size = 5;
              duration = 500;
            } else if (bubble.isBomb) {
              color = 0x5500aa; // Dark Purple trail for Void Bomb
            } else if (bubble.isWild) {
              color = 0x00ffff;
            } else if (bubble.isIceLance) {
              color = 0xccffff; // Ice Blue
              size = 4;
            } else if (bubble.isMagicGift) {
              // WitchKitty: Purple/Green magical trail
              color = Math.random() > 0.5 ? 0xffd700 : 0xff0000;
              size = 4;
              duration = 400;
            }

            const p = this.add.circle(bubble.x, bubble.y, size, color);
            this.tweens.add({
              targets: p,
              alpha: 0,
              scale: 0,
              duration: duration,
              onComplete: () => p.destroy(),
            });
          }
        }
      }

      // Wall Collision
      if (
        bubble.x < this.BUBBLE_SIZE / 2 ||
        bubble.x > this.cameras.main.width - this.BUBBLE_SIZE / 2
      ) {
        if (bubble.isIceLance) {
          // Ice Lance destroys itself on wall contact (no bounce)
          if (bubble.sprite) bubble.sprite.destroy();
          this.playPopAnimation(bubble.x, bubble.y, "#00FFFF");
          this.flyingBubbles.splice(i, 1);
          continue;
        }

        bubble.velocity.x *= -1;
        bubble.x = Phaser.Math.Clamp(
          bubble.x,
          this.BUBBLE_SIZE / 2,
          this.cameras.main.width - this.BUBBLE_SIZE / 2
        );
      }

      // Ceiling Collision
      if (
        bubble.y <
        this.GRID_OFFSET_Y + this.ceilingOffset + this.BUBBLE_SIZE / 2
      ) {
        if (bubble.isIceLance) {
          // Ice Lance destroys itself on ceiling
          if (bubble.sprite) bubble.sprite.destroy();
          this.playPopAnimation(bubble.x, bubble.y, "#00FFFF");
          this.flyingBubbles.splice(i, 1);
          this.removeFloatingBubbles(); // Check for floating bubbles after destruction
          continue;
        }
        this.snapBubbleToGrid(bubble);
        this.flyingBubbles.splice(i, 1);
        continue;
      }

      // Bubble Collision
      const pos = this.getGridPos(bubble.x, bubble.y);
      if (this.grid[pos.row] && this.grid[pos.row][pos.col]) {
        // Direct hit on an existing bubble (rare but possible if fast)
        if (
          this.grid[pos.row][pos.col] === "SLIME" &&
          !bubble.isSpecial &&
          !bubble.isBomb &&
          !bubble.isIceLance &&
          !bubble.isMagicGift
        ) {
          this.cureSlime(pos.row, pos.col, bubble.color);
          if (bubble.sprite) bubble.sprite.destroy();
          this.flyingBubbles.splice(i, 1);
          continue;
        }

        if (bubble.isIceLance) {
          // Ice Lance destroys the bubble and continues
          const color = this.grid[pos.row][pos.col]!;

          // Anchor, Slime, Stop and Bomb are immune to Ice Lance (Prism lets it pass through)
          if (
            color === "ANCHOR" ||
            color === "SLIME" ||
            color === "STOP" ||
            color === "BOMB"
          ) {
            // Lance breaks on Anchor or Slime
            if (bubble.sprite) bubble.sprite.destroy();
            this.playPopAnimation(bubble.x, bubble.y, "#00FFFF");
            this.flyingBubbles.splice(i, 1);
            continue;
          }

          this.grid[pos.row][pos.col] = null;
          if (this.bubbleSprites[pos.row][pos.col]) {
            const sprite = this.bubbleSprites[pos.row][pos.col]!;
            this.playPopAnimation(
              sprite.x + this.gameContainer.x,
              sprite.y + this.gameContainer.y,
              color
            );
            sprite.destroy();
            this.bubbleSprites[pos.row][pos.col] = null;
            this.score += 500; // Bonus points for lance destruction
          }
          // Do NOT stop the lance, continue loop
          continue;
        }
        this.snapBubbleToGrid(bubble);
        this.flyingBubbles.splice(i, 1);
        continue;
      }

      // Check collision with existing bubbles
      let collided = false;
      for (
        let r = Math.max(0, pos.row - 1);
        r <= Math.min(this.GRID_HEIGHT - 1, pos.row + 1);
        r++
      ) {
        const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
        for (let c = 0; c < maxCols; c++) {
          if (this.grid[r][c]) {
            const { x: bx, y: by } = this.getBubblePos(r, c);
            const worldBy = by + this.GRID_OFFSET_Y + this.ceilingOffset;
            const dist = Phaser.Math.Distance.Between(
              bubble.x,
              bubble.y,
              bx,
              worldBy
            );
            if (dist < this.BUBBLE_SIZE * 0.9) {
              if (bubble.isIceLance) {
                // Ice Lance destroys the bubble and continues
                const color = this.grid[r][c]!;

                // Anchor, Slime, Stop and Bomb are immune to Ice Lance (Prism lets it pass)
                if (
                  color === "ANCHOR" ||
                  color === "SLIME" ||
                  color === "STOP" ||
                  color === "BOMB"
                ) {
                  // Lance breaks on Anchor or Slime
                  if (bubble.sprite) bubble.sprite.destroy();
                  this.playPopAnimation(bubble.x, bubble.y, "#00FFFF");
                  this.flyingBubbles.splice(i, 1);
                  collided = true;
                  break;
                }

                this.grid[r][c] = null;
                if (this.bubbleSprites[r][c]) {
                  const sprite = this.bubbleSprites[r][c]!;
                  this.playPopAnimation(
                    sprite.x + this.gameContainer.x,
                    sprite.y + this.gameContainer.y,
                    color
                  );
                  sprite.destroy();
                  this.bubbleSprites[r][c] = null;
                  this.score += 500;
                }
                // Do NOT stop, continue checking other collisions?
                // Actually, we should probably break this inner loop but NOT splice the flying bubble
                // But we need to make sure we don't destroy the same bubble twice or glitch
                // Since we set grid[r][c] to null, it won't be checked again.
              } else {
                // Check for Slime Cure (Standard bubbles only)
                if (
                  this.grid[r][c] === "SLIME" &&
                  !bubble.isSpecial &&
                  !bubble.isBomb &&
                  !bubble.isIceLance &&
                  !bubble.isMagicGift
                ) {
                  this.cureSlime(r, c, bubble.color);
                  if (bubble.sprite) bubble.sprite.destroy();
                  this.flyingBubbles.splice(i, 1);
                  collided = true;
                  break;
                }

                this.snapBubbleToGrid(bubble);
                this.flyingBubbles.splice(i, 1);
                collided = true;
                break;
              }
            }
          }
        }
        if (collided) break;
      }
    }

    // Draw Trajectory
    this.drawTrajectory();
  }

  drawTrajectory() {
    this.trajectoryGraphics.clear();
    if (!this.currentBubble || this.currentBubble.moving) return;

    // Configuración de la línea de puntos
    const dotSpacing = 15; // Espacio entre puntos
    const maxSteps = 200; // Máximo número de pasos
    const stepSize = 10; // Tamaño del paso de simulación
    const radius = this.BUBBLE_SIZE / 2;
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const ceilingY = this.GRID_OFFSET_Y + this.ceilingOffset;

    // Color Cyan para la trayectoria (mejor contraste)
    this.trajectoryGraphics.fillStyle(0x00ffff, 0.8);

    let simX = this.currentBubble.x;
    let simY = this.currentBubble.y;
    let angle = this.launcherAngle;
    let vx = Math.cos(angle);
    let vy = -Math.sin(angle);

    let distAccumulator = 0;

    for (let i = 0; i < maxSteps * (gameHeight / stepSize); i++) {
      // Avanzar simulación
      simX += vx * stepSize;
      simY += vy * stepSize;

      // Rebote en paredes
      if (simX <= radius || simX >= gameWidth - radius) {
        vx *= -1;
        simX = Phaser.Math.Clamp(simX, radius, gameWidth - radius);
      }

      // Colisión con techo
      if (simY <= ceilingY + radius) {
        break;
      }

      // Colisión con burbujas existentes
      let collisionFound = false;

      // Optimización: Solo revisar filas cercanas a la posición simulada
      // Convertir simY a coordenadas locales de la grilla para estimar fila
      const localSimY = simY - ceilingY;
      const approxRow = Math.floor(
        localSimY / ((this.BUBBLE_SIZE * Math.sqrt(3)) / 2)
      );

      const startRow = Math.max(0, approxRow - 2);
      const endRow = Math.min(this.GRID_HEIGHT - 1, approxRow + 2);

      for (let r = startRow; r <= endRow; r++) {
        const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
        for (let c = 0; c < maxCols; c++) {
          if (this.grid[r][c]) {
            const { x: bx, y: by } = this.getBubblePos(r, c);
            const worldBy = by + ceilingY; // Ajustar a coordenadas de mundo

            const dx = simX - bx;
            const dy = simY - worldBy;
            const distSq = dx * dx + dy * dy;

            // Si la distancia es menor a 2 radios (colisión), paramos
            // Usamos un factor un poco menor (1.8) para que la guía no se detenga "antes" de tocar visualmente
            if (distSq < (radius * 2 * 0.9) ** 2) {
              collisionFound = true;
              break;
            }
          }
        }
        if (collisionFound) break;
      }

      if (collisionFound) break;

      // Dibujar punto si hemos acumulado suficiente distancia
      distAccumulator += stepSize;
      if (distAccumulator >= dotSpacing) {
        this.trajectoryGraphics.fillCircle(simX, simY, 3); // Puntos un poco más grandes
        distAccumulator = 0;
      }
    }
  }
  getGridPos(x: number, y: number) {
    const row = Math.floor(
      (y - (this.ceilingOffset + this.GRID_OFFSET_Y)) /
        ((this.BUBBLE_SIZE * Math.sqrt(3)) / 2)
    );
    const isOddRow = row % 2 === 1;
    const colOffset = isOddRow ? this.BUBBLE_SIZE / 2 : 0;
    const col = Math.floor((x - colOffset) / this.BUBBLE_SIZE);
    return {
      row: Math.max(0, Math.min(this.GRID_HEIGHT - 1, row)),
      col: Math.max(
        0,
        Math.min(isOddRow ? this.GRID_WIDTH - 2 : this.GRID_WIDTH - 1, col)
      ), // Fix max col
    };
  }

  getBubbleType(value: string) {
    if (value === "STONE") return "STONE";
    if (value === "ANCHOR") return "ANCHOR";
    if (value.startsWith("ICE:")) return "ICE";
    if (value.startsWith("CLOCK:")) return "CLOCK";
    if (value.startsWith("CHAMELEON:")) return "CHAMELEON";
    if (value === "SLIME") return "SLIME";
    if (value === "RAINBOW") return "RAINBOW";
    if (value === "BLACKHOLE") return "BLACKHOLE";
    return "NORMAL";
  }

  getBubbleColor(value: string) {
    if (value.startsWith("ICE:")) return value.split(":")[1];
    if (value.startsWith("CLOCK:")) return value.split(":")[1];
    if (value.startsWith("CHAMELEON:")) return value.split(":")[1];
    return value;
  }

  snapBubbleToGrid(bubble: Bubble) {
    if (!bubble) return;

    let pos = this.getGridPos(bubble.x, bubble.y);

    // Logic to find nearest empty spot if occupied or out of bounds
    if (!this.isValidPos(pos.row, pos.col) || this.grid[pos.row][pos.col]) {
      pos = this.findNearestEmptySpot(bubble.x, bubble.y) || pos;
    }

    if (this.isValidPos(pos.row, pos.col)) {
      this.grid[pos.row][pos.col] = bubble.color;
      this.createBubbleSprite(pos.row, pos.col, bubble.color);

      // Handle Skills (Bomb, etc)
      if (bubble.isBomb) {
        // Bomb logic: Destroy neighbors in radius 2
        const neighbors = this.getNeighbors(pos.row, pos.col);
        neighbors.forEach((n) => {
          if (this.grid[n.r][n.c]) {
            const val = this.grid[n.r][n.c]!;
            // Anchor, Slime, Stop and Bomb are immune to Bomb skill (Prism is destroyed)
            if (
              val === "ANCHOR" ||
              val === "SLIME" ||
              val === "STOP" ||
              val === "BOMB"
            )
              return;

            this.grid[n.r][n.c] = null;
            if (this.bubbleSprites[n.r][n.c]) {
              const sprite = this.bubbleSprites[n.r][n.c]!;
              this.playPopAnimation(
                sprite.x + this.gameContainer.x,
                sprite.y + this.gameContainer.y,
                val
              );
              sprite.destroy();
              this.bubbleSprites[n.r][n.c] = null;
            }
          }
          // Chain reaction? For now just direct neighbors
          const secondNeighbors = this.getNeighbors(n.r, n.c);
          secondNeighbors.forEach((sn) => {
            if (this.grid[sn.r][sn.c]) {
              const val = this.grid[sn.r][sn.c]!;
              // Anchor, Slime, Stop and Bomb are immune to Bomb skill (Prism is destroyed)
              if (
                val === "ANCHOR" ||
                val === "SLIME" ||
                val === "STOP" ||
                val === "BOMB"
              )
                return;

              this.grid[sn.r][sn.c] = null;
              if (this.bubbleSprites[sn.r][sn.c]) {
                const sprite = this.bubbleSprites[sn.r][sn.c]!;
                this.playPopAnimation(
                  sprite.x + this.gameContainer.x,
                  sprite.y + this.gameContainer.y,
                  val
                );
                sprite.destroy();
                this.bubbleSprites[sn.r][sn.c] = null;
              }
            }
          });
        });
        // Destroy self too
        this.grid[pos.row][pos.col] = null;
        if (this.bubbleSprites[pos.row][pos.col]) {
          const sprite = this.bubbleSprites[pos.row][pos.col]!;
          this.playPopAnimation(
            sprite.x + this.gameContainer.x,
            sprite.y + this.gameContainer.y,
            "#000000"
          );
          sprite.destroy();
          this.bubbleSprites[pos.row][pos.col] = null;
        }
        this.removeFloatingBubbles();
        this.updateUI();
      } else if (bubble.isSpecial) {
        // Color Blast (Pinky): Destroy all bubbles of the TARGET color (closest neighbor)
        // Find the neighbor that we collided "most" with (closest center distance)
        const neighbors = this.getNeighbors(pos.row, pos.col);
        let closestNeighbor: { r: number; c: number; color: string } | null =
          null;
        let minDistance = Infinity;

        for (const n of neighbors) {
          if (this.grid[n.r][n.c]) {
            const { x: nx, y: ny } = this.getBubblePos(n.r, n.c);
            // Calculate world Y for neighbor to compare with bubble world Y
            const worldNy = ny + this.ceilingOffset + this.GRID_OFFSET_Y;

            // Use the bubble's impact position (bubble.x, bubble.y)
            const dist = Phaser.Math.Distance.Between(
              bubble.x,
              bubble.y,
              nx,
              worldNy
            );

            if (dist < minDistance) {
              minDistance = dist;
              closestNeighbor = { r: n.r, c: n.c, color: this.grid[n.r][n.c]! };
            }
          }
        }

        if (closestNeighbor && closestNeighbor.color) {
          const targetColor = closestNeighbor.color;
          // Anchor, Slime, Stop and Bomb are immune to Color Blast (Prism can be targeted)
          if (
            targetColor !== "ANCHOR" &&
            targetColor !== "SLIME" &&
            targetColor !== "STOP" &&
            targetColor !== "BOMB"
          ) {
            // Destroy all bubbles of this specific color
            for (let r = 0; r < this.GRID_HEIGHT; r++) {
              const maxCols =
                r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
              for (let c = 0; c < maxCols; c++) {
                if (this.grid[r][c] === targetColor) {
                  this.grid[r][c] = null;
                  if (this.bubbleSprites[r][c]) {
                    const sprite = this.bubbleSprites[r][c]!;
                    this.playPopAnimation(
                      sprite.x + this.gameContainer.x,
                      sprite.y + this.gameContainer.y,
                      targetColor
                    );
                    sprite.destroy();
                    this.bubbleSprites[r][c] = null;
                  }
                }
              }
            }
          }
        }
        // Destroy self
        this.grid[pos.row][pos.col] = null;
        if (this.bubbleSprites[pos.row][pos.col]) {
          const sprite = this.bubbleSprites[pos.row][pos.col]!;
          this.playPopAnimation(
            sprite.x + this.gameContainer.x,
            sprite.y + this.gameContainer.y,
            "#FF6600"
          );
          sprite.destroy();
          this.bubbleSprites[pos.row][pos.col] = null;
        }
        this.removeFloatingBubbles();
        this.updateUI();
      } else if (bubble.isMagicGift) {
        // Hex Bubble (WitchKitty): Transform all bubbles of touched color to random colors
        const neighbors = this.getNeighbors(pos.row, pos.col);
        let closestNeighbor: { r: number; c: number; color: string } | null =
          null;
        let minDistance = Infinity;

        for (const n of neighbors) {
          if (this.grid[n.r][n.c]) {
            const { x: nx, y: ny } = this.getBubblePos(n.r, n.c);
            const worldNy = ny + this.ceilingOffset + this.GRID_OFFSET_Y;
            const dist = Phaser.Math.Distance.Between(
              bubble.x,
              bubble.y,
              nx,
              worldNy
            );
            if (dist < minDistance) {
              minDistance = dist;
              closestNeighbor = { r: n.r, c: n.c, color: this.grid[n.r][n.c]! };
            }
          }
        }

        if (closestNeighbor && closestNeighbor.color) {
          const targetColor = closestNeighbor.color;
          // Special bubbles are immune
          if (
            targetColor !== "ANCHOR" &&
            targetColor !== "SLIME" &&
            targetColor !== "STOP" &&
            targetColor !== "BOMB" &&
            targetColor !== "STONE"
          ) {
            const transformedPositions: { r: number; c: number }[] = [];
            const availableColors = GameSettings.colors.all.filter(
              (c) => c !== targetColor
            );

            // Transform all bubbles of target color
            for (let r = 0; r < this.GRID_HEIGHT; r++) {
              const maxCols =
                r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
              for (let c = 0; c < maxCols; c++) {
                if (this.grid[r][c] === targetColor) {
                  // Pick random new color (not the original)
                  const newColor =
                    availableColors[
                      Math.floor(Math.random() * availableColors.length)
                    ];
                  this.grid[r][c] = newColor;
                  transformedPositions.push({ r, c });

                  // Update sprite visually - destroy old and create new
                  if (this.bubbleSprites[r][c]) {
                    const oldSprite = this.bubbleSprites[r][c]!;
                    const spriteX = oldSprite.x;
                    const spriteY = oldSprite.y;
                    // Add sparkle effect before destroying
                    this.createHexParticles(
                      spriteX + this.gameContainer.x,
                      spriteY + this.gameContainer.y
                    );
                    oldSprite.destroy();
                    this.bubbleSprites[r][c] = null;
                    // Create new sprite with new color
                    this.createBubbleSprite(r, c, newColor);
                  }
                }
              }
            }

            // Check matches for all transformed bubbles
            this.time.delayedCall(300, () => {
              for (const pos of transformedPositions) {
                if (this.grid[pos.r] && this.grid[pos.r][pos.c]) {
                  this.checkAndRemoveMatches(pos.r, pos.c);
                }
              }
              this.showCharacterSpeech("MERRY!");
            });
          }
        }

        // Destroy self
        this.grid[pos.row][pos.col] = null;
        if (this.bubbleSprites[pos.row][pos.col]) {
          const sprite = this.bubbleSprites[pos.row][pos.col]!;
          this.playPopAnimation(
            sprite.x + this.gameContainer.x,
            sprite.y + this.gameContainer.y,
            "#FFD700"
          );
          sprite.destroy();
          this.bubbleSprites[pos.row][pos.col] = null;
        }
        this.removeFloatingBubbles();
        this.updateUI();
      } else {
        // Check if we hit a BOMB bubble (special bubble in grid)
        this.checkBombTrigger(pos.row, pos.col);
        this.checkAndRemoveMatches(pos.row, pos.col, bubble);
      }
    }

    if (bubble.sprite) {
      bubble.sprite.destroy();
    }

    // Check Ceiling Drop (only if ceiling is not frozen)
    // Progressive difficulty: Ceiling drops faster as level increases
    // Base is 10 shots. Decreases by 1 every level. Min 6 shots (cap to prevent impossible levels).
    if (!this.ceilingFrozen) {
      const shotsPerDrop = Math.max(
        6,
        GameSettings.gameplay.baseShotsPerCeilingDrop - (this.level - 1)
      );

      if (this.shotCount >= shotsPerDrop) {
        this.lowerCeiling();
        this.shotCount = 0;
      }
    }

    // Update Chameleons
    this.updateChameleons();
    // Update Slime Contagion
    this.updateSlime();

    // Check Game Over
    this.checkGameOver();
  }

  updateChameleons() {
    this.chameleonTurnCount++;
    // Chameleons change color every 2 shots
    if (this.chameleonTurnCount % 2 !== 0) return;

    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        const val = this.grid[r][c];
        if (val && val.startsWith("CHAMELEON:")) {
          // Get neighbor colors (only standard colors that are in contact)
          const neighbors = this.getNeighbors(r, c);
          const neighborColors: string[] = [];

          for (const n of neighbors) {
            const nVal = this.grid[n.r]?.[n.c];
            if (nVal && nVal.startsWith("#")) {
              neighborColors.push(nVal);
            }
          }

          // If no neighbor colors, keep current color
          if (neighborColors.length === 0) continue;

          // Pick random color from neighbors
          const newColor =
            neighborColors[Math.floor(Math.random() * neighborColors.length)];
          this.grid[r][c] = `CHAMELEON:${newColor}`;

          // Update Visual
          if (this.bubbleSprites[r][c]) {
            this.bubbleSprites[r][c]!.destroy();
            this.createBubbleSprite(r, c, this.grid[r][c]!);
          }
        }
      }
    }
  }

  findNearestEmptySpot(x: number, y: number) {
    // Simplified: Check grid cells around the point
    const candidates = [];
    const gridY = y - (this.ceilingOffset + this.GRID_OFFSET_Y);

    const centerRow = Math.floor(
      gridY / ((this.BUBBLE_SIZE * Math.sqrt(3)) / 2)
    );

    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      if (r < 0 || r >= this.GRID_HEIGHT) continue;
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (!this.grid[r][c]) {
          const { x: bx, y: by } = this.getBubblePos(r, c);
          // getBubblePos returns local coords, so we need to compare with local gridY/x?
          // No, getBubblePos returns coords relative to container (0,0).
          // gridY is relative to container (0,0).
          // x is world x. Container x is 0. So x is also local x.
          const dist = Phaser.Math.Distance.Between(x, gridY, bx, by);
          candidates.push({ r, c, dist });
        }
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    if (candidates.length > 0)
      return { row: candidates[0].r, col: candidates[0].c };
    return null;
  }

  isValidPos(row: number, col: number) {
    if (row < 0 || row >= this.GRID_HEIGHT) return false;
    const maxCols = row % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
    return col >= 0 && col < maxCols;
  }

  getWitchKittySpeech(originalText: string): string {
    // Map normal speech to Witch Kitty's magical versions
    const kittyTexts: { [key: string]: string[] } = {
      "NICE!": ["MEOW!", "PURRFECT!", "MAGICAL!"],
      "MEGA COMBO!": ["MEOWGICAL!", "WITCHY!", "SPELL TIME!"],
      "BOOM!": ["HEX BOOM!", "CURSED!", "BEWITCHED!"],
    };

    if (
      this.selectedCharacter?.id === "WitchKitty" &&
      kittyTexts[originalText]
    ) {
      const options = kittyTexts[originalText];
      return options[Math.floor(Math.random() * options.length)];
    }
    return originalText;
  }

  showCharacterSpeech(text: string) {
    const finalText = this.getWitchKittySpeech(text);
    if (finalText === this.lastSpeechText) return;
    this.lastSpeechText = finalText;

    const { width, height } = this.cameras.main;
    const x = 180; // Moved right (was 100)
    const y = height - 300; // Moved up significantly (was height - 100)

    const container = this.add.container(x, y);

    // Pixelated Speech Bubble Style
    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff, 1);
    bubble.fillRoundedRect(0, 0, 140, 50, 10);
    bubble.fillTriangle(20, 50, 40, 50, 20, 70); // Tail

    const txt = this.add
      .text(70, 25, text, {
        fontFamily: "Pixelify Sans",
        fontSize: "20px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([bubble, txt]);
    container.setAlpha(0);
    container.setScale(0);

    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: "Back.out",
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: container,
            alpha: 0,
            scale: 0,
            duration: 200,
            onComplete: () => {
              container.destroy();
              if (this.lastSpeechText === text) this.lastSpeechText = ""; // Reset after disappear
            },
          });
        });
      },
    });
  }

  checkBombTrigger(row: number, col: number) {
    // Check if any neighbor is a BOMB - if so, trigger explosion
    const neighbors = this.getNeighbors(row, col);

    for (const n of neighbors) {
      if (this.grid[n.r]?.[n.c] === "BOMB") {
        this.triggerBombExplosion(n.r, n.c);
      }
    }
  }

  triggerBombExplosion(bombRow: number, bombCol: number) {
    // Play explosion sound
    this.playSound("sfx_pop");

    // Get bomb position for visual effect
    const bombSprite = this.bubbleSprites[bombRow][bombCol];
    if (bombSprite) {
      this.playPopAnimation(
        bombSprite.x + this.gameContainer.x,
        bombSprite.y + this.gameContainer.y,
        "#FF3300"
      );
    }

    // Destroy the bomb itself
    this.grid[bombRow][bombCol] = null;
    if (this.bubbleSprites[bombRow][bombCol]) {
      this.bubbleSprites[bombRow][bombCol]!.destroy();
      this.bubbleSprites[bombRow][bombCol] = null;
    }

    // Destroy all neighbors
    const neighbors = this.getNeighbors(bombRow, bombCol);
    neighbors.forEach((n) => {
      const val = this.grid[n.r]?.[n.c];
      if (val) {
        // ANCHOR, SLIME, STOP are immune to explosion (BOMB triggers chain reaction separately)
        if (val === "ANCHOR" || val === "SLIME" || val === "STOP") return;

        // If neighbor is another BOMB, trigger chain reaction
        if (val === "BOMB") {
          this.time.delayedCall(100, () => {
            this.triggerBombExplosion(n.r, n.c);
          });
          return;
        }

        this.grid[n.r][n.c] = null;
        if (this.bubbleSprites[n.r][n.c]) {
          const sprite = this.bubbleSprites[n.r][n.c]!;
          this.playPopAnimation(
            sprite.x + this.gameContainer.x,
            sprite.y + this.gameContainer.y,
            val
          );
          sprite.destroy();
          this.bubbleSprites[n.r][n.c] = null;
        }
        this.score += 150; // Bonus points for bomb destruction
      }
    });

    this.removeFloatingBubbles();
    this.showCharacterSpeech("BOOM!");
    this.updateUI();
  }

  checkAndRemoveMatches(row: number, col: number, bubble?: Bubble) {
    const color = this.grid[row][col];
    if (
      !color ||
      color === "STONE" ||
      color === "ANCHOR" ||
      color === "SLIME" ||
      color === "BOMB"
    )
      return;

    // If Wild (Whitey), it matches with ANY neighbor color
    // Actually, usually Wild changes to the color it hits, or acts as a bridge.
    // Let's say it acts as a bridge. But for simplicity, if it's wild, we check matches for ALL neighbor colors.
    // Or simpler: If I am wild, I become the color of the first neighbor I find and trigger match.
    if (bubble && bubble.isWild) {
      const neighbors = this.getNeighbors(row, col);
      const neighborColors = neighbors
        .map((n) => this.grid[n.r][n.c])
        .filter((c) => c !== null);
      if (neighborColors.length > 0) {
        // Pick the first color found
        const targetColor = neighborColors[0]!;
        this.grid[row][col] = targetColor; // Transform to that color
        // Update sprite color
        if (this.bubbleSprites[row][col]) {
          // We need to access the circle inside the container
          const container = this.bubbleSprites[row][col] as any;
          const circle = container.list[0] as Phaser.GameObjects.Arc;
          circle.setFillStyle(
            Phaser.Display.Color.HexStringToColor(targetColor).color
          );
        }
        // Now check matches for that color
        this.checkAndRemoveMatches(row, col);
        return;
      }
    }

    const matches = this.getMatches(row, col, color);
    if (matches.length >= 3) {
      matches.forEach(({ r, c }) => {
        this.grid[r][c] = null;
        if (this.bubbleSprites[r][c]) {
          const sprite = this.bubbleSprites[r][c]!;
          this.playPopAnimation(
            sprite.x + this.gameContainer.x,
            sprite.y + this.gameContainer.y,
            this.grid[r][c] === "PRISM" ? "#FFFFFF" : color
          );
          sprite.destroy();
          this.bubbleSprites[r][c] = null;
        }
      });
      this.removeFloatingBubbles();
      this.score += matches.length * 100;

      // Character Speech Logic
      if (matches.length >= 8) {
        this.showCharacterSpeech("MEGA COMBO!");
      } else if (matches.length >= 5) {
        this.showCharacterSpeech("NICE!");
      }

      this.updateUI();
    }
  }

  getMatches(row: number, col: number, color: string) {
    const matches: { r: number; c: number }[] = [];
    const visited = new Set<string>();
    const queue = [{ r: row, c: col }];

    // Helper to extract base color from special types like CHAMELEON
    const getBaseColor = (val: string) => {
      if (val.startsWith("CHAMELEON:")) {
        return val.split(":")[1];
      }
      return val;
    };

    const targetBaseColor = getBaseColor(color);

    while (queue.length > 0) {
      const { r, c } = queue.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const currentVal = this.grid[r][c];
      if (!currentVal) continue;

      const currentBaseColor = getBaseColor(currentVal);

      // PRISM matches with ANY color (except Stone/Anchor/Slime)
      const isPrism = currentVal === "PRISM";
      const isTargetPrism = targetBaseColor === "PRISM";

      // Valid match if colors match OR one of them is a Prism
      // But Prisms don't match with Stone/Anchor/Slime
      const isValidMatch =
        currentBaseColor === targetBaseColor ||
        (isPrism &&
          targetBaseColor !== "STONE" &&
          targetBaseColor !== "ANCHOR" &&
          targetBaseColor !== "SLIME") ||
        (isTargetPrism &&
          currentBaseColor !== "STONE" &&
          currentBaseColor !== "ANCHOR" &&
          currentBaseColor !== "SLIME");

      if (isValidMatch) {
        matches.push({ r, c });
        const neighbors = this.getNeighbors(r, c);
        neighbors.forEach((n) => {
          if (this.grid[n.r] && this.grid[n.r][n.c]) {
            // Add neighbors to queue to check them
            queue.push(n);
          }
        });
      }
    }
    return matches;
  }

  getNeighbors(row: number, col: number) {
    const isOdd = row % 2 === 1;
    const offsets = [
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
      { r: row - 1, c: isOdd ? col + 1 : col - 1 },
      { r: row + 1, c: isOdd ? col + 1 : col - 1 },
    ];
    return offsets.filter((n) => this.isValidPos(n.r, n.c));
  }

  checkLevelComplete() {
    // Check if grid is empty
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c]) return false;
      }
    }
    return true;
  }

  removeFloatingBubbles() {
    const connected = new Set<string>();
    const queue = [];

    // Start from top row AND Anchors
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (r === 0 && this.grid[r][c]) {
          queue.push({ r, c });
        } else if (this.grid[r][c] === "ANCHOR") {
          // Anchors act as roots too
          queue.push({ r, c });
        }
      }
    }

    while (queue.length > 0) {
      const { r, c } = queue.pop()!;
      const key = `${r},${c}`;
      if (connected.has(key)) continue;
      connected.add(key);

      const neighbors = this.getNeighbors(r, c);
      neighbors.forEach((n) => {
        if (this.grid[n.r][n.c]) {
          queue.push(n);
        }
      });
    }

    // Remove unconnected
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c] && !connected.has(`${r},${c}`)) {
          const color = this.grid[r][c]!;

          // Check if STOP bubble is falling - freeze ceiling for entire level
          if (color === "STOP") {
            this.ceilingFrozen = true;
            this.showFreezeEffect();
          }

          this.grid[r][c] = null;
          if (this.bubbleSprites[r][c]) {
            const sprite = this.bubbleSprites[r][c]!;
            this.playPopAnimation(
              sprite.x + this.gameContainer.x,
              sprite.y + this.gameContainer.y,
              color
            );
            sprite.destroy();
            this.bubbleSprites[r][c] = null;
          }
          this.score += 200;
        }
      }
    }

    // Check for Isolated Anchors (Anchors with no neighbors)
    // We do this AFTER removing floating bubbles, because an anchor might have lost its neighbors just now.
    let anchorDestroyed = false;
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c] === "ANCHOR") {
          const neighbors = this.getNeighbors(r, c);
          const hasNeighbors = neighbors.some((n) => this.grid[n.r][n.c]);
          if (!hasNeighbors) {
            // Destroy isolated anchor
            this.grid[r][c] = null;
            if (this.bubbleSprites[r][c]) {
              const sprite = this.bubbleSprites[r][c]!;
              this.playPopAnimation(
                sprite.x + this.gameContainer.x,
                sprite.y + this.gameContainer.y,
                "ANCHOR"
              );
              sprite.destroy();
              this.bubbleSprites[r][c] = null;
            }
            anchorDestroyed = true;
          }
        }
      }
    }

    // If we destroyed an anchor, we might have created new floating bubbles (if that anchor was holding them)
    // So we should recurse, but be careful of infinite loops.
    // Actually, if an anchor was holding something, it had neighbors.
    // If it had neighbors, it wouldn't be destroyed here.
    // It is only destroyed if it has NO neighbors.
    // So destroying it won't cause anything else to fall.
    // Safe.

    if (this.checkLevelComplete()) {
      this.gameStarted = false;

      // Calculate level completion bonus with time multiplier
      const baseBonus = 5000;
      const maxTime = GameSettings.gameplay.levelTime;
      const timeMultiplier = 1 + this.levelTime / maxTime; // 1.0 to 2.0
      const levelBonus = Math.floor(baseBonus * timeMultiplier);
      this.score += levelBonus;

      // Show bonus text
      const bonusText = this.add
        .text(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2,
          `LEVEL ${
            this.level
          } CLEAR!\n+${levelBonus} (x${timeMultiplier.toFixed(1)})`,
          {
            fontSize: "32px",
            color: "#B7FF00",
            fontFamily: "Pixelify Sans",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4,
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setDepth(100);

      this.level++;
      this.playSound("sfx_level_complete", { volume: 0.4 });
      this.updateUI();

      this.time.delayedCall(1000, () => {
        bonusText.destroy();
        this.startLevel();
      });
    }
  }

  lowerCeiling() {
    // Check if freeze power-up is active
    if (this.freezeActive || this.ceilingFrozen) {
      return;
    }

    this.ceilingOffset += (this.BUBBLE_SIZE * Math.sqrt(3)) / 2;
    this.drawCeiling();

    // Check if this caused game over (with delay so player sees bubbles cross the line)
    this.checkGameOverWithDelay();
  }

  checkGameOverWithDelay() {
    // Check if any bubble crossed the line
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c]) {
          const { y } = this.getBubblePos(r, c);
          if (y + this.ceilingOffset + this.GRID_OFFSET_Y > this.LIMIT_LINE_Y) {
            // Bubble crossed the line - wait a moment so player sees it, then game over
            this.time.delayedCall(500, () => {
              this.handleGameOver("GAME OVER");
            });
            return;
          }
        }
      }
    }
  }

  showFreezeEffect() {
    // Visual feedback when ceiling is frozen
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Flash effect
    const flash = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x87ceeb,
      0.5
    );
    flash.setDepth(50);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 800,
      onComplete: () => flash.destroy(),
    });

    // Freeze text - centered, larger, more legible
    const freezeText = this.add.text(width / 2, height / 2, "CEILING FROZEN!", {
      fontSize: "52px",
      color: "#ffffff",
      fontFamily: "Pixelify Sans",
      fontStyle: "bold",
      stroke: "#0077be",
      strokeThickness: 8,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: "#004466",
        blur: 5,
        fill: true,
      },
    });
    freezeText.setOrigin(0.5);
    freezeText.setDepth(51);

    // Scale in animation
    freezeText.setScale(0);
    this.tweens.add({
      targets: freezeText,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        // Hold for a moment then fade out
        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: freezeText,
            alpha: 0,
            scale: 1.2,
            duration: 500,
            ease: "Power2",
            onComplete: () => freezeText.destroy(),
          });
        });
      },
    });

    // Create persistent ice line between ceiling and bubbles
    this.createFrostLine();

    // Play a sound if available
    this.playSound("sfx_pop");
  }

  createFrostLine() {
    const width = this.cameras.main.width;
    const iceLineY = this.GRID_OFFSET_Y + this.ceilingOffset - 10;

    // Container for frost line elements
    const frostContainer = this.add.container(0, iceLineY);
    frostContainer.setDepth(15);
    (this as any).frostLineContainer = frostContainer; // Store reference to destroy on level reset

    // Main ice line
    const iceLine = this.add.graphics();
    iceLine.lineStyle(4, 0x87ceeb, 0.9);
    iceLine.beginPath();
    iceLine.moveTo(0, 0);
    iceLine.lineTo(width, 0);
    iceLine.strokePath();

    // Gradient glow effect
    const glowLine = this.add.graphics();
    glowLine.lineStyle(12, 0xadd8e6, 0.3);
    glowLine.beginPath();
    glowLine.moveTo(0, 0);
    glowLine.lineTo(width, 0);
    glowLine.strokePath();

    frostContainer.add([glowLine, iceLine]);

    // Add icicles
    const icicleCount = Math.floor(width / 30);
    for (let i = 0; i < icicleCount; i++) {
      const x = (i + 0.5) * (width / icicleCount) + Phaser.Math.Between(-5, 5);
      const icicleHeight = Phaser.Math.Between(8, 18);

      const icicle = this.add.graphics();
      icicle.fillStyle(0xb0e0e6, 0.8);
      icicle.beginPath();
      icicle.moveTo(x - 3, 0);
      icicle.lineTo(x + 3, 0);
      icicle.lineTo(x, icicleHeight);
      icicle.closePath();
      icicle.fillPath();

      frostContainer.add(icicle);
    }

    // Add frost particles that float along the line
    for (let i = 0; i < 8; i++) {
      const particle = this.add.star(
        Phaser.Math.Between(20, width - 20),
        Phaser.Math.Between(-5, 5),
        6,
        1,
        3,
        0xffffff,
        0.7
      );
      frostContainer.add(particle);

      // Animate particles floating
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-50, 50),
        alpha: { from: 0.7, to: 0.2 },
        scale: { from: 1, to: 1.5 },
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Pulsing glow animation on the main line
    this.tweens.add({
      targets: glowLine,
      alpha: { from: 0.3, to: 0.6 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  checkGameOver() {
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c]) {
          const { y } = this.getBubblePos(r, c);
          // Check if bubble crosses the limit line (with small margin for visual clarity)
          if (
            y + this.ceilingOffset + this.GRID_OFFSET_Y >
            this.LIMIT_LINE_Y + this.BUBBLE_SIZE / 4
          ) {
            // Small delay so player sees the bubble cross the line
            this.time.delayedCall(300, () => {
              this.handleGameOver("GAME OVER");
            });
            return;
          }
        }
      }
    }
  }

  handleGameOver(message: string) {
    if (this.gameOver) return;

    // Check if Extra Life is available
    if (this.hasExtraLife && !this.extraLifeUsed) {
      this.useExtraLife();
      return;
    }

    this.gameOver = true;
    if (this.timerEvent) this.timerEvent.remove();
    this.playSound("sfx_game_over");

    // Stop background music
    if (this.currentMusic) this.currentMusic.stop();

    // SDK: Call gameOver with the final score
    if (window.FarcadeSDK) {
      window.FarcadeSDK.singlePlayer.actions.gameOver({ score: this.score });
    }
  }

  /**
   * Use the Extra Life power-up to restart the current level
   */
  useExtraLife() {
    this.extraLifeUsed = true;
    this.hasExtraLife = false;

    // Show revival message
    const { width, height } = this.cameras.main;
    const reviveText = this.add
      .text(width / 2, height / 2, "❤️ EXTRA LIFE! ❤️", {
        fontFamily: "Pixelify Sans",
        fontSize: "48px",
        color: "#FF4444",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.tweens.add({
      targets: reviveText,
      alpha: 0,
      y: height / 2 - 100,
      duration: 2000,
      onComplete: () => {
        reviveText.destroy();
        // Restart the level with the starting score
        this.restartLevel();
      },
    });
  }

  /**
   * Restart the current level (used by Extra Life)
   */
  restartLevel() {
    // Reset game state but keep level
    this.score = this.levelStartScore;
    this.gameOver = false;
    this.gameStarted = false;

    // Call startLevel which handles everything
    this.startLevel();
  }

  /**
   * Activate a power-up by ID
   */
  activatePowerup(powerupId: string) {
    if (!this.gameStarted || this.gameOver) return;

    const { width, height } = this.cameras.main;

    switch (powerupId) {
      case "extraLife":
        // Extra life is passive - activates on game over
        if (this.hasExtraLife && !this.extraLifeUsed) {
          this.showPowerupMessage("❤️ Extra Life is ready!");
        }
        break;

      case "stopClock":
        if (this.hasStopClock && !this.stopClockUsed && !this.stopClockActive) {
          this.stopClockUsed = true;
          this.stopClockActive = true;
          this.hasStopClock = false;
          if (this.timerEvent) this.timerEvent.paused = true;
          this.showPowerupMessage("⏱️ Time Stopped!");
          this.timerText.setColor("#00FFFF");
        }
        break;

      case "freeze":
        if (this.hasFreeze && !this.freezeUsed && !this.freezeActive) {
          this.freezeUsed = true;
          this.freezeActive = true;
          this.hasFreeze = false;
          this.ceilingFrozen = true;
          this.showPowerupMessage("❄️ Ceiling Frozen!");
        }
        break;
    }
  }

  /**
   * Show a power-up activation message
   */
  showPowerupMessage(message: string) {
    const { width, height } = this.cameras.main;
    const msgText = this.add
      .text(width / 2, height * 0.3, message, {
        fontFamily: "Pixelify Sans",
        fontSize: "36px",
        color: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(150);

    this.tweens.add({
      targets: msgText,
      alpha: 0,
      y: height * 0.25,
      duration: 1500,
      onComplete: () => msgText.destroy(),
    });
  }

  onTimerTick() {
    if (!this.gameStarted || this.gameOver) return;

    this.levelTime--;
    this.updateUI();

    if (this.levelTime <= 0) {
      this.handleGameOver("TIME UP");
    }
  }

  updateUI() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.levelText.setText(`L: ${this.level}`);
    this.timerText.setText(`Time: ${this.levelTime}s`);
    if (this.levelTime <= 10) {
      this.timerText.setColor("#FF0000");
    } else {
      this.timerText.setColor("#B7FF00");
    }

    this.nextBubblePreviews.forEach((preview, idx) => {
      if (this.nextBubbles[idx]) {
        // Destroy old preview and create new one with correct color/style
        const x = preview.x;
        const y = preview.y;
        preview.destroy();
        this.nextBubblePreviews[idx] = this.createBubbleVisual(
          x,
          y,
          35,
          this.nextBubbles[idx]
        );
      }
    });
  }

  playPopAnimation(x: number, y: number, color: string) {
    this.playSound("sfx_pop", {
      volume: 0.4,
      rate: Phaser.Math.FloatBetween(0.9, 1.1),
    });

    let particleColor = 0xffffff;
    if (color === "STONE") {
      particleColor = 0x555555; // Grey particles for stone
    } else if (color === "ANCHOR") {
      particleColor = 0xff8c00; // Orange particles for anchor
    } else {
      particleColor = Phaser.Display.Color.HexStringToColor(color).color;
    }

    // Particles Explosion
    const particles = this.add.particles(x, y, "particle", {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      blendMode: "ADD",
      tint: particleColor,
      quantity: 20,
      emitting: false,
      gravityY: 300,
    });

    particles.explode(20);

    // Auto destroy particles after lifespan
    this.time.delayedCall(700, () => {
      particles.destroy();
    });
  }

  applySkillVisuals(bubble: Bubble, charId: string) {
    if (
      !bubble.sprite ||
      !(bubble.sprite instanceof Phaser.GameObjects.Container)
    )
      return;

    const container = bubble.sprite;
    container.removeAll(true); // Clear existing visuals

    const size = this.BUBBLE_SIZE;

    if (charId === "Pinky") {
      // Color Blast: Textured Orange Plasma Sphere
      // 1. Strong Outer Glow
      const glow = this.add.circle(0, 0, size / 1.2, 0xff4400, 0.6);
      this.tweens.add({
        targets: glow,
        alpha: 0.2,
        scale: 1.4,
        yoyo: true,
        repeat: -1,
        duration: 400,
      });

      // 2. Main Body (Orange)
      const bg = this.add.circle(0, 0, size / 2, 0xff6600);

      // 3. Texture (Plasma spots)
      const texture = this.add.graphics();
      texture.fillStyle(0xffaa00, 0.8); // Lighter orange/yellow spots
      for (let i = 0; i < 5; i++) {
        const rx = Phaser.Math.Between(-size / 3, size / 3);
        const ry = Phaser.Math.Between(-size / 3, size / 3);
        const r = Phaser.Math.Between(2, 5);
        texture.fillCircle(rx, ry, r);
      }

      // 4. Inner Core (Bright Yellow/White)
      const core = this.add.circle(0, 0, size / 4, 0xffffaa);
      this.tweens.add({
        targets: core,
        alpha: 0.8,
        scale: 1.1,
        yoyo: true,
        repeat: -1,
        duration: 200,
      });

      // 5. Rotating Ring (Energy containment)
      const ring = this.add.graphics();
      ring.lineStyle(2, 0xffffff, 0.8);
      ring.strokeCircle(0, 0, size / 2 + 2);

      // Add rotation to the whole container in update loop, but we can add a tween here for the ring if we separated it.
      // Since we add everything to 'container', the whole thing rotates in update().

      container.add([glow, bg, texture, core, ring]);
    } else if (charId === "Bluey") {
      // Bomb Shot: Void / Dark Matter Sphere
      // 1. Eerie Glow (Dark Purple/Blue)
      const glow = this.add.circle(0, 0, size / 1.2, 0x2a0055, 0.7); // Deep purple
      this.tweens.add({
        targets: glow,
        alpha: 0.2,
        scale: 1.5,
        yoyo: true,
        repeat: -1,
        duration: 1200, // Slow breathing
      });

      // 2. Main Body (Pure Black)
      const bg = this.add.circle(0, 0, size / 2, 0x000000);
      bg.setStrokeStyle(2, 0x5500aa); // Purple stroke

      // 3. Texture (Shadowy Tendrils/Cracks)
      const texture = this.add.graphics();
      texture.lineStyle(2, 0xaa00ff, 0.5); // Bright purple lines
      for (let i = 0; i < 4; i++) {
        // Random jagged lines
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = size / 2.5;
        texture.moveTo(0, 0);
        texture.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      texture.strokePath();

      // 4. Core (Unstable Red Eye/Core)
      const core = this.add.circle(0, 0, size / 4, 0x330000); // Dark Red
      const coreInner = this.add.circle(0, 0, size / 6, 0xff0000); // Bright Red

      this.tweens.add({
        targets: coreInner,
        alpha: 0.4,
        scale: 1.2,
        yoyo: true,
        repeat: -1,
        duration: 200, // Fast flicker
      });

      container.add([glow, bg, texture, core, coreInner]);
    } else if (charId === "Whitey") {
      // Ice Lance: Sharp Crystal Projectile
      // 1. Trail/Glow (Cold Blue)
      const glow = this.add.circle(0, 0, size / 1.2, 0x00ffff, 0.5);
      this.tweens.add({
        targets: glow,
        scaleX: 0.8,
        scaleY: 1.2,
        alpha: 0.3,
        yoyo: true,
        repeat: -1,
        duration: 300,
      });

      // 2. Main Body (Ice Crystal Shape - Diamond/Rhombus)
      const crystal = this.add.graphics();
      crystal.fillStyle(0xccffff, 0.9); // Pale Ice Blue
      crystal.lineStyle(2, 0xffffff);

      // Draw a diamond shape
      const halfSize = size / 2;
      crystal.beginPath();
      crystal.moveTo(0, -halfSize - 10); // Top tip (sharp)
      crystal.lineTo(halfSize, 0);
      crystal.lineTo(0, halfSize + 10); // Bottom tip
      crystal.lineTo(-halfSize, 0);
      crystal.closePath();
      crystal.fillPath();
      crystal.strokePath();

      // 3. Inner Core (Bright White)
      const core = this.add.circle(0, 0, size / 4, 0xffffff);

      // Rotate the container to match velocity direction in update loop?
      // Actually, we can just rotate the container 90 degrees initially if it points up,
      // but the bubble rotation logic in update() might interfere.
      // For now, let's make it a spinning crystal.

      container.add([glow, crystal, core]);
    } else if (charId === "WitchKitty") {
      // Hex Bubble: Mystical cursed orb with witch vibes
      const halfSize = size / 2;

      // 1. Outer magical aura (purple/green witch effect)
      const aura = this.add.graphics();
      aura.lineStyle(3, 0x9932cc, 0.6); // Dark orchid purple
      aura.strokeCircle(0, 0, halfSize + 8);
      aura.lineStyle(2, 0x00ff88, 0.4); // Witch green
      aura.strokeCircle(0, 0, halfSize + 12);
      this.tweens.add({
        targets: aura,
        rotation: Math.PI * 2,
        duration: 3000,
        repeat: -1,
        ease: "Linear",
      });

      // 2. Mystical sphere (dark purple gradient)
      const outerGlass = this.add.circle(0, 0, halfSize + 2, 0x4b0082, 0.8); // Indigo
      outerGlass.setStrokeStyle(3, 0x00ff88); // Witch green border

      const innerGlass = this.add.circle(0, 0, halfSize - 2, 0x8b008b, 0.9); // Dark magenta

      // 3. Shine/reflection (mystical effect)
      const shine = this.add.graphics();
      shine.fillStyle(0xffffff, 0.7);
      shine.fillEllipse(-halfSize / 3, -halfSize / 3, 8, 12);
      shine.fillStyle(0xffffff, 0.4);
      shine.fillEllipse(-halfSize / 4, -halfSize / 4 + 8, 4, 6);

      // 4. Inner pentagram (witch symbol)
      const pentagram = this.add.graphics();
      pentagram.lineStyle(2, 0x00ff88, 0.9); // Witch green
      const points = 5;
      const outerRadius = halfSize / 2.2;
      pentagram.beginPath();
      for (let i = 0; i < points; i++) {
        const angle = (i * 4 * Math.PI) / points - Math.PI / 2;
        const x = Math.cos(angle) * outerRadius;
        const y = Math.sin(angle) * outerRadius;
        if (i === 0) {
          pentagram.moveTo(x, y);
        } else {
          pentagram.lineTo(x, y);
        }
      }
      pentagram.closePath();
      pentagram.strokePath();

      // Pentagram glow
      this.tweens.add({
        targets: pentagram,
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 0.5,
        yoyo: true,
        repeat: -1,
        duration: 500,
        ease: "Sine.easeInOut",
      });

      // 5. Floating magic sparkles inside
      const sparkles = this.add.graphics();
      const sparklePositions = [
        { x: -8, y: -5, color: 0x00ff88 },
        { x: 10, y: 8, color: 0x9932cc },
        { x: -5, y: 12, color: 0x00ff88 },
        { x: 8, y: -10, color: 0x9932cc },
        { x: -12, y: 3, color: 0xffffff },
        { x: 3, y: -8, color: 0xffffff },
      ];
      sparklePositions.forEach((pos) => {
        sparkles.fillStyle(pos.color, 0.9);
        sparkles.fillCircle(pos.x, pos.y, 2);
      });
      this.tweens.add({
        targets: sparkles,
        rotation: Math.PI * 2,
        alpha: 0.4,
        yoyo: true,
        repeat: -1,
        duration: 1200,
        ease: "Sine.easeInOut",
      });

      // 6. Cat ear silhouettes (witch kitty theme)
      const ears = this.add.graphics();
      ears.fillStyle(0x9932cc, 0.8); // Purple ears
      // Left ear
      ears.beginPath();
      ears.moveTo(-halfSize + 2, -halfSize + 8);
      ears.lineTo(-halfSize + 10, -halfSize - 8);
      ears.lineTo(-halfSize + 18, -halfSize + 8);
      ears.closePath();
      ears.fillPath();
      // Right ear
      ears.beginPath();
      ears.moveTo(halfSize - 18, -halfSize + 8);
      ears.lineTo(halfSize - 10, -halfSize - 8);
      ears.lineTo(halfSize - 2, -halfSize + 8);
      ears.closePath();
      ears.fillPath();

      container.add([
        aura,
        outerGlass,
        innerGlass,
        shine,
        pentagram,
        sparkles,
        ears,
      ]);
    }
  }

  updateSlime() {
    this.slimeTurnCount++;
    // Contagion happens every 6 shots (slower spread)
    if (this.slimeTurnCount % 6 !== 0) return;

    const allCandidates: { r: number; c: number }[] = [];

    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c] === "SLIME") {
          // Find valid neighbors to infect
          const neighbors = this.getNeighbors(r, c);
          const candidates = neighbors.filter((n) => {
            // Must be a valid grid position
            if (!this.isValidPos(n.r, n.c)) return false;
            // Must have a bubble
            const val = this.grid[n.r][n.c];
            if (!val) return false;
            // Must NOT be row 0 (Ceiling immunity)
            if (n.r === 0) return false;
            // Must NOT be special (Stone, Anchor, Slime, Chameleon, Prism)
            if (
              val === "STONE" ||
              val === "ANCHOR" ||
              val === "SLIME" ||
              val === "PRISM" ||
              val.startsWith("CHAMELEON:")
            )
              return false;
            return true;
          });

          allCandidates.push(...candidates);
        }
      }
    }

    // Infect EXACTLY ONE random neighbor per turn (if possible)
    if (allCandidates.length > 0) {
      const victim =
        allCandidates[Math.floor(Math.random() * allCandidates.length)];

      // Double check it hasn't been removed or changed in the meantime
      if (this.grid[victim.r][victim.c]) {
        this.grid[victim.r][victim.c] = "SLIME";
        if (this.bubbleSprites[victim.r][victim.c]) {
          this.bubbleSprites[victim.r][victim.c]!.destroy();
          this.createBubbleSprite(victim.r, victim.c, "SLIME");
        }
      }
    }
  }

  cureSlime(row: number, col: number, newColor: string) {
    // Visual effect for curing
    if (this.bubbleSprites[row][col]) {
      const sprite = this.bubbleSprites[row][col]!;
      // Play a small transformation effect
      this.tweens.add({
        targets: sprite,
        scale: 1.2,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          sprite.destroy();
          // Create new bubble
          this.grid[row][col] = newColor;
          this.createBubbleSprite(row, col, newColor);
          // Check for matches immediately
          this.checkAndRemoveMatches(row, col);
        },
      });
    } else {
      // Fallback if no sprite
      this.grid[row][col] = newColor;
      this.createBubbleSprite(row, col, newColor);
      this.checkAndRemoveMatches(row, col);
    }
    this.playSound("sfx_pop", { volume: 0.5, rate: 1.5 }); // Higher pitch pop
  }

  // Helper to place a single special bubble
  placeSpecialBubble(type: string, initialRows: number): boolean {
    let attempts = 0;
    while (attempts < 100) {
      // Row > 0 for SLIME, STONE, ANCHOR, and STOP (not on ceiling - must be droppable)
      const minRow =
        type === "SLIME" ||
        type === "STONE" ||
        type === "ANCHOR" ||
        type === "STOP"
          ? 1
          : 0;
      const r = Phaser.Math.Between(minRow, initialRows - 1);
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      const c = Phaser.Math.Between(0, maxCols - 1);

      // Must have an existing bubble AND not already be special
      const current = this.grid[r][c];
      if (current && current.startsWith("#")) {
        // For STONE: Check no adjacent stones
        if (type === "STONE") {
          const neighbors = this.getNeighbors(r, c);
          const hasAdjacentStone = neighbors.some(
            (n) => this.grid[n.r]?.[n.c] === "STONE"
          );
          if (hasAdjacentStone) {
            attempts++;
            continue;
          }
        }

        if (this.bubbleSprites[r][c]) this.bubbleSprites[r][c]!.destroy();

        // For Chameleon, we need a base color
        if (type === "CHAMELEON") {
          const baseColor =
            GameSettings.colors.all[
              Math.floor(Math.random() * GameSettings.colors.all.length)
            ];
          this.grid[r][c] = `CHAMELEON:${baseColor}`;
        } else {
          this.grid[r][c] = type;
        }

        this.createBubbleSprite(r, c, this.grid[r][c]!);
        return true;
      }
      attempts++;
    }
    return false;
  }

  // Level progression logic for special bubbles
  placeSpecialBubblesForLevel(initialRows: number) {
    // Phase 1: Tutorial (Levels 1-7) - One new bubble type per level
    // Phase 2: Mix of 2 (Levels 8-12)
    // Phase 3: Mix of 3 (Levels 13+) - Rotating combinations indefinitely

    switch (this.level) {
      // === PHASE 1: TUTORIAL (1 type each) ===
      case 1:
        // PRISM: 2-4
        for (let i = 0; i < Phaser.Math.Between(2, 4); i++) {
          this.placeSpecialBubble("PRISM", initialRows);
        }
        break;

      case 2:
        // BOMB: 2-3
        for (let i = 0; i < Phaser.Math.Between(2, 3); i++) {
          this.placeSpecialBubble("BOMB", initialRows);
        }
        break;

      case 3:
        // STONE: 5-7
        for (let i = 0; i < Phaser.Math.Between(5, 7); i++) {
          this.placeSpecialBubble("STONE", initialRows);
        }
        break;

      case 4:
        // STOP: 1
        this.placeSpecialBubble("STOP", initialRows);
        break;

      case 5:
        // CHAMELEON: 5-7
        for (let i = 0; i < Phaser.Math.Between(5, 7); i++) {
          this.placeSpecialBubble("CHAMELEON", initialRows);
        }
        break;

      case 6:
        // ANCHOR: 1-2
        for (let i = 0; i < Phaser.Math.Between(1, 2); i++) {
          this.placeSpecialBubble("ANCHOR", initialRows);
        }
        break;

      case 7:
        // SLIME: 1
        this.placeSpecialBubble("SLIME", initialRows);
        break;

      // === PHASE 2: MIX OF 2 ===
      case 8:
        // PRISM + BOMB
        for (let i = 0; i < Phaser.Math.Between(2, 3); i++) {
          this.placeSpecialBubble("PRISM", initialRows);
        }
        for (let i = 0; i < 2; i++) {
          this.placeSpecialBubble("BOMB", initialRows);
        }
        break;

      case 9:
        // STONE + STOP
        for (let i = 0; i < Phaser.Math.Between(4, 5); i++) {
          this.placeSpecialBubble("STONE", initialRows);
        }
        this.placeSpecialBubble("STOP", initialRows);
        break;

      case 10:
        // CHAMELEON + BOMB
        for (let i = 0; i < Phaser.Math.Between(4, 5); i++) {
          this.placeSpecialBubble("CHAMELEON", initialRows);
        }
        for (let i = 0; i < 2; i++) {
          this.placeSpecialBubble("BOMB", initialRows);
        }
        break;

      case 11:
        // ANCHOR + PRISM
        for (let i = 0; i < Phaser.Math.Between(1, 2); i++) {
          this.placeSpecialBubble("ANCHOR", initialRows);
        }
        for (let i = 0; i < Phaser.Math.Between(2, 3); i++) {
          this.placeSpecialBubble("PRISM", initialRows);
        }
        break;

      case 12:
        // SLIME + STOP
        this.placeSpecialBubble("SLIME", initialRows);
        this.placeSpecialBubble("STOP", initialRows);
        break;

      // === PHASE 3: MIX OF 3 (Rotating indefinitely) ===
      default: {
        // Calculate which combination to use (rotating through options)
        const combo = (this.level - 13) % 6;

        switch (combo) {
          case 0:
            // STONE + BOMB + PRISM
            for (let i = 0; i < Phaser.Math.Between(3, 4); i++) {
              this.placeSpecialBubble("STONE", initialRows);
            }
            for (let i = 0; i < 2; i++) {
              this.placeSpecialBubble("BOMB", initialRows);
            }
            for (let i = 0; i < 2; i++) {
              this.placeSpecialBubble("PRISM", initialRows);
            }
            break;

          case 1:
            // CHAMELEON + ANCHOR + STOP
            for (let i = 0; i < Phaser.Math.Between(3, 4); i++) {
              this.placeSpecialBubble("CHAMELEON", initialRows);
            }
            this.placeSpecialBubble("ANCHOR", initialRows);
            this.placeSpecialBubble("STOP", initialRows);
            break;

          case 2:
            // SLIME + STONE + BOMB
            this.placeSpecialBubble("SLIME", initialRows);
            for (let i = 0; i < Phaser.Math.Between(3, 4); i++) {
              this.placeSpecialBubble("STONE", initialRows);
            }
            for (let i = 0; i < 2; i++) {
              this.placeSpecialBubble("BOMB", initialRows);
            }
            break;

          case 3:
            // PRISM + CHAMELEON + ANCHOR
            for (let i = 0; i < 2; i++) {
              this.placeSpecialBubble("PRISM", initialRows);
            }
            for (let i = 0; i < Phaser.Math.Between(3, 4); i++) {
              this.placeSpecialBubble("CHAMELEON", initialRows);
            }
            this.placeSpecialBubble("ANCHOR", initialRows);
            break;

          case 4:
            // BOMB + STOP + SLIME
            for (let i = 0; i < 2; i++) {
              this.placeSpecialBubble("BOMB", initialRows);
            }
            this.placeSpecialBubble("STOP", initialRows);
            this.placeSpecialBubble("SLIME", initialRows);
            break;

          case 5:
            // STONE + CHAMELEON + PRISM
            for (let i = 0; i < Phaser.Math.Between(3, 4); i++) {
              this.placeSpecialBubble("STONE", initialRows);
            }
            for (let i = 0; i < Phaser.Math.Between(3, 4); i++) {
              this.placeSpecialBubble("CHAMELEON", initialRows);
            }
            for (let i = 0; i < 2; i++) {
              this.placeSpecialBubble("PRISM", initialRows);
            }
            break;
        }
        break;
      }
    }
  }
}
