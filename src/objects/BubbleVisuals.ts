import * as Phaser from "phaser";

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
}
