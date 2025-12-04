/**
 * Game Settings for bubble-bluster-v2
 * Centralized configuration for all tunable game parameters
 */

export const GameSettings = {
  canvas: {
    width: 720,
    height: 1080,
  },
  grid: {
    width: 8,
    height: 14,
    headerHeight: 50,
  },
  colors: {
    all: [
      "#FF0000", // Red
      "#00FF00", // Green
      "#0000FF", // Blue
      "#FFFF00", // Yellow
      "#FF00FF", // Magenta
    ],
    neonBlue: "#00ffcc",
  },
  gameplay: {
    baseScorePerLevel: 2000,
    maxTimeBonus: 8000,
    timeBonusDecrease: 50,
    baseShotsPerCeilingDrop: 10,
    speechBubbleDuration: 2000,
  },
  characters: [
    {
      id: "Pinky",
      name: "Pinky",
      lore: "A rosy spark born in the Sugarwood heart.\nLives to pop bubbles and light up the skies.",
      skillDesc: "Color Blast: Orange shot that eliminates ALL bubbles of the target color from the entire field",
      hasSkill: true,
      spriteIdle: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Pink_Monster_Idle_4-2uhv9rm8Zn7OwdWYW6kMCoVsNaHcLw.png?KFYP",
      spriteAttack: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Pink_Monster_Attack1_4-omF6VS5k516cMBwIyH3Xl1NuiYHHAZ.png?UUBn",
    },
    {
      id: "Bluey",
      name: "Bluey",
      lore: "An azure explorer from the Floating Lakes.\nCalm waves, precise pops.",
      skillDesc: "Bomb Shot: Black explosive that destroys ALL bubbles in a large 3-tile radius area",
      hasSkill: true,
      spriteIdle: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Dude_Monster_Idle_4-jPYg5zpbFLOwN0t14GVorJ1DeNVGAM.png?sKQP",
      spriteAttack: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Dude_Monster_Attack1_4-oMGRnm2hQIdEPhveDUgxnLTmOEAy2q.png?DAm4",
    },
    {
      id: "Whitey",
      name: "Whitey",
      lore: "A snowy guardian from the Clouded Peaks.\nSilent, sharp, a natural enemy of bubbles.",
      skillDesc: "Color Pick: 3 white shots that adapt to ANY color and eliminate connected groups (no 3-match limit)",
      hasSkill: true,
      spriteIdle: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Owlet_Monster_Idle_4-2kKOi58HJNlpwUnj7rBlclsjnnWU4P.png?GA7n",
      spriteAttack: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Owlet_Monster_Attack1_4-IPV3tIX6BdetCSKYUHviJxvMpBsD50.png?UTIu",
    },
  ],
  assets: {
    background: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/fondo-bubble-LrEejaB5Fy4xPW2TJzrN559v8akbG7.png?x6Ua",
    loader: "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/zS0QCi0PfUjO/chuckytes2t-a9Hz89icXVQVgOkchS0ssNllYtJfiu.png?RB0F",
    music: [
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/retro-game-music-245230-t3lDfWOigoA1V09Piz6TAELdlQ4wzd.mpeg?Kmyu",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/8-bit-retro-game-music-233964-05Qr3Rr4tLhisYkFeqlkWvc0H5R9dq.mpeg?UxMx",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/level-iii-294428-qud1YQbagnOWtA7TSUDINswBlf7Ii2.mpeg?NnTo",
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/retro-game-arcade-236133-cD0ddckxG003A916BaDw01qUsA2rdD.mpeg?ZAQ9",
    ]
  }
}

export default GameSettings
