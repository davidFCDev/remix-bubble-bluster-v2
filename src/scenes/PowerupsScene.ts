import GameSettings from "../config/GameSettings";

export class PowerupsScene extends Phaser.Scene {
  private powerupCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: "PowerupsScene" });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add
      .image(width / 2, height / 2, "bg_start")
      .setDisplaySize(width, height);

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Title
    this.add
      .text(width / 2, height * 0.1, "POWER-UPS", {
        fontFamily: "Pixelify Sans",
        fontSize: "64px",
        color: "#B7FF00",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Subtitle explanation
    this.add
      .text(width / 2, height * 0.17, "Unlock once, use once per game!", {
        fontFamily: "Pixelify Sans",
        fontSize: "28px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    // Create power-up cards
    const powerups = GameSettings.powerups;
    const cardHeight = 150;
    const startY = height * 0.32;
    const spacing = cardHeight + 30;

    powerups.forEach((powerup, index) => {
      const card = this.createPowerupCard(
        width / 2,
        startY + index * spacing,
        powerup,
        index + 1
      );
      this.powerupCards.push(card);
    });

    // Back button
    const btnWidth = 280;
    const btnHeight = 70;
    const btnY = height * 0.88;

    const backBtn = this.add.container(width / 2, btnY);

    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0x000000, 1);
    btnShadow.fillRoundedRect(
      -btnWidth / 2 + 6,
      -btnHeight / 2 + 6,
      btnWidth,
      btnHeight,
      12
    );

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xb7ff00, 1); // Neon Green like other scenes
    btnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      12
    );

    const btnText = this.add
      .text(0, 0, "BACK", {
        fontFamily: "Pixelify Sans",
        fontSize: "36px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    backBtn.add([btnShadow, btnBg, btnText]);
    backBtn.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    backBtn.on("pointerdown", () => {
      this.sound.play("sfx_button");
      this.scene.start("StartScene");
    });
  }

  private createPowerupCard(
    x: number,
    y: number,
    powerup: (typeof GameSettings.powerups)[0],
    keyNumber: number
  ): Phaser.GameObjects.Container {
    const { width } = this.cameras.main;
    const cardWidth = width - 80;
    const cardHeight = 140;
    const isUnlocked = this.registry.get(`powerup_${powerup.id}`) || false;

    const container = this.add.container(x, y);

    // Card background - same style as character cards
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x111111, 0.95);
    cardBg.fillRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      20
    );
    cardBg.lineStyle(4, 0xb7ff00); // Always green border like character cards
    cardBg.strokeRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      20
    );

    // Icon - larger and centered vertically
    const icon = this.add
      .text(-cardWidth / 2 + 55, 0, powerup.icon, {
        fontSize: "52px",
      })
      .setOrigin(0.5);

    // Name - same style as character name (centered vertically now)
    const nameText = this.add
      .text(-cardWidth / 2 + 115, -cardHeight / 5, powerup.name, {
        fontFamily: "Pixelify Sans",
        fontSize: "32px",
        color: "#B7FF00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    // Description - larger text for better readability
    const descText = this.add
      .text(-cardWidth / 2 + 115, cardHeight / 6 + 5, powerup.description, {
        fontFamily: "Pixelify Sans",
        fontSize: "22px",
        color: "#FFFFFF",
        wordWrap: { width: cardWidth - 200 },
      })
      .setOrigin(0, 0.5);

    // Status badge position
    const btnX = cardWidth / 2 - 70;

    if (isUnlocked) {
      // Show "READY" badge - same green as character select
      const badge = this.add
        .text(btnX, 0, "✓ READY", {
          fontFamily: "Pixelify Sans",
          fontSize: "22px",
          color: "#B7FF00",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      container.add([cardBg, icon, nameText, descText, badge]);
    } else {
      // Show "LOCKED" badge when not unlocked
      const lockedBadge = this.add
        .text(btnX, 0, "🔒 LOCKED", {
          fontFamily: "Pixelify Sans",
          fontSize: "20px",
          color: "#888888",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      container.add([cardBg, icon, nameText, descText, lockedBadge]);
    }

    return container;
  }

  private attemptUnlock(powerup: (typeof GameSettings.powerups)[0]) {
    const credits = this.registry.get("credits") || 0;

    if (credits >= powerup.cost) {
      // Deduct credits
      this.registry.set("credits", credits - powerup.cost);
      // Unlock powerup
      this.registry.set(`powerup_${powerup.id}`, true);
      // Play sound
      this.sound.play("sfx_button");
      // Refresh scene
      this.scene.restart();
    } else {
      // Not enough credits - show feedback
      const { width, height } = this.cameras.main;
      const errorText = this.add
        .text(width / 2, height / 2, "Not enough credits!", {
          fontFamily: "Pixelify Sans",
          fontSize: "32px",
          color: "#FF4444",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(100);

      this.tweens.add({
        targets: errorText,
        alpha: 0,
        y: height / 2 - 50,
        duration: 1500,
        onComplete: () => errorText.destroy(),
      });
    }
  }
}
