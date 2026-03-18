import GameSettings from "../config/GameSettings";

export class CharacterSelectScene extends Phaser.Scene {
  private currentIndex: number = 0; // Start with Pinky
  private charNameText!: Phaser.GameObjects.Text;
  private charLoreText!: Phaser.GameObjects.Text;
  private charSkillNameText!: Phaser.GameObjects.Text;
  private charSkillDescText!: Phaser.GameObjects.Text;
  private charPreviewSprite!: Phaser.GameObjects.Sprite;
  private charPreviewContainer!: Phaser.GameObjects.Container;
  private selectBtn!: Phaser.GameObjects.Container;
  private epicBadge!: Phaser.GameObjects.Text;
  private unlockBadge!: Phaser.GameObjects.Container;
  private btnText!: Phaser.GameObjects.Text;
  private btnBg!: Phaser.GameObjects.Graphics;
  private btnY!: number;
  private cardHeight!: number;
  private epicCharUnlocked: boolean = false;

  constructor() {
    super("CharacterSelectScene");
  }

  async create() {
    const { width, height } = this.cameras.main;

    // Fullscreen tall-screen offset (see ASPECT-RATIO-GUIDE.md)
    const topOffset: number = this.registry.get("topOffset") || 0;

    // Check if epic character is already owned
    if (window.RemixSDK) {
      try {
        this.epicCharUnlocked = await window.RemixSDK.hasItem("epic-character");
      } catch {
        this.epicCharUnlocked = false;
      }
    }

    // Create Animations first
    this.createAnimations();

    // Background overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);

    // Title
    this.add
      .text(width / 2, height * 0.1 + topOffset, "CHOOSE YOUR\nCHARACTER", {
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
    this.cardHeight = height * 0.65; // Reduced height
    const cardHeight = this.cardHeight;
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
      20,
    );
    cardBg.strokeRoundedRect(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
      20,
    );

    this.charPreviewContainer = this.add.container(cardX, cardY, [cardBg]);

    // Character Preview Sprite
    const initialChar = GameSettings.characters[0];
    const initialScale = initialChar.frameConfig?.scale
      ? initialChar.frameConfig.scale * 1.17
      : 7;
    this.charPreviewSprite = this.add
      .sprite(0, -cardHeight * 0.3, `${initialChar.id}_idle`) // Moved up more
      .setScale(initialScale);

    if (this.charPreviewSprite.texture) {
      this.charPreviewSprite.texture.setFilter(
        Phaser.Textures.FilterMode.NEAREST,
      );
    }

    this.charPreviewSprite.play(
      `${GameSettings.characters[0].id}_idle_anim`,
      true,
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
    this.btnY = cardHeight / 2; // Positioned exactly on the border

    this.selectBtn = this.add.container(0, this.btnY);

    // Button Background (Rounded Graphics)
    this.btnBg = this.add.graphics();
    this.btnBg.fillStyle(0xb7ff00, 1); // Neon Green
    this.btnBg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      15,
    );
    // No stroke

    // Make interactive using a geom shape since Graphics doesn't have size by default
    const hitArea = new Phaser.Geom.Rectangle(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
    );
    this.selectBtn.setInteractive({
      hitArea: hitArea,
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    this.btnText = this.add
      .text(0, 0, "SELECT", {
        fontFamily: "Pixelify Sans",
        fontSize: "36px",
        color: "#000000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.selectBtn.add([this.btnBg, this.btnText]);

    this.selectBtn.on("pointerdown", () => {
      this.sound.play("sfx_button");
      this.selectCharacter();
    });

    // Epic Badge (shown only for WitchKitty)
    this.epicBadge = this.add
      .text(0, -cardHeight * 0.05 + 40, "(Epic)", {
        fontFamily: "Pixelify Sans",
        fontSize: "22px",
        color: "#8B00FF", // Purple
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.epicBadge.setVisible(false);

    // "Unlock in Store" badge (shown instead of SELECT when locked)
    this.unlockBadge = this.add.container(0, this.btnY);
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0x333333, 0.9);
    badgeBg.fillRoundedRect(-140, -30, 280, 60, 12);
    badgeBg.lineStyle(2, 0x8b00ff, 1);
    badgeBg.strokeRoundedRect(-140, -30, 280, 60, 12);
    const badgeText = this.add
      .text(0, 0, "Unlock in Store", {
        fontFamily: "Pixelify Sans",
        fontSize: "30px",
        color: "#8B00FF",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.unlockBadge.add([badgeBg, badgeText]);
    this.unlockBadge.setVisible(false);

    // Make badge interactive to trigger purchase
    const badgeHitArea = new Phaser.Geom.Rectangle(-140, -30, 280, 60);
    this.unlockBadge.setInteractive({
      hitArea: badgeHitArea,
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.unlockBadge.on("pointerdown", () => {
      this.sound.play("sfx_button");
      this.selectCharacter();
    });

    // Removed hover effects as requested

    this.charPreviewContainer.add([
      this.charPreviewSprite,
      this.charNameText,
      this.epicBadge,
      this.charLoreText,
      this.charSkillNameText,
      this.charSkillDescText,
      this.selectBtn,
      this.unlockBadge,
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

    prevBtn.on("pointerdown", () => {
      this.sound.play("sfx_button");
      this.changeCharacter(-1);
    });
    nextBtn.on("pointerdown", () => {
      this.sound.play("sfx_button");
      this.changeCharacter(1);
    });

    // Initial Update
    this.updateCharacterDisplay();
  }

  createAnimations() {
    GameSettings.characters.forEach((char: any) => {
      if (!this.anims.exists(`${char.id}_idle_anim`)) {
        // Use frameCount from config, default to 4 frames (0-3)
        const endFrame = (char.frameConfig?.frameCount || 4) - 1;
        this.anims.create({
          key: `${char.id}_idle_anim`,
          frames: this.anims.generateFrameNumbers(`${char.id}_idle`, {
            start: 0,
            end: endFrame,
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
    // Adjust scale based on character frame size
    const charScale = char.frameConfig?.scale
      ? char.frameConfig.scale * 1.17
      : 7;
    this.charPreviewSprite.setScale(charScale);
    if (this.charPreviewSprite.texture) {
      this.charPreviewSprite.texture.setFilter(
        Phaser.Textures.FilterMode.NEAREST,
      );
    }
    this.charPreviewSprite.play(`${char.id}_idle_anim`);

    const isEpicCharacter = char.id === "WitchKitty";
    const isLocked = isEpicCharacter && !this.epicCharUnlocked;

    // Show Epic badge only for WitchKitty
    this.epicBadge.setVisible(isEpicCharacter);

    // Darken sprite when locked (no lock icon, just darker)
    this.charPreviewSprite.setTint(isLocked ? 0x555555 : 0xffffff);
    this.charPreviewSprite.setAlpha(isLocked ? 0.6 : 1);

    // Toggle SELECT button vs "Unlock in Store" badge
    this.selectBtn.setVisible(!isLocked);
    this.unlockBadge.setVisible(isLocked);
  }

  async selectCharacter() {
    const selectedChar = GameSettings.characters[this.currentIndex];
    const isLocked = selectedChar.id === "WitchKitty" && !this.epicCharUnlocked;

    if (isLocked) {
      // Trigger SDK purchase flow
      if (!window.RemixSDK) return;
      try {
        const result = await window.RemixSDK.purchaseItem("epic-character");
        if (result?.success) {
          this.epicCharUnlocked = true;
          if (window.RemixSDK) window.RemixSDK.hapticFeedback();
          this.updateCharacterDisplay();
        }
      } catch {
        // Purchase cancelled or failed — do nothing
      }
      return;
    }

    this.scene.start("GameScene", { character: selectedChar });
  }
}
