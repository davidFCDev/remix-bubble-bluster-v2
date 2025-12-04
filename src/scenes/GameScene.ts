import * as Phaser from "phaser"
import GameSettings from "../config/GameSettings"

interface Bubble {
  x: number
  y: number
  color: string
  velocity: { x: number; y: number }
  moving: boolean
  isSpecial?: boolean
  isWild?: boolean
  isBomb?: boolean
  sprite?: Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite
}

export class GameScene extends Phaser.Scene {
  private grid: (string | null)[][] = []
  private bubbleSprites: (Phaser.GameObjects.Arc | null)[][] = []
  private currentBubble: Bubble | null = null
  private nextBubbles: string[] = []
  private launcherAngle: number = Math.PI / 2
  private score: number = 0
  private level: number = 1
  private ceilingOffset: number = 0
  private shotCount: number = 0
  private gameOver: boolean = false
  private gameStarted: boolean = false
  private selectedCharacter: any = null
  private abilityAvailable: boolean = true
  private whiteyWildShotsLeft: number = 0
  
  // UI
  private scoreText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private nextBubblePreviews: Phaser.GameObjects.Arc[] = []
  private trajectoryGraphics!: Phaser.GameObjects.Graphics
  private ceilingGraphics!: Phaser.GameObjects.Graphics
  private gameContainer!: Phaser.GameObjects.Container
  private skillBtn!: Phaser.GameObjects.Container
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private characterSprite!: Phaser.GameObjects.Sprite
  private arrowGraphics!: Phaser.GameObjects.Graphics
  private limitLineGraphics!: Phaser.GameObjects.Graphics

  // Constants
  private BUBBLE_SIZE!: number
  private GRID_WIDTH = GameSettings.grid.width
  private GRID_HEIGHT = GameSettings.grid.height
  private LIMIT_LINE_Y!: number

  constructor() {
    super("GameScene")
  }

  init(data: any) {
    this.selectedCharacter = data.character || GameSettings.characters[0]
    this.score = 0
    this.level = 1
    this.gameOver = false
    this.gameStarted = false
    this.ceilingOffset = 0
    this.shotCount = 0
    this.abilityAvailable = true
    this.whiteyWildShotsLeft = 0
    this.launcherAngle = Math.PI / 2
  }

  create() {
    const { width, height } = this.cameras.main
    this.BUBBLE_SIZE = width / this.GRID_WIDTH
    this.LIMIT_LINE_Y = height - 200 // Adjusted limit line

    // Background
    this.add.image(width / 2, height / 2, "background").setDisplaySize(width, height)
    
    // Background Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4)

    // Limit Line
    this.limitLineGraphics = this.add.graphics()
    this.drawLimitLine()

    // Game Container (for grid and bubbles)
    this.gameContainer = this.add.container(0, 0)

    // Ceiling Graphics (outside container to cover top area)
    this.ceilingGraphics = this.add.graphics()
    
    // Trajectory Graphics
    this.trajectoryGraphics = this.add.graphics()
    
    // Arrow Graphics (Aiming)
    this.arrowGraphics = this.add.graphics()

    // Character Sprite (Bottom Left)
    this.characterSprite = this.add.sprite(60, height - 60, `${this.selectedCharacter.id}_idle`)
      .setScale(3)
      .play(`${this.selectedCharacter.id}_idle_anim`)

    // UI Header
    const headerBg = this.add.rectangle(width / 2, 25, width, 50, 0x1a1a1a).setOrigin(0.5)
    this.scoreText = this.add.text(20, 25, "Score: 0", { fontFamily: "Pixelify Sans", fontSize: "20px", color: "#f3efe7" }).setOrigin(0, 0.5)
    this.levelText = this.add.text(width / 2, 25, "Level: 1", { fontFamily: "Pixelify Sans", fontSize: "20px", color: "#f3efe7" }).setOrigin(0.5, 0.5)
    
    // Next Bubbles UI
    this.add.text(width - 100, height - 50, "Next:", { fontFamily: "Pixelify Sans", fontSize: "16px", color: "#fff" }).setOrigin(1, 0.5)
    this.nextBubblePreviews = [
      this.add.circle(width - 60, height - 50, 10, 0xffffff).setStrokeStyle(2, 0xffffff),
      this.add.circle(width - 30, height - 50, 10, 0xffffff).setStrokeStyle(2, 0xffffff)
    ]

    // Skill Button (Positioned near character)
    this.createSkillButton()

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.input.keyboard.on('keydown-SPACE', () => {
        if (!this.gameStarted) {
          this.startGame()
        } else {
          this.shootBubble()
        }
      })
    }

