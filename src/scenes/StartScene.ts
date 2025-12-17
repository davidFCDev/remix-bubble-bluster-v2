export class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add
      .image(width / 2, height / 2, "bg_start")
      .setDisplaySize(width, height);

    // Title
    const titleText = this.add
      .text(width / 2, height * 0.25, "BUBBLE\nBLUSTER", {
        fontFamily: "Pixelify Sans",
        fontSize: "130px", // Larger
        color: "#B7FF00", // Neon Green
        align: "center",
        stroke: "#000000",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setShadow(0, 6, "#000000", 10, true, true);

    // Subtitle "RELOADED"
    this.add
      .text(width / 2, height * 0.25 + 150, "RELOADED", {
        fontFamily: "Pixelify Sans",
        fontSize: "38px",
        color: "#FFFFFF",
        fontStyle: "italic",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, "#000000", 6, true, true);

    // Start Button
    const btnWidth = 320; // Slightly wider
    const btnHeight = 80;
    const btnY = height * 0.58; // Moved down for better spacing

    const startBtnContainer = this.add.container(width / 2, btnY);

    // Button Shadow (Graphics)
    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0x000000, 1);
    btnShadow.fillRoundedRect(
      -btnWidth / 2 + 8, // Offset X
      -btnHeight / 2 + 8, // Offset Y
      btnWidth,
      btnHeight,
      15
    );

    // Button Background (Rounded Graphics)
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xb7ff00, 1); // Neon Green
    btnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      15
    );

    const btnText = this.add
      .text(0, 0, "START", {
        fontFamily: "Pixelify Sans",
        fontSize: "42px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    startBtnContainer.add([btnShadow, btnBg, btnText]);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight
    );
    startBtnContainer.setInteractive({
      hitArea: hitArea,
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    startBtnContainer.on("pointerdown", () => {
      this.sound.play("sfx_button");
      this.scene.start("CharacterSelectScene");
    });

    // Style Button (below Start) - Same size as Start button
    const btnSpacing = 115; // Uniform spacing between buttons
    const styleBtnY = btnY + btnSpacing;

    // Check if player has exclusive balls unlocked
    const hasExclusiveBalls =
      window.FarcadeSDK?.purchasedItems?.includes("exclusive-balls") ?? false;

    if (hasExclusiveBalls) {
      // UNLOCKED: Show normal STYLE button
      const styleBtnContainer = this.add.container(width / 2, styleBtnY);

      const styleBtnShadow = this.add.graphics();
      styleBtnShadow.fillStyle(0x000000, 1);
      styleBtnShadow.fillRoundedRect(
        -btnWidth / 2 + 8,
        -btnHeight / 2 + 8,
        btnWidth,
        btnHeight,
        15
      );

      const styleBtnBg = this.add.graphics();
      styleBtnBg.fillStyle(0x9932cc, 1); // Purple
      styleBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        15
      );

      const styleBtnText = this.add
        .text(0, 0, `STYLE`, {
          fontFamily: "Pixelify Sans",
          fontSize: "42px",
          color: "#FFFFFF",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      styleBtnContainer.add([styleBtnShadow, styleBtnBg, styleBtnText]);

      styleBtnContainer.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -btnWidth / 2,
          -btnHeight / 2,
          btnWidth,
          btnHeight
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });

      styleBtnContainer.on("pointerdown", () => {
        this.sound.play("sfx_button");
        this.scene.start("BubbleStyleScene");
      });
    } else {
      // LOCKED: Show STYLE button disabled with credits badge
      const unlockBtnContainer = this.add.container(width / 2, styleBtnY);

      const unlockBtnShadow = this.add.graphics();
      unlockBtnShadow.fillStyle(0x000000, 1);
      unlockBtnShadow.fillRoundedRect(
        -btnWidth / 2 + 8,
        -btnHeight / 2 + 8,
        btnWidth,
        btnHeight,
        15
      );

      const unlockBtnBg = this.add.graphics();
      unlockBtnBg.fillStyle(0x4a2666, 1); // Darker purple (disabled look)
      unlockBtnBg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        15
      );

      const unlockBtnText = this.add
        .text(0, 0, `STYLE`, {
          fontFamily: "Pixelify Sans",
          fontSize: "42px",
          color: "#888888", // Grayed out text
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      unlockBtnContainer.add([unlockBtnShadow, unlockBtnBg, unlockBtnText]);

      // Credits Badge
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(0xffd700, 1); // Gold color
      badgeBg.lineStyle(3, 0x000000, 1); // Black border
      badgeBg.fillRoundedRect(-90, -20, 180, 40, 12);
      badgeBg.strokeRoundedRect(-90, -20, 180, 40, 12);

      const badgeText = this.add
        .text(0, 0, "10 Credits", {
          fontFamily: "Pixelify Sans",
          fontSize: "26px",
          color: "#000000",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      const creditsBadge = this.add.container(
        width / 2,
        styleBtnY + btnHeight / 2 + 12
      );
      creditsBadge.add([badgeBg, badgeText]);

      unlockBtnContainer.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(
          -btnWidth / 2,
          -btnHeight / 2,
          btnWidth,
          btnHeight
        ),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });

      unlockBtnContainer.on("pointerdown", () => {
        this.sound.play("sfx_button");
        if (window.FarcadeSDK) {
          window.FarcadeSDK.purchase({ item: "exclusive-balls" });
          window.FarcadeSDK.onPurchaseComplete((success) => {
            if (success) {
              // Restart scene to refresh UI
              this.scene.restart();
            }
          });
        }
      });
    }

    // Power-ups Button (below Style)
    const powerupsBtnY = styleBtnY + btnSpacing;

    const powerupsBtnContainer = this.add.container(width / 2, powerupsBtnY);

    const powerupsBtnShadow = this.add.graphics();
    powerupsBtnShadow.fillStyle(0x000000, 1);
    powerupsBtnShadow.fillRoundedRect(
      -btnWidth / 2 + 8,
      -btnHeight / 2 + 8,
      btnWidth,
      btnHeight,
      15
    );

    const powerupsBtnBg = this.add.graphics();
    powerupsBtnBg.fillStyle(0x01003d, 1); // Dark Blue
    powerupsBtnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      15
    );

    const powerupsBtnText = this.add
      .text(0, 0, "POWER-UPS", {
        fontFamily: "Pixelify Sans",
        fontSize: "42px",
        color: "#FFFFFF",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    powerupsBtnContainer.add([
      powerupsBtnShadow,
      powerupsBtnBg,
      powerupsBtnText,
    ]);

    powerupsBtnContainer.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    powerupsBtnContainer.on("pointerdown", () => {
      this.sound.play("sfx_button");
      this.scene.start("PowerupsScene");
    });

    // Instructions Overlay
    const overlayY = height * 0.48;
    const overlayHeight = 100; // Taller for larger text

    this.add.rectangle(
      width / 2,
      overlayY,
      width,
      overlayHeight,
      0x000000,
      0.6
    );

    this.add
      .text(
        width / 2,
        overlayY,
        "Use Left/Right Arrow to aim, Space to\nshoot, and E to activate your Skill.",
        {
          fontFamily: "Pixelify Sans",
          fontSize: "28px", // Larger
          color: "#ffffff",
          align: "center",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);
  }
}
