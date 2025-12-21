# PreloadSceneBase Template

Este archivo `src/scenes/PreloadSceneBase.ts` sirve como plantilla base para la escena de precarga en futuros proyectos. Incluye la lógica estándar del sprite de carga animado.

## Cómo usarlo en un nuevo proyecto

1.  **Copiar el archivo**: Copia `src/scenes/PreloadSceneBase.ts` a la carpeta de escenas de tu nuevo proyecto.
2.  **Crear tu PreloadScene**: Crea una nueva clase que extienda de `PreloadSceneBase`.
3.  **Implementar `loadProjectAssets`**: Define aquí la carga de tus imágenes, audios, etc.

### Ejemplo de implementación

```typescript
import { PreloadSceneBase } from "./PreloadSceneBase";

export class PreloadScene extends PreloadSceneBase {
  constructor() {
    // Llama al super con la key de esta escena y la key de la siguiente escena (ej. "StartScene")
    super("PreloadScene", "StartScene");
  }

  protected loadProjectAssets(): void {
    // Carga tus assets aquí
    this.load.image("background", "assets/bg.png");
    this.load.audio("music", "assets/music.mp3");
    
    // WebFont si es necesario
    this.load.script("webfont", "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js");
  }

  // Opcional: Ejecutar código cuando la carga termina (ej. filtros de pixel art)
  protected onAssetsLoaded(): void {
    const texture = this.textures.get("background");
    if (texture) texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}
```

## Características incluidas

*   **Sprite de carga**: Carga y muestra automáticamente el sprite de "boot".
*   **Animación**: Configurada a 12fps, con el último frame durando 500ms extra.
*   **Transición**: Espera automáticamente a que terminen AMBOS: la animación y la carga de assets.
