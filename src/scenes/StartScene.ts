import * as Phaser from "phaser";

export class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add
      .image(width / 2, height / 2, "background")
      .setDisplaySize(width, height);

    // Title
    const titleText = this.add
      .text(width / 2, height * 0.3, "BUBBLE\nBLUSTER", {
        fontFamily: "Pixelify Sans",
        fontSize: "100px", // Larger
        color: "#B7FF00", // Neon Green
        align: "center",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, "#000000", 8, true, true);

    // Start Button
    const btnWidth = 280;
    const btnHeight = 70;
    const btnY = height * 0.7;

    const startBtnContainer = this.add.container(width / 2, btnY);

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
        fontSize: "36px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    startBtnContainer.add([btnBg, btnText]);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight
    );
    startBtnContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    startBtnContainer.on("pointerdown", () => {
      this.scene.start("CharacterSelectScene");
    });
  }
}
