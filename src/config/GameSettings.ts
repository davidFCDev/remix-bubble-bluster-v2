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
    levelTime: 120, // Seconds per level
  },
  characters: [
    {
      id: "Pinky",
      name: "Pinky",
      lore: "A rosy spark born in the Sugarwood heart.",
      skillDesc:
        "Color Blast: Orange shot that eliminates ALL bubbles of the target color from the entire field",
      hasSkill: true,
      spriteIdle:
        "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Pink_Monster_Idle_4-2uhv9rm8Zn7OwdWYW6kMCoVsNaHcLw.png?KFYP",
      spriteAttack:
        "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Pink_Monster_Attack1_4-omF6VS5k516cMBwIyH3Xl1NuiYHHAZ.png?UUBn",
    },
    {
      id: "Bluey",
      name: "Bluey",
      lore: "An azure explorer from the Floating Lakes.",
      skillDesc:
        "Bomb Shot: Black explosive that destroys ALL bubbles in a large 3-tile radius area",
      hasSkill: true,
      spriteIdle:
        "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Dude_Monster_Idle_4-jPYg5zpbFLOwN0t14GVorJ1DeNVGAM.png?sKQP",
      spriteAttack:
        "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Dude_Monster_Attack1_4-oMGRnm2hQIdEPhveDUgxnLTmOEAy2q.png?DAm4",
    },
    {
      id: "Whitey",
      name: "Whitey",
      lore: "A snowy guardian from the Clouded Peaks.",
      skillDesc:
        "Ice Lance: A piercing shot that destroys everything in a straight line. Does NOT bounce off walls.",
      hasSkill: true,
      spriteIdle:
        "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Owlet_Monster_Idle_4-2kKOi58HJNlpwUnj7rBlclsjnnWU4P.png?GA7n",
      spriteAttack:
        "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/Y58Z5vSLnB41/Owlet_Monster_Attack1_4-IPV3tIX6BdetCSKYUHviJxvMpBsD50.png?UTIu",
    },
    {
      id: "WitchKitty",
      name: "Witch Kitty",
      lore: "A mystical feline sorceress from the Enchanted Forest, casting spells with a flick of her tail!",
      skillDesc:
        "Hex Bubble: A cursed orb that transforms ALL bubbles of the touched color into random NEW colors!",
      hasSkill: true,
      spriteIdle:
        "https://remix.gg/blob/Y58Z5vSLnB41/kitty-Q0mEbFqtopjlLbhpBfKDhqZoiaAblk.webp?DbsX",
      spriteAttack:
        "https://remix.gg/blob/Y58Z5vSLnB41/kitty-Q0mEbFqtopjlLbhpBfKDhqZoiaAblk.webp?DbsX",
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 12,
        scale: 3, // 64x64 needs half scale compared to 32x32
      },
    },
  ],
  assets: {
    backgroundStart:
      "https://remix.gg/blob/Y58Z5vSLnB41/1-GwoHV7svfVDNgHPLjRtwGxOhuEWIvQ.webp?tIxK",
    backgroundsLevel: [
      "https://remix.gg/blob/Y58Z5vSLnB41/2-ZrWbnS0gBirDU8igxKrIRg8HSW5nT4.webp?c431",
      "https://remix.gg/blob/Y58Z5vSLnB41/4-MqWCBUO8fGx5reV4JQiU1eNqFNC8Qq.webp?Siz1",
      "https://remix.gg/blob/Y58Z5vSLnB41/3-pyq8sweSZ0mDTq3ML8DNjentkEBdRD.webp?Dm9p",
    ],
    loader:
      "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/zS0QCi0PfUjO/chuckytes2t-a9Hz89icXVQVgOkchS0ssNllYtJfiu.png?RB0F",
    music: [
      "https://remix.gg/blob/Y58Z5vSLnB41/Music1-fqorYP4dV0ea7Fn3PaMv6MnAY3fOBu.mp3?wh7P",
      "https://remix.gg/blob/Y58Z5vSLnB41/Music2-nfzSRk4KGrwIZJkebmXdSizbubXSJN.mp3?4yyI",
      "https://remix.gg/blob/Y58Z5vSLnB41/Music3-QBaMUSI9yutKOPkke24B5l6QDy4QsX.mp3?CFTD",
      "https://remix.gg/blob/Y58Z5vSLnB41/Music4-YpVGcgTNTTVqvAgBtw0XgAyWLJO6RS.mp3?WOuM",
    ],
    sfx: {
      pop: "https://remix.gg/blob/Y58Z5vSLnB41/pop-hZzRjL6dDiVol4H7UGr8PXqfQgptw2.mp3?VJDr",
      button:
        "https://remix.gg/blob/Y58Z5vSLnB41/button-P4BpyTVumUTlBwKU6HKjifmqXHyVDT.mp3?DKvz",
      skill:
        "https://remix.gg/blob/Y58Z5vSLnB41/skill-tXdETS9gksWtrAnbrxMUPME9FbNU8u.mp3?A634",
      level_complete:
        "https://remix.gg/blob/Y58Z5vSLnB41/success-AW3cXCtRKCkTE07nZXOFjdtjCoMHCh.mp3?uqct",
      // shoot: "path/to/shoot.mp3",
      // special_pinky: "path/to/pinky.mp3",
      // special_bluey: "path/to/bluey.mp3",
      // special_whitey: "path/to/whitey.mp3",
      // game_over: "path/to/game_over.mp3",
    },
  },
};

export default GameSettings;
