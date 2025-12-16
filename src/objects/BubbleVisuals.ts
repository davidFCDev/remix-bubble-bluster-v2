export class BubbleVisuals {
  static generateTextures(scene: Phaser.Scene) {
    // Generate Particle Texture
    if (!scene.textures.exists("particle")) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(4, 4, 4);
      graphics.generateTexture("particle", 8, 8);
    }

    // Generate Chameleon Scales Texture
    if (!scene.textures.exists("chameleon_scales")) {
      const scalesGraphics = scene.make.graphics({ x: 0, y: 0 });
      scalesGraphics.fillStyle(0x000000, 0.2);
      for (let i = -5; i <= 5; i++) {
        for (let j = -5; j <= 5; j++) {
          if ((i + j) % 2 === 0 && Math.abs(i) + Math.abs(j) < 8) {
            scalesGraphics.fillCircle(32 + i * 6, 32 + j * 6, 2);
          }
        }
      }
      scalesGraphics.generateTexture("chameleon_scales", 64, 64);
    }

    // Generate Chameleon Ring Texture
    if (!scene.textures.exists("chameleon_ring")) {
      const ringGraphics = scene.make.graphics({ x: 0, y: 0 });
      ringGraphics.lineStyle(3, 0xffffff, 0.8);
      const ringRadius = 32 - 3; // Close to edge of 64x64
      const dashLength = Math.PI / 4;
      for (let i = 0; i < 4; i++) {
        ringGraphics.beginPath();
        ringGraphics.arc(
          32,
          32,
          ringRadius,
          i * (Math.PI / 2),
          i * (Math.PI / 2) + dashLength
        );
        ringGraphics.strokePath();
      }
      ringGraphics.generateTexture("chameleon_ring", 64, 64);
    }

    // Generate Slime Texture (Gooey Pattern)
    if (!scene.textures.exists("slime_texture")) {
      const slimeGraphics = scene.make.graphics({ x: 0, y: 0 });
      // Base
      slimeGraphics.fillStyle(0x39ff14); // Neon Green
      slimeGraphics.fillCircle(32, 32, 30);

      // Darker blobs
      slimeGraphics.fillStyle(0x006400, 0.5);
      slimeGraphics.fillCircle(20, 20, 8);
      slimeGraphics.fillCircle(45, 35, 6);
      slimeGraphics.fillCircle(25, 45, 5);

      // Lighter highlights (wet look)
      slimeGraphics.fillStyle(0xffffff, 0.4);
      slimeGraphics.fillCircle(24, 16, 3);
      slimeGraphics.fillCircle(48, 32, 2);

      slimeGraphics.generateTexture("slime_texture", 64, 64);
    }

    // Generate Prism Texture (Crystal/Diamond)
    if (!scene.textures.exists("prism_texture")) {
      const prismGraphics = scene.make.graphics({ x: 0, y: 0 });

      // Draw a diamond shape
      prismGraphics.fillStyle(0xffffff, 0.9); // White base
      prismGraphics.beginPath();
      prismGraphics.moveTo(32, 4); // Top
      prismGraphics.lineTo(60, 32); // Right
      prismGraphics.lineTo(32, 60); // Bottom
      prismGraphics.lineTo(4, 32); // Left
      prismGraphics.closePath();
      prismGraphics.fillPath();

      // Facets (Colors)
      // Top Left - Cyan
      prismGraphics.fillStyle(0x00ffff, 0.4);
      prismGraphics.beginPath();
      prismGraphics.moveTo(32, 32);
      prismGraphics.lineTo(32, 4);
      prismGraphics.lineTo(4, 32);
      prismGraphics.closePath();
      prismGraphics.fillPath();

      // Top Right - Magenta
      prismGraphics.fillStyle(0xff00ff, 0.4);
      prismGraphics.beginPath();
      prismGraphics.moveTo(32, 32);
      prismGraphics.lineTo(60, 32);
      prismGraphics.lineTo(32, 4);
      prismGraphics.closePath();
      prismGraphics.fillPath();

      // Bottom Right - Yellow
      prismGraphics.fillStyle(0xffff00, 0.4);
      prismGraphics.beginPath();
      prismGraphics.moveTo(32, 32);
      prismGraphics.lineTo(60, 32);
      prismGraphics.lineTo(32, 60);
      prismGraphics.closePath();
      prismGraphics.fillPath();

      // Bottom Left - Blue
      prismGraphics.fillStyle(0x0000ff, 0.4);
      prismGraphics.beginPath();
      prismGraphics.moveTo(32, 32);
      prismGraphics.lineTo(32, 60);
      prismGraphics.lineTo(4, 32);
      prismGraphics.closePath();
      prismGraphics.fillPath();

      // Inner lines
      prismGraphics.lineStyle(2, 0xffffff, 0.8);
      prismGraphics.beginPath();
      prismGraphics.moveTo(32, 4);
      prismGraphics.lineTo(32, 60);
      prismGraphics.moveTo(4, 32);
      prismGraphics.lineTo(60, 32);
      prismGraphics.strokePath();

      prismGraphics.generateTexture("prism_texture", 64, 64);
    }

    // Generate Stop Texture (Ice/Freeze Effect)
    if (!scene.textures.exists("stop_texture")) {
      const stopGraphics = scene.make.graphics({ x: 0, y: 0 });

      // Base icy sphere
      stopGraphics.fillStyle(0x87ceeb, 1); // Light sky blue
      stopGraphics.fillCircle(32, 32, 28);

      // Frost overlay
      stopGraphics.fillStyle(0xb0e0e6, 0.6); // Powder blue
      stopGraphics.fillCircle(28, 28, 20);

      // Ice crystals pattern
      stopGraphics.lineStyle(2, 0xffffff, 0.8);
      // Snowflake arms
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x1 = 32 + Math.cos(angle) * 8;
        const y1 = 32 + Math.sin(angle) * 8;
        const x2 = 32 + Math.cos(angle) * 22;
        const y2 = 32 + Math.sin(angle) * 22;
        stopGraphics.beginPath();
        stopGraphics.moveTo(x1, y1);
        stopGraphics.lineTo(x2, y2);
        stopGraphics.strokePath();

        // Small branches
        const midX = 32 + Math.cos(angle) * 16;
        const midY = 32 + Math.sin(angle) * 16;
        const branchAngle1 = angle + Math.PI / 6;
        const branchAngle2 = angle - Math.PI / 6;
        stopGraphics.beginPath();
        stopGraphics.moveTo(midX, midY);
        stopGraphics.lineTo(
          midX + Math.cos(branchAngle1) * 5,
          midY + Math.sin(branchAngle1) * 5
        );
        stopGraphics.moveTo(midX, midY);
        stopGraphics.lineTo(
          midX + Math.cos(branchAngle2) * 5,
          midY + Math.sin(branchAngle2) * 5
        );
        stopGraphics.strokePath();
      }

      // Center hexagon
      stopGraphics.fillStyle(0xe0ffff, 0.9); // Light cyan
      stopGraphics.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const x = 32 + Math.cos(angle) * 7;
        const y = 32 + Math.sin(angle) * 7;
        if (i === 0) stopGraphics.moveTo(x, y);
        else stopGraphics.lineTo(x, y);
      }
      stopGraphics.closePath();
      stopGraphics.fillPath();

      // Sparkle highlights
      stopGraphics.fillStyle(0xffffff, 0.9);
      stopGraphics.fillCircle(22, 18, 3);
      stopGraphics.fillCircle(40, 24, 2);
      stopGraphics.fillCircle(26, 42, 2);

      stopGraphics.generateTexture("stop_texture", 64, 64);
    }

    // Generate Bomb Texture (Explosive Sphere)
    if (!scene.textures.exists("bomb_texture")) {
      const bombGraphics = scene.make.graphics({ x: 0, y: 0 });

      // Base dark sphere
      bombGraphics.fillStyle(0x1a1a1a, 1); // Very dark gray
      bombGraphics.fillCircle(32, 32, 26);

      // Metallic sheen
      bombGraphics.fillStyle(0x333333, 0.8);
      bombGraphics.fillCircle(28, 28, 20);

      // Red danger glow
      bombGraphics.fillStyle(0xff3300, 0.3);
      bombGraphics.fillCircle(32, 34, 22);

      // Skull/danger symbol - simplified X
      bombGraphics.lineStyle(3, 0xff4444, 0.9);
      bombGraphics.beginPath();
      bombGraphics.moveTo(22, 26);
      bombGraphics.lineTo(42, 42);
      bombGraphics.moveTo(42, 26);
      bombGraphics.lineTo(22, 42);
      bombGraphics.strokePath();

      // Fuse cap at top
      bombGraphics.fillStyle(0x8b4513, 1); // Brown
      bombGraphics.fillRect(28, 4, 8, 8);

      // Fuse string
      bombGraphics.lineStyle(2, 0xdaa520, 1); // Golden rod
      bombGraphics.beginPath();
      bombGraphics.moveTo(32, 4);
      bombGraphics.lineTo(36, 0);
      bombGraphics.strokePath();

      // Spark at fuse tip
      bombGraphics.fillStyle(0xffff00, 1);
      bombGraphics.fillCircle(36, 0, 3);
      bombGraphics.fillStyle(0xff6600, 0.8);
      bombGraphics.fillCircle(36, 0, 2);

      // Highlight
      bombGraphics.fillStyle(0xffffff, 0.4);
      bombGraphics.fillCircle(22, 22, 4);

      bombGraphics.generateTexture("bomb_texture", 64, 64);
    }
  }

  static create(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    color: string
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    if (color === "STONE") {
      // Stone Visual: Shiny Obsidian Black
      const circle = scene.add.circle(0, 0, size / 2 - 2, 0x000000);
      circle.setStrokeStyle(2, 0x888888); // Metallic grey border

      // Cracks / Texture (Subtle Grey)
      const graphics = scene.add.graphics();
      graphics.lineStyle(2, 0x444444);

      // Crack 1
      graphics.beginPath();
      graphics.moveTo(-size / 4, -size / 4);
      graphics.lineTo(0, 0);
      graphics.lineTo(size / 4, -size / 8);
      graphics.strokePath();

      // Crack 2
      graphics.beginPath();
      graphics.moveTo(0, 0);
      graphics.lineTo(-size / 8, size / 3);
      graphics.strokePath();

      // Standard Shine (Top Left) - Same as other bubbles
      const shine = scene.add.circle(
        -size / 6,
        -size / 6,
        size / 8,
        0xffffff,
        0.6
      );

      container.add([circle, graphics, shine]);
      return container;
    } else if (color === "ANCHOR") {
      // Anchor Visual: Metallic Orange / Copper
      const circle = scene.add.circle(0, 0, size / 2 - 2, 0xd35400); // Rust Orange
      circle.setStrokeStyle(2, 0xff8c00); // Dark Orange border

      // Rivets (Darker Brown)
      const rivets = scene.add.graphics();
      rivets.fillStyle(0x6e2c00, 1); // Very Dark Orange/Brown
      rivets.fillCircle(-size / 3, 0, 2);
      rivets.fillCircle(size / 3, 0, 2);
      rivets.fillCircle(0, -size / 3, 2);
      rivets.fillCircle(0, size / 3, 2);

      // Anchor Symbol (Light Orange/Cream)
      const anchor = scene.add.graphics();
      anchor.lineStyle(3, 0xffe0b2, 1); // Light Orange/Cream

      // Vertical line
      anchor.beginPath();
      anchor.moveTo(0, -size / 4);
      anchor.lineTo(0, size / 4);
      anchor.strokePath();

      // Crossbar
      anchor.beginPath();
      anchor.moveTo(-size / 6, -size / 6);
      anchor.lineTo(size / 6, -size / 6);
      anchor.strokePath();

      // Bottom Curve
      anchor.beginPath();
      anchor.arc(0, 0, size / 4, 0.1 * Math.PI, 0.9 * Math.PI, false);
      anchor.strokePath();

      // Ring at top
      anchor.lineStyle(2, 0xffe0b2, 1);
      anchor.strokeCircle(0, -size / 4 - 3, 3);

      // Shine
      const shine = scene.add.circle(
        -size / 6,
        -size / 6,
        size / 8,
        0xffffff,
        0.4
      );

      container.add([circle, rivets, anchor, shine]);
      return container;
    } else if (color === "SLIME") {
      // Slime Visual: Neon Green + Gooey Texture + Pulse

      // 1. Outer Glow (Toxic Haze)
      const glow = scene.add.circle(0, 0, size / 2 + 5, 0x39ff14, 0.3);
      scene.tweens.add({
        targets: glow,
        alpha: 0.1,
        scale: 1.1,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });

      // 2. Base Texture (Pre-generated)
      const slime = scene.add.image(0, 0, "slime_texture");
      slime.setDisplaySize(size, size);

      // 3. Border (Thick Dark Green)
      const border = scene.add.graphics();
      border.lineStyle(3, 0x004400);
      border.strokeCircle(0, 0, size / 2 - 1.5);

      // 4. Inner Pulse (Heartbeat effect)
      scene.tweens.add({
        targets: slime,
        scaleX: (size / 64) * 1.05, // Adjust for texture size
        scaleY: (size / 64) * 0.95,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      container.add([glow, slime, border]);
      return container;
    } else if (color.startsWith("CHAMELEON:")) {
      const baseColor = color.split(":")[1];
      const hexColor = Phaser.Display.Color.HexStringToColor(baseColor).color;

      // 1. Outer Glow (Pulsing)
      const glow = scene.add.circle(0, 0, size / 2 + 4, hexColor, 0.4);
      scene.tweens.add({
        targets: glow,
        alpha: 0.1,
        scale: 1.2,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      // 2. Base Bubble
      const circle = scene.add.circle(0, 0, size / 2 - 2, hexColor);
      circle.setStrokeStyle(3, 0xffffff); // Thicker border

      // 3. Scales Texture (Scaled to fit)
      const scales = scene.add.image(0, 0, "chameleon_scales");
      scales.setDisplaySize(size, size);
      scales.setAlpha(0.8);

      // 4. Rotating Dashed Ring (Scaled to fit)
      const ring = scene.add.image(0, 0, "chameleon_ring");
      ring.setDisplaySize(size, size);
      scene.tweens.add({
        targets: ring,
        angle: 360,
        duration: 4000,
        repeat: -1,
      });

      // 5. Question Mark (Dynamic Size)
      const overlay = scene.add.text(0, 0, "?", {
        fontFamily: "Pixelify Sans",
        fontSize: `${size * 0.7}px`, // Dynamic: 70% of bubble size
        color: "#FFFFFF",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: Math.max(3, size * 0.1),
      });
      overlay.setOrigin(0.5);

      // 6. Shine
      const shine = scene.add.circle(
        -size / 6,
        -size / 6,
        size / 8,
        0xffffff,
        0.8
      );

      container.add([glow, circle, scales, ring, overlay, shine]);
      return container;
    } else if (color === "PRISM") {
      // Prism Visual: Rotating Crystal

      // 1. Rainbow Glow
      const glow = scene.add.circle(0, 0, size / 2 + 4, 0xffffff, 0.4);
      scene.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 2000,
        repeat: -1,
        onUpdate: (tween) => {
          const hue = tween.getValue();
          if (hue !== null) {
            const color = Phaser.Display.Color.HSLToColor(
              hue / 360,
              1,
              0.5
            ).color;
            glow.setFillStyle(color, 0.4);
          }
        },
      });

      // 2. Base Texture
      const prism = scene.add.image(0, 0, "prism_texture");
      prism.setDisplaySize(size * 0.9, size * 0.9);

      // 3. Rotation Effect
      scene.tweens.add({
        targets: prism,
        angle: 360,
        duration: 4000,
        repeat: -1,
        ease: "Linear",
      });

      // 4. Sparkles
      const sparkle = scene.add.star(size / 4, -size / 4, 4, 2, 5, 0xffffff);
      scene.tweens.add({
        targets: sparkle,
        scale: { from: 0.5, to: 1.2 },
        alpha: { from: 1, to: 0 },
        angle: 180,
        duration: 800,
        yoyo: false,
        repeat: -1,
      });

      container.add([glow, prism, sparkle]);
      return container;
    } else if (color === "STOP") {
      // Stop Visual: Frozen Ice Sphere

      // 1. Frost Mist (Outer Glow)
      const mist = scene.add.circle(0, 0, size / 2 + 6, 0x87ceeb, 0.25);
      scene.tweens.add({
        targets: mist,
        alpha: { from: 0.25, to: 0.1 },
        scale: { from: 1, to: 1.15 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // 2. Base Frozen Texture
      const stopBubble = scene.add.image(0, 0, "stop_texture");
      stopBubble.setDisplaySize(size, size);

      // 3. Icy Border
      const border = scene.add.graphics();
      border.lineStyle(3, 0xe0ffff, 0.9);
      border.strokeCircle(0, 0, size / 2 - 1.5);

      // 4. Frost Particles (Floating ice crystals)
      const frost1 = scene.add.star(
        -size / 4,
        -size / 4,
        6,
        1,
        3,
        0xffffff,
        0.8
      );
      const frost2 = scene.add.star(size / 4, size / 5, 6, 1, 2, 0xffffff, 0.6);
      const frost3 = scene.add.star(
        -size / 5,
        size / 4,
        6,
        1,
        2,
        0xe0ffff,
        0.7
      );

      // Animate frost particles
      scene.tweens.add({
        targets: [frost1, frost2, frost3],
        alpha: { from: 0.8, to: 0.2 },
        scale: { from: 1, to: 1.3 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // 5. Rotating snowflake overlay
      const snowflakeOverlay = scene.add.graphics();
      snowflakeOverlay.lineStyle(1.5, 0xffffff, 0.5);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        snowflakeOverlay.beginPath();
        snowflakeOverlay.moveTo(0, 0);
        snowflakeOverlay.lineTo(
          Math.cos(angle) * (size / 3),
          Math.sin(angle) * (size / 3)
        );
        snowflakeOverlay.strokePath();
      }
      scene.tweens.add({
        targets: snowflakeOverlay,
        angle: 60,
        duration: 5000,
        repeat: -1,
        ease: "Linear",
      });

      container.add([
        mist,
        stopBubble,
        border,
        snowflakeOverlay,
        frost1,
        frost2,
        frost3,
      ]);
      return container;
    } else if (color === "BOMB") {
      // Bomb Visual: Explosive dark sphere with animated fuse

      // 1. Danger Glow (Pulsing red)
      const dangerGlow = scene.add.circle(0, 0, size / 2 + 5, 0xff3300, 0.3);
      scene.tweens.add({
        targets: dangerGlow,
        alpha: { from: 0.3, to: 0.6 },
        scale: { from: 1, to: 1.1 },
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // 2. Base Bomb Texture
      const bombBubble = scene.add.image(0, 0, "bomb_texture");
      bombBubble.setDisplaySize(size, size);

      // 3. Metallic Border
      const border = scene.add.graphics();
      border.lineStyle(2, 0x444444, 1);
      border.strokeCircle(0, 0, size / 2 - 1.5);

      // 4. Animated Spark at fuse
      const spark = scene.add.circle(size / 8, -size / 2 + 2, 4, 0xffff00, 1);
      scene.tweens.add({
        targets: spark,
        alpha: { from: 1, to: 0.3 },
        scale: { from: 1, to: 1.5 },
        duration: 200,
        yoyo: true,
        repeat: -1,
      });

      // 5. Spark particles
      const sparkParticle1 = scene.add.circle(
        size / 8 + 3,
        -size / 2,
        2,
        0xff6600,
        0.8
      );
      const sparkParticle2 = scene.add.circle(
        size / 8 - 2,
        -size / 2 + 3,
        1.5,
        0xffaa00,
        0.7
      );

      scene.tweens.add({
        targets: [sparkParticle1, sparkParticle2],
        y: "-=5",
        alpha: 0,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: "Power2",
      });

      container.add([
        dangerGlow,
        bombBubble,
        border,
        spark,
        sparkParticle1,
        sparkParticle2,
      ]);
      return container;
    }

    // Base bubble
    const circle = scene.add.circle(
      0,
      0,
      size / 2 - 2,
      Phaser.Display.Color.HexStringToColor(color).color
    );
    circle.setStrokeStyle(2, 0xffffff);

    // Shine (Retro highlight)
    const shine = scene.add.circle(
      -size / 6,
      -size / 6,
      size / 8,
      0xffffff,
      0.6
    );

    container.add([circle, shine]);
    return container;
  }

  /**
   * Create a bubble with a specific visual style
   */
  static createWithStyle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    color: string,
    style: string = "classic"
  ): Phaser.GameObjects.Container {
    // For special bubble types, always use the default visual
    if (
      color === "STONE" ||
      color === "ANCHOR" ||
      color === "SLIME" ||
      color === "PRISM" ||
      color === "STOP" ||
      color === "BOMB" ||
      color.startsWith("CHAMELEON:")
    ) {
      return this.create(scene, x, y, size, color);
    }

    // For basic color bubbles, apply the selected style
    switch (style) {
      case "pixel":
        return this.createPixelBubble(scene, x, y, size, color);
      case "neon":
        return this.createNeonBubble(scene, x, y, size, color);
      case "candy":
        return this.createCandyBubble(scene, x, y, size, color);
      case "classic":
      default:
        return this.create(scene, x, y, size, color);
    }
  }

  /**
   * Pixel Art Style - 8-bit retro look
   */
  static createPixelBubble(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    color: string
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const hexColor = Phaser.Display.Color.HexStringToColor(color).color;
    const halfSize = size / 2 - 2;

    // Create pixelated look using rectangles
    const graphics = scene.add.graphics();

    // Main color fill (large pixels)
    graphics.fillStyle(hexColor, 1);
    const pixelSize = size / 6;
    
    // Draw a circle-ish shape with pixels
    const pixels = [
      // Row 0 (top)
      { x: -1, y: -3 }, { x: 0, y: -3 }, { x: 1, y: -3 },
      // Row 1
      { x: -2, y: -2 }, { x: -1, y: -2 }, { x: 0, y: -2 }, { x: 1, y: -2 }, { x: 2, y: -2 },
      // Row 2
      { x: -3, y: -1 }, { x: -2, y: -1 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 2, y: -1 }, { x: 3, y: -1 },
      // Row 3 (middle)
      { x: -3, y: 0 }, { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
      // Row 4
      { x: -3, y: 1 }, { x: -2, y: 1 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      // Row 5
      { x: -2, y: 2 }, { x: -1, y: 2 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
      // Row 6 (bottom)
      { x: -1, y: 3 }, { x: 0, y: 3 }, { x: 1, y: 3 },
    ];

    pixels.forEach((p) => {
      graphics.fillRect(
        p.x * pixelSize - pixelSize / 2,
        p.y * pixelSize - pixelSize / 2,
        pixelSize,
        pixelSize
      );
    });

    // Highlight pixels (top-left)
    graphics.fillStyle(0xffffff, 0.7);
    [{ x: -1, y: -2 }, { x: -2, y: -1 }].forEach((p) => {
      graphics.fillRect(
        p.x * pixelSize - pixelSize / 2,
        p.y * pixelSize - pixelSize / 2,
        pixelSize,
        pixelSize
      );
    });

    // Dark border pixels
    const darkerColor = Phaser.Display.Color.ValueToColor(hexColor).darken(30).color;
    graphics.fillStyle(darkerColor, 1);
    [
      { x: -1, y: 3 }, { x: 0, y: 3 }, { x: 1, y: 3 },
      { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 0 },
    ].forEach((p) => {
      graphics.fillRect(
        p.x * pixelSize - pixelSize / 2,
        p.y * pixelSize - pixelSize / 2,
        pixelSize,
        pixelSize
      );
    });

    container.add([graphics]);
    return container;
  }

  /**
   * Neon Style - Glowing cyberpunk look
   */
  static createNeonBubble(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    color: string
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const hexColor = Phaser.Display.Color.HexStringToColor(color).color;
    const halfSize = size / 2 - 2;

    // Outer glow
    const glow = scene.add.circle(0, 0, halfSize + 6, hexColor, 0.3);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.15 },
      scale: { from: 1, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Inner dark core
    const core = scene.add.circle(0, 0, halfSize - 4, 0x111111, 0.9);

    // Neon ring (main visual)
    const ring = scene.add.graphics();
    ring.lineStyle(4, hexColor, 1);
    ring.strokeCircle(0, 0, halfSize - 2);

    // Inner thin ring
    ring.lineStyle(1, hexColor, 0.6);
    ring.strokeCircle(0, 0, halfSize - 8);

    // Center dot
    const centerDot = scene.add.circle(0, 0, 4, hexColor, 0.8);

    // Pulse the center dot
    scene.tweens.add({
      targets: centerDot,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.8, to: 0.4 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    container.add([glow, core, ring, centerDot]);
    return container;
  }

  /**
   * Candy Style - Sweet striped lollipop look
   */
  static createCandyBubble(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    color: string
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const hexColor = Phaser.Display.Color.HexStringToColor(color).color;
    const halfSize = size / 2 - 2;

    // Base circle (white)
    const base = scene.add.circle(0, 0, halfSize, 0xffffff);
    base.setStrokeStyle(2, hexColor);

    // Candy stripes using graphics
    const stripes = scene.add.graphics();
    
    // Create spiral stripes
    stripes.fillStyle(hexColor, 0.9);
    const numStripes = 6;
    for (let i = 0; i < numStripes; i++) {
      const angle = (i / numStripes) * Math.PI * 2;
      const nextAngle = ((i + 0.5) / numStripes) * Math.PI * 2;
      
      stripes.beginPath();
      stripes.moveTo(0, 0);
      stripes.arc(0, 0, halfSize - 2, angle, nextAngle, false);
      stripes.closePath();
      stripes.fillPath();
    }

    // Mask the stripes to circle shape
    const mask = scene.add.circle(0, 0, halfSize - 1, 0xffffff);
    mask.setVisible(false);

    // Glossy shine
    const shine = scene.add.graphics();
    shine.fillStyle(0xffffff, 0.6);
    shine.fillEllipse(-halfSize / 3, -halfSize / 3, halfSize / 2, halfSize / 3);

    // Small highlight dot
    const dot = scene.add.circle(-halfSize / 4, -halfSize / 4, 3, 0xffffff, 0.8);

    // Subtle rotation animation
    scene.tweens.add({
      targets: stripes,
      angle: 360,
      duration: 10000,
      repeat: -1,
      ease: "Linear",
    });

    container.add([base, stripes, shine, dot]);
    return container;
  }
}
