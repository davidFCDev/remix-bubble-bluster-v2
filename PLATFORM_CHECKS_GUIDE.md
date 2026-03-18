# Guía de Checks de la Plataforma Remix/Astrocade

Referencia rápida para pasar la validación al subir un juego a la plataforma.

---

## 1. Recursos Externos Permitidos

### CDNs aprobados

| CDN                                                 | Uso permitido                                              |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `cdn.jsdelivr.net`                                  | Solo para: **Phaser**, Three.js, Pixi, Babylon, PlayCanvas |
| `cdnjs.cloudflare.com/ajax/libs`                    | Librerías públicas                                         |
| `fonts.googleapis.com` / `fonts.gstatic.com`        | Google Fonts (fuentes)                                     |
| `remix.gg`                                          | Assets del juego (imágenes, audio, sprites)                |
| `vercel-storage` / `public.blob.vercel-storage.com` | Assets del juego                                           |

### CDNs NO permitidos

- ❌ `ajax.googleapis.com` — incluso para WebFont loader
- ❌ `unpkg.com`
- ❌ Cualquier CDN de wallet/crypto (ethers, web3, wagmi, etc.)
- ❌ Cualquier dominio no listado arriba

### Ejemplo correcto de fuentes

```html
<!-- ✅ Correcto: Google Fonts via <link> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Tu+Fuente&display=swap"
  rel="stylesheet"
/>
```

```javascript
// ❌ Incorrecto: WebFont loader desde ajax.googleapis.com
this.load.script(
  "webfont",
  "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js",
);
```

---

## 2. APIs del Navegador Prohibidas

El validador marca como "unsafe runtime behavior" cualquier acceso a APIs sensibles:

| API                         | Estado       | Alternativa                         |
| --------------------------- | ------------ | ----------------------------------- |
| `localStorage`              | ❌ Prohibido | Usar variables estáticas en memoria |
| `sessionStorage`            | ❌ Prohibido | Usar variables estáticas en memoria |
| `document.cookie`           | ❌ Prohibido | No usar                             |
| `indexedDB`                 | ❌ Prohibido | No usar                             |
| `window.open()`             | ❌ Prohibido | No usar                             |
| `eval()` / `new Function()` | ❌ Prohibido | No usar                             |
| `window.ethereum`           | ❌ Prohibido | No usar                             |
| `navigator.clipboard`       | ⚠️ Revisar   | Evitar si no es necesario           |

### Ejemplo: Reemplazar localStorage

```typescript
// ❌ Antes: persistencia con localStorage
private loadState() {
  const saved = localStorage.getItem("gameState");
  if (saved) this.state = JSON.parse(saved);
}

// ✅ Después: solo memoria (se pierde al recargar, pero pasa validación)
private static state = new Set<string>();
private loadState() {
  // Estado ya vive en la variable estática de la clase
}
```

---

## 3. Blockchain / Wallet / Crypto

El validador busca cualquier referencia a:

- `MetaMask`, `WalletConnect`, `Web3`
- `ethereum`, `ethers`, `wagmi`
- `wallet`, `blockchain`, `crypto` (en contexto de blockchain)
- Direcciones `0x...` de contratos

### Cuidado con dependencias indirectas

Algunas librerías pueden incluir código de wallet/crypto internamente. Si usas `@insidethesim/remix-dev`:

```typescript
// ❌ initRemix() inyecta código FarcadeSDK que contiene referencias blockchain
import { initRemix } from "@insidethesim/remix-dev";
initRemix(game, { multiplayer: false });

// ✅ Quitar initRemix y usar RemixSDK directamente via CDN
// El SDK se carga desde index.html:
// <script src="https://cdn.jsdelivr.net/npm/@remix-gg/sdk@latest/dist/index.min.js"></script>
```

**Consejo:** Después de hacer build, busca en `dist/index.html` con regex:

```
FarcadeSDK|MetaMask|WalletConnect|Web3|ethereum|ethers|wallet|localStorage
```

---

## 4. SDK de Remix — Uso Correcto

### Cargar via CDN en index.html

```html
<script src="https://cdn.jsdelivr.net/npm/@remix-gg/sdk@latest/dist/index.min.js"></script>
```

### Declarar tipos en globals.d.ts

```typescript
interface RemixSDKInstance {
  singlePlayer: {
    actions: {
      gameOver: (data: { score: number }) => void;
    };
  };
  hapticFeedback: () => void;
  onPlayAgain: (callback: () => void) => void;
  onToggleMute: (callback: (data: { isMuted: boolean }) => void) => void;
  hasItem: (itemName: string) => Promise<boolean>;
  purchaseItem: (itemName: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    RemixSDK?: RemixSDKInstance;
  }
}
```

### Eventos requeridos

```typescript
// Game Over — OBLIGATORIO
window.RemixSDK?.singlePlayer.actions.gameOver({ score: this.score });

// Play Again — OBLIGATORIO
window.RemixSDK?.onPlayAgain(() => {
  game.scene.getScenes(true)[0]?.scene.start("TuEscenaInicial");
});

// Toggle Mute — OBLIGATORIO
window.RemixSDK?.onToggleMute((data) => {
  game.sound.mute = data.isMuted;
});

// Haptic Feedback — OPCIONAL pero recomendado
window.RemixSDK?.hapticFeedback();

// In-App Purchases — OPCIONAL
const owned = await window.RemixSDK?.hasItem("item-id");
const result = await window.RemixSDK?.purchaseItem("item-id");
```

---

## 5. Checklist Pre-Upload

Antes de subir el dist, verificar:

- [ ] **Build limpio:** `npm run build` sin errores
- [ ] **Sin FarcadeSDK** en dist: `grep -i "FarcadeSDK" dist/index.html`
- [ ] **Sin localStorage** en dist: `grep -i "localStorage" dist/index.html`
- [ ] **Sin ajax.googleapis** en dist: `grep -i "ajax.googleapis" dist/index.html`
- [ ] **Sin wallet/crypto** en dist: `grep -iE "MetaMask|WalletConnect|Web3|ethereum|ethers" dist/index.html`
- [ ] **Solo CDNs aprobados** en `<script>` y `<link>` del HTML
- [ ] **gameOver()** se llama al perder
- [ ] **onPlayAgain()** reinicia el juego
- [ ] **onToggleMute()** silencia/activa audio
- [ ] **Assets** servidos desde `remix.gg` o `vercel-storage`

### Comando rápido de verificación (PowerShell)

```powershell
Select-String -Path dist/index.html -Pattern "FarcadeSDK|localStorage|sessionStorage|ajax\.googleapis|MetaMask|WalletConnect|Web3|window\.ethereum|eval\(|document\.cookie" -AllMatches
```

Si no devuelve resultados, estás listo para subir.

---

## 6. Errores Comunes y Soluciones

| Error del validador                                  | Causa                            | Solución                                     |
| ---------------------------------------------------- | -------------------------------- | -------------------------------------------- |
| "Remove all MetaMask, WalletConnect, Web3..."        | `initRemix()` inyecta FarcadeSDK | Eliminar import de `@insidethesim/remix-dev` |
| "Unapproved external resources: ajax.googleapis.com" | WebFont loader                   | Usar Google Fonts via `<link>` en HTML       |
| "Remove unsafe runtime behavior..."                  | `localStorage` u otras APIs      | Reemplazar con variables en memoria          |
| "Sensitive browser or wallet APIs"                   | `window.ethereum`, cookies, etc. | Eliminar todo acceso a esas APIs             |
