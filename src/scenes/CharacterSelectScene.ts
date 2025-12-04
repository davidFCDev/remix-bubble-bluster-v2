import * as Phaser from "phaser";
import GameSettings from "../config/GameSettings";

export class CharacterSelectScene extends Phaser.Scene {
  private currentIndex: number = 0;
  private charNameText!: Phaser.GameObjects.Text;
  private charLoreText!: Phaser.GameObjects.Text;
  private charSkillNameText!: Phaser.GameObjects.Text;
  private charSkillDescText!: Phaser.GameObjects.Text;
  private charPreviewSprite!: Phaser.GameObjects.Sprite;
  private charPreviewContainer!: Phaser.GameObjects.Container;
  private selectBtn!: Phaser.GameObjects.Container;

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
      .text(width / 2, height * 0.1, "CHOOSE YOUR\nCHARACTER", {
        fontFamily: "Pixelify Sans",
        fontSize: "48px",
        color: "#B7FF00", // Neon Green
        fontStyle: "bold",
        align: "center",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Card Container
    // Calculate width to leave space for arrows (approx 100px each side)
    const cardWidth = width - 250;
    const cardHeight = height * 0.65; // Reduced height
    const cardX = width / 2;
    const cardY = height / 2 + 40; // Shift down slightly more

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
      .sprite(0, -cardHeight * 0.3, `${GameSettings.characters[0].id}_idle`) // Moved up more
      .setScale(7); // Even Larger sprite

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
      .text(0, -cardHeight * 0.05, "", {
        // Moved up
        fontFamily: "Pixelify Sans",
        fontSize: "56px", // Much Larger font
        color: "#B7FF00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.charLoreText = this.add
      .text(0, cardHeight * 0.02, "", {
        // Closer to name
        fontFamily: "Pixelify Sans",
        fontSize: "24px",
        color: "#FFFFFF",
        align: "center",
        wordWrap: { width: cardWidth - 80 },
      })
      .setOrigin(0.5, 0);

    this.charSkillNameText = this.add
      .text(0, cardHeight * 0.15, "", {
        fontFamily: "Pixelify Sans",
        fontSize: "32px", // Larger font
        color: "#B7FF00", // Neon Green
        align: "center",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    this.charSkillDescText = this.add
      .text(0, cardHeight * 0.22, "", {
        fontFamily: "Pixelify Sans",
        fontSize: "26px", // Larger font
        color: "#00FFFF", // Cyan
        align: "center",
        wordWrap: { width: cardWidth - 60 },
        fontStyle: "italic",
      })
      .setOrigin(0.5, 0);

    // Select Button
    const btnWidth = 280;
    const btnHeight = 70;
    const btnY = cardHeight / 2; // Positioned exactly on the border

    this.selectBtn = this.add.container(0, btnY);

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
    // No stroke

    // Make interactive using a geom shape since Graphics doesn't have size by default
    const hitArea = new Phaser.Geom.Rectangle(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight
    );
    this.selectBtn.setInteractive({
      hitArea: hitArea,
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    const btnText = this.add
      .text(0, 0, "SELECT", {
        fontFamily: "Pixelify Sans",
        fontSize: "36px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.selectBtn.add([btnBg, btnText]);

    this.selectBtn.on("pointerdown", () => {
      this.selectCharacter();
    });

    // Removed hover effects as requested

    this.charPreviewContainer.add([
      this.charPreviewSprite,
      this.charNameText,
      this.charLoreText,
      this.charSkillNameText,
      this.charSkillDescText,
      this.selectBtn,
    ]);

    // Navigation Arrows
    const prevBtn = this.add
      .text(cardX - cardWidth / 2 - 60, cardY, "‹", {
        fontFamily: "Pixelify Sans",
        fontSize: "80px",
        color: "#ffffff", // White
        padding: { x: 10, y: 0 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const nextBtn = this.add
      .text(cardX + cardWidth / 2 + 60, cardY, "›", {
        fontFamily: "Pixelify Sans",
        fontSize: "80px",
        color: "#ffffff", // White
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

    const [skillName, skillDesc] = char.skillDesc.split(": ");
    this.charSkillNameText.setText(`~ ${skillName} ~`);
    this.charSkillDescText.setText(skillDesc);

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
