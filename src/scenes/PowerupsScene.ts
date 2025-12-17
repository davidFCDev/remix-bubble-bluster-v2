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
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    // Title
    this.add
      .text(width / 2, height * 0.08, "POWER-UPS", {
        fontFamily: "Pixelify Sans",
        fontSize: "56px",
        color: "#FFD700",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Subtitle explanation
    this.add
      .text(
        width / 2,
        height * 0.14,
        "Unlock once, use once per game!",
        {
          fontFamily: "Pixelify Sans",
          fontSize: "22px",
          color: "#AAAAAA",
        }
      )
      .setOrigin(0.5);

    // Info text
    this.add
      .text(
        width / 2,
        height * 0.19,
        "These power-ups are unlocked forever.\nActivate them with number keys [1] [2] [3] during gameplay.",
        {
          fontFamily: "Pixelify Sans",
          fontSize: "18px",
          color: "#888888",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Create power-up cards
    const powerups = GameSettings.powerups;
    const cardHeight = 160;
    const startY = height * 0.32;
    const spacing = cardHeight + 20;

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
    const btnWidth = 200;
    const btnHeight = 60;
    const btnY = height * 0.9;

    const backBtn = this.add.container(width / 2, btnY);

    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0x000000, 1);
    btnShadow.fillRoundedRect(
      -btnWidth / 2 + 5,
      -btnHeight / 2 + 5,
      btnWidth,
      btnHeight,
      12
    );

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x666666, 1);
    btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);

    const btnText = this.add
      .text(0, 0, "BACK", {
        fontFamily: "Pixelify Sans",
        fontSize: "32px",
        color: "#FFFFFF",
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
    const cardWidth = width * 0.85;
    const cardHeight = 150;
    const isUnlocked = this.registry.get(`powerup_${powerup.id}`) || false;

    const container = this.add.container(x, y);

    // Card background
    const cardBg = this.add.graphics();
    cardBg.fillStyle(isUnlocked ? 0x2a4a2a : 0x1a1a2e, 1);
    cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
    cardBg.lineStyle(3, isUnlocked ? 0x44ff44 : 0x444466);
    cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);

    // Icon
    const icon = this.add
      .text(-cardWidth / 2 + 50, 0, powerup.icon, {
        fontSize: "48px",
      })
      .setOrigin(0.5);

    // Name
    const nameText = this.add
      .text(-cardWidth / 2 + 110, -cardHeight / 4, powerup.name, {
        fontFamily: "Pixelify Sans",
        fontSize: "28px",
        color: isUnlocked ? "#44FF44" : "#FFFFFF",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    // Key binding hint
    const keyHint = this.add
      .text(-cardWidth / 2 + 110, 0, `Press [${keyNumber}] to activate`, {
        fontFamily: "Pixelify Sans",
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0, 0.5);

    // Description
    const descText = this.add
      .text(-cardWidth / 2 + 110, cardHeight / 4, powerup.description, {
        fontFamily: "Pixelify Sans",
        fontSize: "16px",
        color: "#AAAAAA",
        wordWrap: { width: cardWidth - 200 },
      })
      .setOrigin(0, 0.5);

    // Unlock button or status
    const btnWidth = 100;
    const btnHeight = 45;
    const btnX = cardWidth / 2 - 70;

    if (isUnlocked) {
      // Show "UNLOCKED" badge
      const badge = this.add
        .text(btnX, 0, "✓ READY", {
          fontFamily: "Pixelify Sans",
          fontSize: "20px",
          color: "#44FF44",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      container.add([cardBg, icon, nameText, keyHint, descText, badge]);
    } else {
      // Show unlock button
      const unlockBtnBg = this.add.graphics();
      unlockBtnBg.fillStyle(0xffd700, 1);
      unlockBtnBg.fillRoundedRect(
        btnX - btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        10
      );

      const unlockBtnText = this.add
        .text(btnX, 0, `${powerup.cost} 💰`, {
          fontFamily: "Pixelify Sans",
          fontSize: "20px",
          color: "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      // Make button interactive
      const hitArea = new Phaser.Geom.Rectangle(
        btnX - btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight
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
        if (localX > btnX - btnWidth / 2 && localX < btnX + btnWidth / 2) {
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
