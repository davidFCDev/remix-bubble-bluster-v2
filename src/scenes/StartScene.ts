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
      .text(width / 2, height * 0.25 + 160, "RELOADED", {
        fontFamily: "Pixelify Sans",
        fontSize: "48px",
        color: "#FFFFFF",
        fontStyle: "italic",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, "#000000", 6, true, true);

    // Start Button
    const btnWidth = 320; // Slightly wider
    const btnHeight = 80;
    const btnY = height * 0.75; // Moved up

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

    // Instructions Overlay
    const overlayY = height * 0.55;
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
