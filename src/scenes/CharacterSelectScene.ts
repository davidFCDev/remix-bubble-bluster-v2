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
    const cardWidth = Math.min(width * 0.95, 420); // Increased width even more
    const cardHeight = 650; // Increased height significantly
    const cardX = width / 2;
    const cardY = height / 2;

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x111111, 0.95);
    cardBg.lineStyle(4, 0xb7ff00); // Neon Green Border
    cardBg.fillRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      20
    );
    cardBg.strokeRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      20
    );

    this.charPreviewContainer = this.add.container(cardX, cardY, [cardBg]);

    // Character Preview Sprite
    this.charPreviewSprite = this.add
      .sprite(0, -180, `${GameSettings.characters[0].id}_idle`) // Moved up more
      .setScale(6); // Larger sprite (was 5)

    if (this.charPreviewSprite.texture) {
      this.charPreviewSprite.texture.setFilter(
        Phaser.Textures.FilterMode.NEAREST
      );
    }

    this.charPreviewSprite.play(
      `${GameSettings.characters[0].id}_idle_anim`,
      true
    );

    // Character Info
    this.charNameText = this.add
      .text(0, -40, "", {
        // Moved up
        fontFamily: "Pixelify Sans",
        fontSize: "42px", // Larger font
        color: "#B7FF00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.charLoreText = this.add
      .text(0, 30, "", {
        fontFamily: "Pixelify Sans",
        fontSize: "20px", // Larger font
        color: "#FFFFFF",
        align: "center",
        wordWrap: { width: cardWidth - 60 },
      })
      .setOrigin(0.5, 0);

    this.charSkillText = this.add
      .text(0, 160, "", {
        // Moved down slightly
        fontFamily: "Pixelify Sans",
        fontSize: "20px", // Larger font
        color: "#00FFFF", // Cyan
        align: "center",
        wordWrap: { width: cardWidth - 60 },
        fontStyle: "italic",
      })
      .setOrigin(0.5, 0);

    // Select Button
    const selectBtn = this.add.container(0, 260); // Moved down
    const btnBg = this.add
      .rectangle(0, 0, 240, 70, 0xb7ff00)
      .setInteractive({ useHandCursor: true }); // Larger button
    const btnTxt = this.add
      .text(0, 0, "SELECT", {
        fontFamily: "Pixelify Sans",
        fontSize: "32px", // Larger text
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    selectBtn.add([btnBg, btnTxt]);

    btnBg.on("pointerdown", () => {
      this.selectCharacter();
    });

    btnBg.on("pointerover", () => btnBg.setFillStyle(0xffffff));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0xb7ff00));

    this.charPreviewContainer.add([
      this.charPreviewSprite,
      this.charNameText,
      this.charLoreText,
      this.charSkillText,
      selectBtn,
    ]);

    // Navigation Arrows
    const prevBtn = this.add
      .text(cardX - cardWidth / 2 - 60, cardY, "‹", {
        fontFamily: "Pixelify Sans",
        fontSize: "80px",
        color: "#ffd166",
        padding: { x: 10, y: 0 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const nextBtn = this.add
      .text(cardX + cardWidth / 2 + 60, cardY, "›", {
        fontFamily: "Pixelify Sans",
        fontSize: "80px",
        color: "#ffd166",
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
    if (this.charPreviewSprite.texture) {
      this.charPreviewSprite.texture.setFilter(
        Phaser.Textures.FilterMode.NEAREST
      );
    }
    this.charPreviewSprite.play(`${char.id}_idle_anim`);
  }

  selectCharacter() {
    const selectedChar = GameSettings.characters[this.currentIndex];
    this.scene.start("GameScene", { character: selectedChar });
  }
}
