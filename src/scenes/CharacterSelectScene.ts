import * as Phaser from "phaser";
import GameSettings from "../config/GameSettings";

export class CharacterSelectScene extends Phaser.Scene {
  private currentIndex: number = 0;
  private charNameText!: Phaser.GameObjects.Text;
  private charLoreText!: Phaser.GameObjects.Text;
  private charSkillText!: Phaser.GameObjects.Text;
  private charPreviewSprite!: Phaser.GameObjects.Sprite;
  private charPreviewContainer!: Phaser.GameObjects.Container;

  constructor() {
    super("CharacterSelectScene");
  }

  create() {
    const { width, height } = this.cameras.main;

    // Create Animations first
    this.createAnimations();

    // Background overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);

    // Title
    this.add
      .text(width / 2, height * 0.15, "CHOOSE YOUR\nCHARACTER", {
        fontFamily: "Pixelify Sans",
        fontSize: "40px",
        color: "#ffd166",
        align: "center",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Card Container
    const cardWidth = Math.min(width * 0.8, 320);
    const cardHeight = 450;
    const cardX = width / 2;
    const cardY = height / 2;

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x0f0f0f, 0.85);
    cardBg.lineStyle(3, 0x000000);
    cardBg.fillRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      12
    );
    cardBg.strokeRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      12
    );

    this.charPreviewContainer = this.add.container(cardX, cardY, [cardBg]);

    // Character Preview Sprite
    this.charPreviewSprite = this.add
      .sprite(0, -100, `${GameSettings.characters[0].id}_idle`)
      .setScale(4); // 32x32 -> 128x128
    this.charPreviewSprite.play(
      `${GameSettings.characters[0].id}_idle_anim`,
      true
    ); // Need to create anims first

    // Character Info
    this.charNameText = this.add
      .text(0, 0, "", {
        fontFamily: "Pixelify Sans",
        fontSize: "24px",
        color: "#ffd166",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.charLoreText = this.add
      .text(0, 40, "", {
        fontFamily: "Pixelify Sans",
        fontSize: "14px",
        color: "#eae6dd",
        align: "center",
        wordWrap: { width: cardWidth - 40 },
      })
      .setOrigin(0.5, 0);

    this.charSkillText = this.add
      .text(0, 120, "", {
        fontFamily: "Pixelify Sans",
        fontSize: "14px",
        color: "#f3efe7",
        align: "center",
        wordWrap: { width: cardWidth - 40 },
      })
      .setOrigin(0.5, 0);

    // Select Button
    const selectBtn = this.add
      .text(0, 180, "SELECT", {
        fontFamily: "Pixelify Sans",
        fontSize: "20px",
        color: "#2b2b2b",
        backgroundColor: "#ffc1e3",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    selectBtn.on("pointerdown", () => {
      this.selectCharacter();
    });

    this.charPreviewContainer.add([
      this.charPreviewSprite,
      this.charNameText,
      this.charLoreText,
      this.charSkillText,
      selectBtn,
    ]);

    // Navigation Arrows
    const prevBtn = this.add
      .text(cardX - cardWidth / 2 - 40, cardY, "‹", {
        fontFamily: "Pixelify Sans",
        fontSize: "40px",
        color: "#ffd166",
        backgroundColor: "#000000",
        padding: { x: 10, y: 0 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const nextBtn = this.add
      .text(cardX + cardWidth / 2 + 40, cardY, "›", {
        fontFamily: "Pixelify Sans",
        fontSize: "40px",
        color: "#ffd166",
        backgroundColor: "#000000",
        padding: { x: 10, y: 0 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    prevBtn.on("pointerdown", () => this.changeCharacter(-1));
    nextBtn.on("pointerdown", () => this.changeCharacter(1));

    // Initial Update
    this.updateCharacterDisplay();
  }

  createAnimations() {
    GameSettings.characters.forEach((char) => {
      if (!this.anims.exists(`${char.id}_idle_anim`)) {
        this.anims.create({
          key: `${char.id}_idle_anim`,
          frames: this.anims.generateFrameNumbers(`${char.id}_idle`, {
            start: 0,
            end: 3,
          }),
          frameRate: 8,
          repeat: -1,
        });
      }
    });
  }

  changeCharacter(delta: number) {
    this.currentIndex =
      (this.currentIndex + delta + GameSettings.characters.length) %
      GameSettings.characters.length;
    this.updateCharacterDisplay();
  }

  updateCharacterDisplay() {
    const char = GameSettings.characters[this.currentIndex];
    this.charNameText.setText(char.name);
    this.charLoreText.setText(char.lore);
    this.charSkillText.setText(`Skill: ${char.skillDesc}`);

    this.charPreviewSprite.setTexture(`${char.id}_idle`);
    this.charPreviewSprite.play(`${char.id}_idle_anim`);
  }

  selectCharacter() {
    const selectedChar = GameSettings.characters[this.currentIndex];
    this.scene.start("GameScene", { character: selectedChar });
  }
}
