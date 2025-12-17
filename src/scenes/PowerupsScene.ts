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
      .text(
        width / 2,
        height * 0.16,
        "Unlock once, use once per game!",
        {
          fontFamily: "Pixelify Sans",
          fontSize: "24px",
          color: "#FFFFFF",
        }
      )
      .setOrigin(0.5);

    // Info text
    this.add
      .text(
        width / 2,
        height * 0.21,
        "Activate with keys [1] [2] [3] during gameplay.",
        {
          fontFamily: "Pixelify Sans",
          fontSize: "18px",
          color: "#AAAAAA",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Create power-up cards
    const powerups = GameSettings.powerups;
    const cardHeight = 140;
    const startY = height * 0.34;
    const spacing = cardHeight + 25;

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
    btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);

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
    const cardWidth = width * 0.88;
    const cardHeight = 130;
    const isUnlocked = this.registry.get(`powerup_${powerup.id}`) || false;

    const container = this.add.container(x, y);

    // Card background
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x111111, 0.95);
    cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
    cardBg.lineStyle(3, isUnlocked ? 0xb7ff00 : 0x444444);
    cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);

    // Icon
    const icon = this.add
      .text(-cardWidth / 2 + 45, 0, powerup.icon, {
        fontSize: "42px",
      })
      .setOrigin(0.5);

    // Name
    const nameText = this.add
      .text(-cardWidth / 2 + 95, -cardHeight / 4, powerup.name, {
        fontFamily: "Pixelify Sans",
        fontSize: "26px",
        color: isUnlocked ? "#B7FF00" : "#FFFFFF",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    // Key binding hint
    const keyHint = this.add
      .text(-cardWidth / 2 + 95, 5, `Press [${keyNumber}] to activate`, {
        fontFamily: "Pixelify Sans",
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0, 0.5);

    // Description
    const descText = this.add
      .text(-cardWidth / 2 + 95, cardHeight / 4 + 5, powerup.description, {
        fontFamily: "Pixelify Sans",
        fontSize: "14px",
        color: "#AAAAAA",
        wordWrap: { width: cardWidth - 200 },
      })
      .setOrigin(0, 0.5);

    // Unlock button or status
    const unlockBtnWidth = 90;
    const unlockBtnHeight = 40;
    const btnX = cardWidth / 2 - 65;

    if (isUnlocked) {
      // Show "UNLOCKED" badge
      const badge = this.add
        .text(btnX, 0, "✓ READY", {
          fontFamily: "Pixelify Sans",
          fontSize: "18px",
          color: "#B7FF00",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      container.add([cardBg, icon, nameText, keyHint, descText, badge]);
    } else {
      // Show unlock button
      const unlockBtnBg = this.add.graphics();
      unlockBtnBg.fillStyle(0xb7ff00, 1);
      unlockBtnBg.fillRoundedRect(
        btnX - unlockBtnWidth / 2,
        -unlockBtnHeight / 2,
        unlockBtnWidth,
        unlockBtnHeight,
        10
      );

      const unlockBtnText = this.add
        .text(btnX, 0, `${powerup.cost} 💰`, {
          fontFamily: "Pixelify Sans",
          fontSize: "18px",
          color: "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      // Make button interactive
      const hitArea = new Phaser.Geom.Rectangle(
        btnX - unlockBtnWidth / 2,
        -unlockBtnHeight / 2,
        unlockBtnWidth,
        unlockBtnHeight
      );

      container.add([cardBg, icon, nameText, keyHint, descText, unlockBtnBg, unlockBtnText]);

      container.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -cardWidth / 2,
          -cardHeight / 2,
          cardWidth,
          cardHeight
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });

      container.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Check if click is on the button area
        const localX = pointer.x - x;
        if (localX > btnX - unlockBtnWidth / 2 && localX < btnX + unlockBtnWidth / 2) {
          this.attemptUnlock(powerup);
        }
      });
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
