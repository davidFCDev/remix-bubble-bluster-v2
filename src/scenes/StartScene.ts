import * as Phaser from "phaser"
import GameSettings from "../config/GameSettings"

export class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene")
  }

  create() {
    const { width, height } = this.cameras.main

    // Background
    this.add
      .image(width / 2, height / 2, "background")
      .setDisplaySize(width, height)

    // Title
    const titleText = this.add
      .text(width / 2, height * 0.3, "BUBBLE\nBLUSTER", {
        fontFamily: "Pixelify Sans",
        fontSize: "80px",
        color: "#ffd166",
        align: "center",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, "#000000", 8, true, true)

    // Start Button
    const startBtn = this.add
      .text(width / 2, height * 0.7, "START", {
        fontFamily: "Pixelify Sans",
        fontSize: "32px",
        color: "#2b2b2b",
        backgroundColor: "#ffc1e3",
        padding: { x: 32, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setStyle({
        fixedWidth: 200,
        align: "center",
      })

    // Button styling tweaks (simulating CSS border radius is hard in pure canvas text, 
    // but we can use a container or graphics if needed. For now, simple text block)
    
    startBtn.on("pointerover", () => {
      startBtn.setStyle({ backgroundColor: "#ffb3db" })
      startBtn.setScale(1.05)
    })

    startBtn.on("pointerout", () => {
      startBtn.setStyle({ backgroundColor: "#ffc1e3" })
      startBtn.setScale(1)
    })

    startBtn.on("pointerdown", () => {
      startBtn.setStyle({ backgroundColor: "#ffa6d3" })
      startBtn.setScale(0.95)
    })

    startBtn.on("pointerup", () => {
      this.scene.start("CharacterSelectScene")
    })
  }
}
