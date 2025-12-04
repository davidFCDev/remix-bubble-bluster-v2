import * as Phaser from "phaser";
import GameSettings from "../config/GameSettings";

interface Bubble {
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  moving: boolean;
  isSpecial?: boolean;
  isWild?: boolean;
  isBomb?: boolean;
  sprite?:
    | Phaser.GameObjects.Arc
    | Phaser.GameObjects.Sprite
    | Phaser.GameObjects.Container;
}

export class GameScene extends Phaser.Scene {
  private grid: (string | null)[][] = [];
  private bubbleSprites: (Phaser.GameObjects.Arc | null)[][] = [];
  private currentBubble: Bubble | null = null;
  private flyingBubbles: Bubble[] = [];
  private nextBubbles: string[] = [];
  private launcherAngle: number = Math.PI / 2;
  private score: number = 0;
  private level: number = 1;
  private ceilingOffset: number = 0;
  private shotCount: number = 0;
  private gameOver: boolean = false;
  private gameStarted: boolean = false;
  private selectedCharacter: any = null;
  private abilityAvailable: boolean = true;
  private whiteyWildShotsLeft: number = 0;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private nextBubblePreviews: Phaser.GameObjects.Container[] = [];
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private ceilingGraphics!: Phaser.GameObjects.Graphics;
  private gameContainer!: Phaser.GameObjects.Container;
  private skillBtn!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: any;
  private characterSprite!: Phaser.GameObjects.Sprite;
  private arrowGraphics!: Phaser.GameObjects.Graphics;
  private limitLineGraphics!: Phaser.GameObjects.Graphics;
  private launcherSpeed: number = 0;

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
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.gameStarted = false;
    this.ceilingOffset = 0;
    this.shotCount = 0;
    this.abilityAvailable = true;
    this.whiteyWildShotsLeft = 0;
    this.launcherAngle = Math.PI / 2;
  }

  create() {
    const { width, height } = this.cameras.main;
    this.BUBBLE_SIZE = width / this.GRID_WIDTH;
    this.LIMIT_LINE_Y = height - 200;

    // Background
    this.add
      .image(width / 2, height / 2, "background")
      .setDisplaySize(width, height);

    // Background Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);

    // Limit Line
    this.limitLineGraphics = this.add.graphics();
    this.drawLimitLine();

    // Generate Particle Texture
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("particle", 8, 8);

    // Game Container (for grid and bubbles)
    this.gameContainer = this.add.container(0, this.GRID_OFFSET_Y);

    // Ceiling Graphics (outside container to cover top area)
    this.ceilingGraphics = this.add.graphics();

    // Trajectory Graphics
    this.trajectoryGraphics = this.add.graphics();

    // Arrow Graphics (Aiming)
    this.arrowGraphics = this.add.graphics();

    // Character Sprite (Bottom Left, larger)
    this.characterSprite = this.add
      .sprite(80, height, `${this.selectedCharacter.id}_idle`)
      .setOrigin(0.5, 1) // Anchor at bottom center
      .setScale(4) // Reduced scale to avoid distortion
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
      fontSize: "24px",
      color: "#B7FF00", // Neon Green
      align: "center",
    };

    this.scoreText = this.add
      .text(width * 0.3, headerY, "Score: 0", fontStyle)
      .setOrigin(0.5);

    this.levelText = this.add
      .text(width * 0.5, headerY, "Level: 1", fontStyle)
      .setOrigin(0.5);

    // Placeholder for Time if needed, or just decoration
    this.add.text(width * 0.7, headerY, "Time: 10s", fontStyle).setOrigin(0.5);

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
    }

    // Keep pointer for shooting if desired, or remove
    this.input.on("pointerdown", () => {
      if (!this.gameStarted) {
        this.startGame();
      } else {
        this.shootBubble();
      }
    });

    // Initialize Level
    this.startLevel();
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
        this.activateAbility();
      }
    );

    this.skillBtn = btn;
  }
  startGame() {
    this.gameStarted = true;
  }

  startLevel() {
    // Reset Grid
    this.grid = Array(this.GRID_HEIGHT)
      .fill(null)
      .map(() => Array(this.GRID_WIDTH).fill(null));
    this.bubbleSprites = Array(this.GRID_HEIGHT)
      .fill(null)
      .map(() => Array(this.GRID_WIDTH).fill(null));
    this.gameContainer.removeAll(true); // Clear existing bubbles
    // Ceiling graphics is now outside container, so we don't add it here

    // Populate Grid
    const initialRows = Math.min(
      6 + Math.floor((this.level - 1) / 2),
      this.GRID_HEIGHT - 2
    );
    const usedColors = new Set<string>();

    for (let row = 0; row < initialRows; row++) {
      const isOddRow = row % 2 === 1;
      const numBubbles = isOddRow ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let col = 0; col < numBubbles; col++) {
        const color =
          GameSettings.colors.all[
            Math.floor(Math.random() * GameSettings.colors.all.length)
          ];
        this.grid[row][col] = color;
        usedColors.add(color);
        this.createBubbleSprite(row, col, color);
      }
    }

    // Setup Next Bubbles
    this.nextBubbles = [
      this.getRandomColor(Array.from(usedColors)),
      this.getRandomColor(Array.from(usedColors)),
    ];

    this.showLevelOverlay(this.level, () => {
      this.spawnBubble();
      this.updateUI();
      this.gameStarted = true;
    });
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
    const text = this.add
      .text(width / 2, height / 2, `LEVEL ${level}`, {
        fontFamily: "Pixelify Sans",
        fontSize: "80px",
        color: "#B7FF00",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScale(0);

    overlay.add([bg, text]);
    overlay.setDepth(100); // Ensure it's on top

    // Animation
    this.tweens.add({
      targets: text,
      scale: 1,
      duration: 500,
      ease: "Back.out",
      onComplete: () => {
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
    const container = this.add.container(x, y);

    // Base bubble
    const circle = this.add.circle(
      0,
      0,
      size / 2 - 2,
      Phaser.Display.Color.HexStringToColor(color).color
    );
    circle.setStrokeStyle(2, 0xffffff);

    // Shine (Retro highlight)
    const shine = this.add.circle(
      -size / 6,
      -size / 6,
      size / 8,
      0xffffff,
      0.6
    );

    container.add([circle, shine]);
    return container;
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
        if (this.grid[r][c]) {
          gridColors.add(this.grid[r][c]!);
        }
      }
    }

    // Also include colors currently in the queue (nextBubbles) to avoid starvation if grid is empty but queue has colors
    this.nextBubbles.forEach((c) => gridColors.add(c));

    // If we have colors on grid, pick from them. Otherwise fallback to all colors (e.g. start of game or empty grid)
    const pool = gridColors.size > 0 ? Array.from(gridColors) : availableColors;

    return (
      pool[Math.floor(Math.random() * pool.length)] ||
      GameSettings.colors.all[0]
    );
  }

  spawnBubble() {
    const color = this.nextBubbles.shift()!;
    this.nextBubbles.push(this.getRandomColor(GameSettings.colors.all)); // Simplified for now

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

  shootBubble() {
    if (this.currentBubble && !this.currentBubble.moving) {
      const speed = 15; // Increased speed for Phaser
      this.currentBubble.velocity.x = Math.cos(this.launcherAngle) * speed;
      this.currentBubble.velocity.y = -Math.sin(this.launcherAngle) * speed;
      this.currentBubble.moving = true;

      this.flyingBubbles.push(this.currentBubble);
      this.currentBubble = null;

      this.shotCount++;
      this.spawnBubble();
    }
  }

  update(time: number, delta: number) {
    if (!this.gameStarted || this.gameOver) return;

    // Input Handling (Keyboard: Arrows + A/D) with Acceleration
    const baseSpeed = 0.02;
    const maxSpeed = 0.05; // Reduced from 0.08
    const acceleration = 0.001; // Reduced from 0.002

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

    // Update Ceiling Graphics
    this.ceilingGraphics.clear();
    this.ceilingGraphics.fillStyle(0x000000);
    // Draw from top of grid area down to current offset
    this.ceilingGraphics.fillRect(
      0,
      this.GRID_OFFSET_Y,
      this.cameras.main.width,
      this.ceilingOffset
    );

    // Sync grid bubbles position with ceiling offset
    this.gameContainer.y = this.GRID_OFFSET_Y + this.ceilingOffset;

    // Update Flying Bubbles
    for (let i = this.flyingBubbles.length - 1; i >= 0; i--) {
      const bubble = this.flyingBubbles[i];
      bubble.x += bubble.velocity.x * (delta / 16);
      bubble.y += bubble.velocity.y * (delta / 16);

      if (bubble.sprite) {
        bubble.sprite.setPosition(bubble.x, bubble.y);
        
        // Rotate special bubbles
        if (bubble.isSpecial || bubble.isBomb || bubble.isWild) {
          (bubble.sprite as Phaser.GameObjects.Container).rotation += 0.1;
          
          // Particle Trail
          if (Math.random() > 0.5) {
            const color = bubble.isSpecial ? 0xFF6600 : (bubble.isBomb ? 0x333333 : 0x00FFFF);
            const p = this.add.circle(bubble.x, bubble.y, 3, color);
            this.tweens.add({
              targets: p,
              alpha: 0,
              scale: 0,
              duration: 300,
              onComplete: () => p.destroy()
            });
          }
        }
      }

      // Wall Collision
      if (
        bubble.x < this.BUBBLE_SIZE / 2 ||
        bubble.x > this.cameras.main.width - this.BUBBLE_SIZE / 2
      ) {
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
        this.snapBubbleToGrid(bubble);
        this.flyingBubbles.splice(i, 1);
        continue;
      }

      // Bubble Collision
      const pos = this.getGridPos(bubble.x, bubble.y);
      if (this.grid[pos.row] && this.grid[pos.row][pos.col]) {
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
              this.snapBubbleToGrid(bubble);
              this.flyingBubbles.splice(i, 1);
              collided = true;
              break;
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
            const color = this.grid[n.r][n.c]!;
            this.grid[n.r][n.c] = null;
            if (this.bubbleSprites[n.r][n.c]) {
              const sprite = this.bubbleSprites[n.r][n.c]!;
              this.playPopAnimation(sprite.x, sprite.y, color);
              sprite.destroy();
              this.bubbleSprites[n.r][n.c] = null;
            }
          }
          // Chain reaction? For now just direct neighbors
          const secondNeighbors = this.getNeighbors(n.r, n.c);
          secondNeighbors.forEach((sn) => {
            if (this.grid[sn.r][sn.c]) {
              const color = this.grid[sn.r][sn.c]!;
              this.grid[sn.r][sn.c] = null;
              if (this.bubbleSprites[sn.r][sn.c]) {
                const sprite = this.bubbleSprites[sn.r][sn.c]!;
                this.playPopAnimation(sprite.x, sprite.y, color);
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
          this.playPopAnimation(sprite.x, sprite.y, "#000000");
          sprite.destroy();
          this.bubbleSprites[pos.row][pos.col] = null;
        }
        this.removeFloatingBubbles();
        this.updateUI();
      } else if (bubble.isSpecial) {
        // Color Blast (Pinky): Destroy all bubbles of the touched color
        // Find neighbors first to see what color we touched
        const neighbors = this.getNeighbors(pos.row, pos.col);
        const touchedColors = new Set<string>();
        neighbors.forEach((n) => {
          if (this.grid[n.r][n.c]) touchedColors.add(this.grid[n.r][n.c]!);
        });

        if (touchedColors.size > 0) {
          // Destroy all bubbles of these colors
          for (let r = 0; r < this.GRID_HEIGHT; r++) {
            const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
            for (let c = 0; c < maxCols; c++) {
              if (this.grid[r][c] && touchedColors.has(this.grid[r][c]!)) {
                const color = this.grid[r][c]!;
                this.grid[r][c] = null;
                if (this.bubbleSprites[r][c]) {
                  const sprite = this.bubbleSprites[r][c]!;
                  this.playPopAnimation(sprite.x, sprite.y, color);
                  sprite.destroy();
                  this.bubbleSprites[r][c] = null;
                }
              }
            }
          }
        }
        // Destroy self
        this.grid[pos.row][pos.col] = null;
        if (this.bubbleSprites[pos.row][pos.col]) {
          const sprite = this.bubbleSprites[pos.row][pos.col]!;
          this.playPopAnimation(sprite.x, sprite.y, "#FF6600");
          sprite.destroy();
          this.bubbleSprites[pos.row][pos.col] = null;
        }
        this.removeFloatingBubbles();
        this.updateUI();
      } else {
        this.checkAndRemoveMatches(pos.row, pos.col, bubble);
      }
    }

    if (bubble.sprite) {
      bubble.sprite.destroy();
    }

    // Check Ceiling Drop
    // Progressive difficulty: Ceiling drops faster as level increases
    // Base is e.g. 6 shots. Level 1: 6. Level 3: 5. Level 5: 4. Min 2.
    const shotsPerDrop = Math.max(
      2,
      GameSettings.gameplay.baseShotsPerCeilingDrop -
        Math.floor((this.level - 1) / 2)
    );

    if (this.shotCount >= shotsPerDrop) {
      this.lowerCeiling();
      this.shotCount = 0;
    }

    // Check Game Over
    this.checkGameOver();
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

  showCharacterSpeech(text: string) {
    const { width, height } = this.cameras.main;
    const x = 180; // Near character
    const y = height - 100; // Closer to character (was 150)

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
            onComplete: () => container.destroy(),
          });
        });
      },
    });
  }

  checkAndRemoveMatches(row: number, col: number, bubble?: Bubble) {
    const color = this.grid[row][col];
    if (!color) return;

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
          this.playPopAnimation(sprite.x, sprite.y, color);
          sprite.destroy();
          this.bubbleSprites[r][c] = null;
        }
      });
      this.removeFloatingBubbles();
      this.score += matches.length * 10;

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

    while (queue.length > 0) {
      const { r, c } = queue.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (this.grid[r][c] === color) {
        matches.push({ r, c });
        const neighbors = this.getNeighbors(r, c);
        neighbors.forEach((n) => {
          if (this.grid[n.r] && this.grid[n.r][n.c] === color) {
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

    // Start from top row
    for (let c = 0; c < this.GRID_WIDTH; c++) {
      if (this.grid[0][c]) {
        queue.push({ r: 0, c });
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
          this.score += 20;
        }
      }
    }

    if (this.checkLevelComplete()) {
      this.gameStarted = false;
      this.level++;
      this.time.delayedCall(1000, () => {
        this.startLevel();
      });
    }
  }

  lowerCeiling() {
    this.ceilingOffset += (this.BUBBLE_SIZE * Math.sqrt(3)) / 2;
  }

  checkGameOver() {
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH;
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c]) {
          const { y } = this.getBubblePos(r, c);
          if (y + this.ceilingOffset + this.GRID_OFFSET_Y > this.LIMIT_LINE_Y) {
            this.gameOver = true;
            this.add
              .text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                "GAME OVER",
                {
                  fontSize: "64px",
                  color: "#ff0000",
                  fontFamily: "Pixelify Sans",
                }
              )
              .setOrigin(0.5);
            this.input.on("pointerdown", () => this.scene.start("StartScene"));
          }
        }
      }
    }
  }

  activateAbility() {
    if (!this.abilityAvailable || !this.currentBubble) return;

    if (this.selectedCharacter.id === "Pinky") {
      this.currentBubble.color = "#FF6600";
      this.currentBubble.isSpecial = true;
      this.applySkillVisuals(this.currentBubble, "Pinky");
    } else if (this.selectedCharacter.id === "Bluey") {
      this.currentBubble.color = "#000000";
      this.currentBubble.isBomb = true;
      this.applySkillVisuals(this.currentBubble, "Bluey");
    } else if (this.selectedCharacter.id === "Whitey") {
      this.whiteyWildShotsLeft = 2; // Current + 2 next = 3 total
      this.currentBubble.isWild = true;
      this.currentBubble.color = "#FFFFFF";
      this.applySkillVisuals(this.currentBubble, "Whitey");
    }

    this.abilityAvailable = false;
    this.skillBtn.setAlpha(0.5);
  }

  updateUI() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.levelText.setText(`Level: ${this.level}`);

    this.nextBubblePreviews.forEach((preview, idx) => {
      if (this.nextBubbles[idx]) {
        // Update color of the circle inside the container
        const circle = (preview as any).list[0] as Phaser.GameObjects.Arc;
        circle.setFillStyle(
          Phaser.Display.Color.HexStringToColor(this.nextBubbles[idx]).color
        );
      }
    });
  }

  playPopAnimation(x: number, y: number, color: string) {
    // Particles Explosion
    const particles = this.add.particles(x, y, "particle", {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      blendMode: "ADD",
      tint: Phaser.Display.Color.HexStringToColor(color).color,
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
    if (!bubble.sprite || !(bubble.sprite instanceof Phaser.GameObjects.Container))
      return;

    const container = bubble.sprite;
    container.removeAll(true); // Clear existing visuals

    const size = this.BUBBLE_SIZE;

    if (charId === "Pinky") {
      // Color Blast: Orange Sun/Spike
      const bg = this.add.circle(0, 0, size / 2 - 2, 0xFF6600);
      bg.setStrokeStyle(2, 0xFFFFFF);

      // Spikes
      const spikes = this.add.graphics();
      spikes.fillStyle(0xFFFF00, 0.8);
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const x = Math.cos(angle) * (size / 2.5);
        const y = Math.sin(angle) * (size / 2.5);
        spikes.fillCircle(x, y, 4);
      }

      container.add([bg, spikes]);
    } else if (charId === "Bluey") {
      // Bomb Shot: Black Bomb
      const bg = this.add.circle(0, 0, size / 2 - 2, 0x000000);
      bg.setStrokeStyle(2, 0xFF0000); // Red danger stroke

      // Fuse / Skull symbol
      const symbol = this.add.text(0, 0, "!", {
        fontFamily: "Pixelify Sans",
        fontSize: "24px",
        color: "#FF0000",
        fontStyle: "bold",
      }).setOrigin(0.5);

      container.add([bg, symbol]);
    } else if (charId === "Whitey") {
      // Color Pick: Wild White Orb
      const bg = this.add.circle(0, 0, size / 2 - 2, 0xFFFFFF);

      // Rainbow/Prismatic Stroke
      const ring = this.add.graphics();
      ring.lineStyle(4, 0x00FFFF); // Cyan ring
      ring.strokeCircle(0, 0, size / 2 - 4);

      const inner = this.add.circle(0, 0, size / 4, 0xFF00FF, 0.5); // Magenta core

      container.add([bg, ring, inner]);
    }
  }
}