    // Keep pointer for shooting if desired, or remove
    this.input.on("pointerdown", () => {
      if (!this.gameStarted) {
        this.startGame()
      } else {
        this.shootBubble()
      }
    })

    // Initialize Level
    this.startLevel()
  }

  drawLimitLine() {
    this.limitLineGraphics.clear()
    this.limitLineGraphics.lineStyle(2, 0xff0000, 0.5)
    this.limitLineGraphics.beginPath()
    this.limitLineGraphics.moveTo(0, this.LIMIT_LINE_Y)
    this.limitLineGraphics.lineTo(this.cameras.main.width, this.LIMIT_LINE_Y)
    this.limitLineGraphics.strokePath()
  }

  createSkillButton() {
    const { width, height } = this.cameras.main
    // Position skill button next to character
    const btn = this.add.container(140, height - 60)
    
    const bg = this.add.circle(0, 0, 25, 0x333333).setStrokeStyle(2, 0xffd166)
    // Small icon for skill
    const icon = this.add.text(0, 0, "★", { fontSize: "24px", color: "#ffd166" }).setOrigin(0.5)
    
    btn.add([bg, icon])
    btn.setSize(50, 50)
    btn.setInteractive({ useHandCursor: true })
    
    btn.on("pointerdown", (pointer: any, localX: any, localY: any, event: any) => {
      event.stopPropagation() // Prevent shooting when clicking skill
      this.activateAbility()
    })
    
    this.skillBtn = btn
  }

  startGame() {
    this.gameStarted = true
  }

  startLevel() {
    // Reset Grid
    this.grid = Array(this.GRID_HEIGHT).fill(null).map(() => Array(this.GRID_WIDTH).fill(null))
    this.bubbleSprites = Array(this.GRID_HEIGHT).fill(null).map(() => Array(this.GRID_WIDTH).fill(null))
    this.gameContainer.removeAll(true) // Clear existing bubbles
    // Ceiling graphics is now outside container, so we don't add it here

    // Populate Grid
    const initialRows = Math.min(6 + Math.floor((this.level - 1) / 2), this.GRID_HEIGHT - 2)
    const usedColors = new Set<string>()
    
    for (let row = 0; row < initialRows; row++) {
      const isOddRow = row % 2 === 1
      const numBubbles = isOddRow ? this.GRID_WIDTH - 1 : this.GRID_WIDTH
      for (let col = 0; col < numBubbles; col++) {
        const color = GameSettings.colors.all[Math.floor(Math.random() * GameSettings.colors.all.length)]
        this.grid[row][col] = color
        usedColors.add(color)
        this.createBubbleSprite(row, col, color)
      }
    }

    // Setup Next Bubbles
    this.nextBubbles = [this.getRandomColor(Array.from(usedColors)), this.getRandomColor(Array.from(usedColors))]
    this.spawnBubble()
    this.updateUI()
    this.gameStarted = true
  }

  createBubbleSprite(row: number, col: number, color: string) {
    const { x, y } = this.getBubblePos(row, col)
    const circle = this.add.circle(x, y, this.BUBBLE_SIZE / 2 - 2, Phaser.Display.Color.HexStringToColor(color).color)
    circle.setStrokeStyle(2, 0xffffff)
    this.gameContainer.add(circle)
    this.bubbleSprites[row][col] = circle
  }

  getBubblePos(row: number, col: number) {
    const isOddRow = row % 2 === 1
    const offset = isOddRow ? this.BUBBLE_SIZE / 2 : 0
    const x = col * this.BUBBLE_SIZE + offset + this.BUBBLE_SIZE / 2
    const y = row * ((this.BUBBLE_SIZE * Math.sqrt(3)) / 2) + this.BUBBLE_SIZE / 2
    return { x, y }
  }

  getRandomColor(availableColors: string[]) {
    return availableColors[Math.floor(Math.random() * availableColors.length)] || GameSettings.colors.all[0]
  }

  spawnBubble() {
    const color = this.nextBubbles.shift()!
    this.nextBubbles.push(this.getRandomColor(GameSettings.colors.all)) // Simplified for now
    
    const { width, height } = this.cameras.main
    
    this.currentBubble = {
      x: width / 2,
      y: height - 20,
      color: color,
      velocity: { x: 0, y: 0 },
      moving: false,
      isSpecial: false,
      isWild: false,
      sprite: this.add.circle(width / 2, height - 20, this.BUBBLE_SIZE / 2 - 2, Phaser.Display.Color.HexStringToColor(color).color).setStrokeStyle(2, 0xffffff)
    }

    // Whitey Skill Check
    if (color === "#FFFFFF" && this.selectedCharacter.id === "Whitey" && this.whiteyWildShotsLeft > 0) {
      this.currentBubble.isWild = true
      this.whiteyWildShotsLeft--
    }

    this.updateUI()
  }

  shootBubble() {
    if (this.currentBubble && !this.currentBubble.moving) {
      const speed = 15 // Increased speed for Phaser
      this.currentBubble.velocity.x = Math.cos(this.launcherAngle) * speed
      this.currentBubble.velocity.y = -Math.sin(this.launcherAngle) * speed
      this.currentBubble.moving = true
      this.shotCount++
    }
  }

  update(time: number, delta: number) {
    if (!this.gameStarted || this.gameOver) return

    // Input Handling (Keyboard)
    if (this.cursors.left.isDown) {
      this.launcherAngle += 0.05
    } else if (this.cursors.right.isDown) {
      this.launcherAngle -= 0.05
    }
    // Clamp Angle (approx 10 to 170 degrees)
    this.launcherAngle = Phaser.Math.Clamp(this.launcherAngle, 0.2, Math.PI - 0.2)

    // Update Arrow Graphics
    this.arrowGraphics.clear()
    const startX = this.cameras.main.width / 2
    const startY = this.cameras.main.height - 20
    const length = 60
    const endX = startX + Math.cos(this.launcherAngle) * length
    const endY = startY - Math.sin(this.launcherAngle) * length
    
    // Draw Circle around launcher
    this.arrowGraphics.lineStyle(2, 0xffffff)
    this.arrowGraphics.strokeCircle(startX, startY, 30)
    
    // Draw Arrow Line
    this.arrowGraphics.lineStyle(3, 0xffffff)
    this.arrowGraphics.beginPath()
    this.arrowGraphics.moveTo(startX, startY)
    this.arrowGraphics.lineTo(endX, endY)
    this.arrowGraphics.strokePath()
    
    // Draw Arrow Head
    const arrowSize = 10
    const angle = this.launcherAngle
    const leftX = endX - arrowSize * Math.cos(angle - Math.PI / 6)
    const leftY = endY + arrowSize * Math.sin(angle - Math.PI / 6)
    const rightX = endX - arrowSize * Math.cos(angle + Math.PI / 6)
    const rightY = endY + arrowSize * Math.sin(angle + Math.PI / 6)
    
    this.arrowGraphics.fillStyle(0xffffff)
    this.arrowGraphics.beginPath()
    this.arrowGraphics.moveTo(endX, endY)
    this.arrowGraphics.lineTo(leftX, leftY)
    this.arrowGraphics.lineTo(rightX, rightY)
    this.arrowGraphics.closePath()
    this.arrowGraphics.fillPath()

    // Update Ceiling Graphics
    this.ceilingGraphics.clear()
    this.ceilingGraphics.fillStyle(0x000000)
    this.ceilingGraphics.fillRect(0, 0, this.cameras.main.width, this.ceilingOffset)
    
    // Sync grid bubbles position with ceiling offset
    this.gameContainer.y = this.ceilingOffset

    // Update Current Bubble
    if (this.currentBubble && this.currentBubble.moving) {
      this.currentBubble.x += this.currentBubble.velocity.x * (delta / 16)
      this.currentBubble.y += this.currentBubble.velocity.y * (delta / 16)
      
      if (this.currentBubble.sprite) {
        this.currentBubble.sprite.setPosition(this.currentBubble.x, this.currentBubble.y)
      }

      // Wall Collision
      if (this.currentBubble.x < this.BUBBLE_SIZE / 2 || this.currentBubble.x > this.cameras.main.width - this.BUBBLE_SIZE / 2) {
        this.currentBubble.velocity.x *= -1
        this.currentBubble.x = Phaser.Math.Clamp(this.currentBubble.x, this.BUBBLE_SIZE / 2, this.cameras.main.width - this.BUBBLE_SIZE / 2)
      }

      // Ceiling Collision
      if (this.currentBubble.y < this.BUBBLE_SIZE / 2 + this.ceilingOffset) {
        this.snapBubbleToGrid()
        return
      }

      // Bubble Collision
      const pos = this.getGridPos(this.currentBubble.x, this.currentBubble.y)
      // Check neighbors
      const neighbors = this.getNeighbors(pos.row, pos.col)
      // Also check the cell itself if occupied (shouldn't happen if logic is right, but for safety)
      if (this.grid[pos.row] && this.grid[pos.row][pos.col]) {
         this.snapBubbleToGrid()
         return
      }
      
      // Check collision with existing bubbles
      // We iterate nearby cells
      for (let r = Math.max(0, pos.row - 1); r <= Math.min(this.GRID_HEIGHT - 1, pos.row + 1); r++) {
        const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH
        for (let c = 0; c < maxCols; c++) {
          if (this.grid[r][c]) {
             const { x: bx, y: by } = this.getBubblePos(r, c)
             // Adjust by ceiling offset for collision check since bubble is in world space
             const worldBy = by + this.ceilingOffset
             const dist = Phaser.Math.Distance.Between(this.currentBubble.x, this.currentBubble.y, bx, worldBy)
             if (dist < this.BUBBLE_SIZE * 0.9) {
               this.snapBubbleToGrid()
               return
             }
          }
        }
      }
    }

    // Draw Trajectory
    this.drawTrajectory()
  }  getGridPos(x: number, y: number) {
    const row = Math.floor((y - this.ceilingOffset) / ((this.BUBBLE_SIZE * Math.sqrt(3)) / 2))
    const isOddRow = row % 2 === 1
    const colOffset = isOddRow ? this.BUBBLE_SIZE / 2 : 0
    const col = Math.floor((x - colOffset) / this.BUBBLE_SIZE)
    return {
      row: Math.max(0, Math.min(this.GRID_HEIGHT - 1, row)),
      col: Math.max(0, Math.min(isOddRow ? this.GRID_WIDTH - 2 : this.GRID_WIDTH - 1, col)) // Fix max col
    }
  }

  snapBubbleToGrid() {
    if (!this.currentBubble) return
    
    let pos = this.getGridPos(this.currentBubble.x, this.currentBubble.y)
    
    // Logic to find nearest empty spot if occupied or out of bounds
    if (!this.isValidPos(pos.row, pos.col) || this.grid[pos.row][pos.col]) {
       // Simple fallback: find nearest empty neighbor of collision point
       // For now, let's assume the collision logic stopped us "near" a spot.
       // We can refine this with the "findNearestEmptySpot" from original code if needed.
       // Implementing a simplified version:
       pos = this.findNearestEmptySpot(this.currentBubble.x, this.currentBubble.y) || pos
    }

    if (this.isValidPos(pos.row, pos.col)) {
      this.grid[pos.row][pos.col] = this.currentBubble.color
      this.createBubbleSprite(pos.row, pos.col, this.currentBubble.color)
      
      // Handle Skills (Bomb, etc) - simplified for now
      if (this.currentBubble.isBomb) {
        // Bomb logic
      } else if (this.currentBubble.isSpecial) {
        // Color blast logic
      } else {
        this.checkAndRemoveMatches(pos.row, pos.col)
      }
    }

    if (this.currentBubble.sprite) {
      this.currentBubble.sprite.destroy()
    }
    this.currentBubble = null

    // Check Ceiling Drop
    if (this.shotCount >= GameSettings.gameplay.baseShotsPerCeilingDrop) {
      this.lowerCeiling()
      this.shotCount = 0
    }

    // Check Game Over
    this.checkGameOver()

    if (!this.gameOver) {
      this.spawnBubble()
    }
  }

  findNearestEmptySpot(x: number, y: number) {
    // Simplified: Check grid cells around the point
    const candidates = []
    const gridY = y - this.ceilingOffset
    
    const centerRow = Math.floor(gridY / ((this.BUBBLE_SIZE * Math.sqrt(3)) / 2))
    
    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      if (r < 0 || r >= this.GRID_HEIGHT) continue
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH
      for (let c = 0; c < maxCols; c++) {
        if (!this.grid[r][c]) {
           const { x: bx, y: by } = this.getBubblePos(r, c)
           const dist = Phaser.Math.Distance.Between(x, gridY, bx, by)
           candidates.push({ r, c, dist })
        }
      }
    }
    candidates.sort((a, b) => a.dist - b.dist)
    if (candidates.length > 0) return { row: candidates[0].r, col: candidates[0].c }
    return null
  }

  isValidPos(row: number, col: number) {
    if (row < 0 || row >= this.GRID_HEIGHT) return false
    const maxCols = row % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH
    return col >= 0 && col < maxCols
  }

  checkAndRemoveMatches(row: number, col: number) {
    const color = this.grid[row][col]
    if (!color) return

    const matches = this.getMatches(row, col, color)
    if (matches.length >= 3) {
      matches.forEach(({ r, c }) => {
        this.grid[r][c] = null
        if (this.bubbleSprites[r][c]) {
          this.bubbleSprites[r][c]!.destroy()
          this.bubbleSprites[r][c] = null
        }
        // Particles here
      })
      this.removeFloatingBubbles()
      this.score += matches.length * 10
      this.updateUI()
    }
  }

  getMatches(row: number, col: number, color: string) {
    const matches: { r: number, c: number }[] = []
    const visited = new Set<string>()
    const queue = [{ r: row, c: col }]
    
    while (queue.length > 0) {
      const { r, c } = queue.pop()!
      const key = `${r},${c}`
      if (visited.has(key)) continue
      visited.add(key)
      
      if (this.grid[r][c] === color) {
        matches.push({ r, c })
        const neighbors = this.getNeighbors(r, c)
        neighbors.forEach(n => {
          if (this.grid[n.r] && this.grid[n.r][n.c] === color) {
            queue.push(n)
          }
        })
      }
    }
    return matches
  }

  getNeighbors(row: number, col: number) {
    const isOdd = row % 2 === 1
    const offsets = [
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
      { r: row - 1, c: isOdd ? col + 1 : col - 1 },
      { r: row + 1, c: isOdd ? col + 1 : col - 1 }
    ]
    return offsets.filter(n => this.isValidPos(n.r, n.c))
  }

  removeFloatingBubbles() {
    const connected = new Set<string>()
    const queue = []
    
    // Start from top row
    for (let c = 0; c < this.GRID_WIDTH; c++) {
      if (this.grid[0][c]) {
        queue.push({ r: 0, c })
      }
    }

    while (queue.length > 0) {
      const { r, c } = queue.pop()!
      const key = `${r},${c}`
      if (connected.has(key)) continue
      connected.add(key)
      
      const neighbors = this.getNeighbors(r, c)
      neighbors.forEach(n => {
        if (this.grid[n.r][n.c]) {
          queue.push(n)
        }
      })
    }

    // Remove unconnected
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c] && !connected.has(`${r},${c}`)) {
          this.grid[r][c] = null
          if (this.bubbleSprites[r][c]) {
            this.bubbleSprites[r][c]!.destroy()
            this.bubbleSprites[r][c] = null
          }
          // Particles
          this.score += 20
        }
      }
    }
  }

  lowerCeiling() {
    this.ceilingOffset += (this.BUBBLE_SIZE * Math.sqrt(3)) / 2
  }

  checkGameOver() {
    for (let r = 0; r < this.GRID_HEIGHT; r++) {
      const maxCols = r % 2 === 1 ? this.GRID_WIDTH - 1 : this.GRID_WIDTH
      for (let c = 0; c < maxCols; c++) {
        if (this.grid[r][c]) {
          const { y } = this.getBubblePos(r, c)
          if (y + this.ceilingOffset > this.LIMIT_LINE_Y) {
            this.gameOver = true
            this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, "GAME OVER", {
              fontSize: "64px",
              color: "#ff0000",
              fontFamily: "Pixelify Sans"
            }).setOrigin(0.5)
            this.input.on("pointerdown", () => this.scene.start("StartScene"))
          }
        }
      }
    }
  }

  activateAbility() {
    if (!this.abilityAvailable || !this.currentBubble) return
    
    if (this.selectedCharacter.id === "Pinky") {
      this.currentBubble.color = "#FF6600"
      this.currentBubble.isSpecial = true
      if (this.currentBubble.sprite instanceof Phaser.GameObjects.Arc) {
         this.currentBubble.sprite.setFillStyle(Phaser.Display.Color.HexStringToColor("#FF6600").color)
      }
    } else if (this.selectedCharacter.id === "Bluey") {
      this.currentBubble.color = "#000000"
      this.currentBubble.isBomb = true
      if (this.currentBubble.sprite instanceof Phaser.GameObjects.Arc) {
         this.currentBubble.sprite.setFillStyle(0x000000)
      }
    } else if (this.selectedCharacter.id === "Whitey") {
      this.whiteyWildShotsLeft = 3
      this.currentBubble.isWild = true
      this.currentBubble.color = "#FFFFFF"
      if (this.currentBubble.sprite instanceof Phaser.GameObjects.Arc) {
         this.currentBubble.sprite.setFillStyle(0xffffff)
      }
    }
    
    this.abilityAvailable = false
    this.skillBtn.setAlpha(0.5)
  }

  updateUI() {
    this.scoreText.setText(`Score: ${this.score}`)
    this.levelText.setText(`Level: ${this.level}`)
    
    this.nextBubblePreviews.forEach((preview, idx) => {
      if (this.nextBubbles[idx]) {
        preview.setFillStyle(Phaser.Display.Color.HexStringToColor(this.nextBubbles[idx]).color)
      }
    })
  }

  drawTrajectory() {
    this.trajectoryGraphics.clear()
    if (!this.currentBubble || this.currentBubble.moving) return
    
    this.trajectoryGraphics.lineStyle(2, 0xffffff, 0.5)
    
    const startX = this.currentBubble.x
    const startY = this.currentBubble.y
    const endX = startX + Math.cos(this.launcherAngle) * 1000
    const endY = startY - Math.sin(this.launcherAngle) * 1000
    
    this.trajectoryGraphics.lineBetween(startX, startY, endX, endY)
  }
}
