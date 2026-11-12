# Generación del PDF de la bitácora

Este directorio contiene el script que convierte `docs/bitacora.md` en `docs/bitacora.pdf`.

## Requisitos

- Node.js 20 o superior.
- Google Chrome instalado. Si está en otra ruta, definir `CHROME_PATH`:

```powershell
$env:CHROME_PATH = "C:\ruta\a\chrome.exe"
```

## Uso

```powershell
cd docs/build
npm install          # solo la primera vez
node build.mjs       # o: npm run build
```

Salidas:

| Archivo | Descripción |
|---|---|
| `docs/bitacora.pdf` | Documento final A4, con portada, índice numerado, encabezados y pies de página. |
| `docs/bitacora.html` | HTML intermedio (se puede abrir en el navegador). |
| `docs/build/preview/pagina-NNN.png` | Captura de cada página, útil para revisar el diseño. |

## Qué editar

- **Contenido:** `docs/bitacora.md`. El PDF se regenera desde ahí.
- **Portada:** constantes `TITLE`, `SUBTITLE` y `VERSION` al inicio de `build.mjs`; los datos institucionales salen de la tabla inicial del Markdown.
- **Estilos:** constante `CSS` en `build.mjs` (colores, tipografías, márgenes y encabezados).

## Cómo está armado

1. Un parser mínimo de Markdown (encabezados, tablas, listas, citas, código y formato en línea) genera el HTML.
2. [Paged.js](https://pagedjs.org/) paginado en A4: aplica los saltos de página, los encabezados y la numeración.
3. Puppeteer imprime el PDF con Chrome e incluye marcadores de navegación (`outline`) y texto accesible.

El índice se numera después de paginar, buscando en qué página quedó cada título, por lo que los números siempre coinciden con el PDF final.

## Notas

- `node_modules/`, `preview/` y `docs/bitacora.html` están ignorados por Git.
- Si se agregan o quitan secciones, no hace falta tocar el script: el índice se genera solo.
- Para una entrega, revisar que no queden campos `[completar]` y ajustar las horas estimadas.
