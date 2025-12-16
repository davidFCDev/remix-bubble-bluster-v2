import GameSettings from "../config/GameSettings";
import { BubbleVisuals } from "../objects/BubbleVisuals";

export class BubbleStyleScene extends Phaser.Scene {
  private currentIndex: number = 0;
  private previewContainer!: Phaser.GameObjects.Container;
  private styleNameText!: Phaser.GameObjects.Text;
  private styleDescText!: Phaser.GameObjects.Text;
  private lockedOverlay!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "BubbleStyleScene" });
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
      .text(width / 2, height * 0.1, "BUBBLE STYLE", {
        fontFamily: "Pixelify Sans",
        fontSize: "64px",
        color: "#B7FF00",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Preview area
    const previewY = height * 0.4;
    this.previewContainer = this.add.container(width / 2, previewY);

    // Style name
    this.styleNameText = this.add
      .text(width / 2, previewY + 150, "", {
        fontFamily: "Pixelify Sans",
        fontSize: "48px",
        color: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Style description
    this.styleDescText = this.add
      .text(width / 2, previewY + 200, "", {
        fontFamily: "Pixelify Sans",
        fontSize: "24px",
        color: "#AAAAAA",
      })
      .setOrigin(0.5);

    // Locked overlay
    this.lockedOverlay = this.add.container(width / 2, previewY);
    const lockIcon = this.add
      .text(0, 0, "🔒", {
        fontSize: "80px",
      })
      .setOrigin(0.5);
    const lockText = this.add
      .text(0, 60, "LOCKED", {
        fontFamily: "Pixelify Sans",
        fontSize: "32px",
        color: "#FF4444",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.lockedOverlay.add([lockIcon, lockText]);
    this.lockedOverlay.setVisible(false);

    // Navigation arrows
    const arrowStyle = {
      fontFamily: "Pixelify Sans",
      fontSize: "80px",
      color: "#B7FF00",
    };

    const leftArrow = this.add
      .text(width * 0.15, previewY, "<", arrowStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const rightArrow = this.add
      .text(width * 0.85, previewY, ">", arrowStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leftArrow.on("pointerdown", () => this.navigate(-1));
    rightArrow.on("pointerdown", () => this.navigate(1));

    // Select button
    const btnWidth = 280;
    const btnHeight = 70;
    const btnY = height * 0.75;

    const selectBtn = this.add.container(width / 2, btnY);
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
    btnBg.fillStyle(0xb7ff00, 1);
    btnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      12
    );

    const btnText = this.add
      .text(0, 0, "SELECT", {
        fontFamily: "Pixelify Sans",
        fontSize: "36px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    selectBtn.add([btnShadow, btnBg, btnText]);
    selectBtn.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    selectBtn.on("pointerdown", () => this.selectStyle());

    // Back button
    const backBtn = this.add
      .text(width * 0.1, height * 0.05, "← BACK", {
        fontFamily: "Pixelify Sans",
        fontSize: "28px",
        color: "#FFFFFF",
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    backBtn.on("pointerdown", () => {
      this.sound.play("sfx_button");
      this.scene.start("StartScene");
    });

    // Keyboard input
    this.input.keyboard?.on("keydown-LEFT", () => this.navigate(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.navigate(1));
    this.input.keyboard?.on("keydown-ENTER", () => this.selectStyle());
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("StartScene")
    );

    // Generate textures if needed
    BubbleVisuals.generateTextures(this);

    // Show initial style
    this.updatePreview();
  }

  navigate(direction: number) {
    this.sound.play("sfx_button");
    const styles = GameSettings.bubbleStyles;
    this.currentIndex =
      (this.currentIndex + direction + styles.length) % styles.length;
    this.updatePreview();
  }

  updatePreview() {
    const style = GameSettings.bubbleStyles[this.currentIndex];

    // Clear previous preview
    this.previewContainer.removeAll(true);

    // Show 5 bubbles in a row with different colors
    const colors = GameSettings.colors.all;
    const spacing = 90;
    const startX = -((colors.length - 1) * spacing) / 2;

    colors.forEach((color, i) => {
      const bubble = BubbleVisuals.createWithStyle(
        this,
        startX + i * spacing,
        0,
        70,
        color,
        style.id
      );
      this.previewContainer.add(bubble);
    });

    // Update text
    this.styleNameText.setText(style.name);
    this.styleDescText.setText(style.description);

    // Show/hide locked overlay
    this.lockedOverlay.setVisible(style.locked);
    if (style.locked) {
      this.previewContainer.setAlpha(0.4);
    } else {
      this.previewContainer.setAlpha(1);
    }
  }

  selectStyle() {
    const style = GameSettings.bubbleStyles[this.currentIndex];

    if (style.locked) {
      // Show locked message
      this.cameras.main.shake(100, 0.01);
      return;
    }

    this.sound.play("sfx_button");
    // Save selected style to registry for other scenes to access
    this.registry.set("bubbleStyle", style.id);
    this.scene.start("StartScene");
  }
}
