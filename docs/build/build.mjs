/**
 * Genera docs/bitacora.pdf a partir de docs/bitacora.md.
 *
 * Uso:
 *   cd docs/build
 *   node build.mjs
 *
 * Requiere Chrome instalado (se puede indicar otra ruta con CHROME_PATH).
 * El PDF se arma con Paged.js (paginado, encabezados y numeración) y se
 * imprime con Puppeteer. También deja capturas de cada página en docs/build/preview/.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const MD_PATH = path.join(ROOT, "docs", "bitacora.md");
const HTML_PATH = path.join(ROOT, "docs", "bitacora.html");
const PDF_PATH = path.join(ROOT, "docs", "bitacora.pdf");
const PREVIEW_DIR = path.join(__dirname, "preview");
const PAGED_JS = path.join(__dirname, "node_modules", "pagedjs", "dist", "paged.polyfill.js");
const CHROME_PATH =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const TITLE = "Sistema de Gestión Logística y Control de Fletes de Caña de Azúcar";
const SUBTITLE = "Bitácora de trabajo";
const VERSION = "1.0";

/* ------------------------------------------------------------------ */
/* Markdown mínimo                                                     */
/* ------------------------------------------------------------------ */

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text) {
  const codes = [];
  let s = escapeHtml(text);

  s = s.replace(/`([^`]+)`/g, (_match, code) => {
    codes.push(code);
    return `\u0000C${codes.length - 1}\u0000`;
  });

  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  s = s.replace(/\u0000C(\d+)\u0000/g, (_match, index) => `<code>${codes[Number(index)]}</code>`);
  return s;
}

const usedIds = new Map();
function slugify(text) {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  const count = usedIds.get(base) ?? 0;
  usedIds.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function isTableSeparator(line) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(trimmed);
}

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);
  return row.split("|").map((cell) => cell.trim());
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const code = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2].trim(),
      });
      i += 1;
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((cell) => {
        const trimmed = cell.trim();
        if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
        if (trimmed.endsWith(":")) return "right";
        return "left";
      });
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", headers, aligns, rows });
      continue;
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        const item = lines[i].match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
        if (!item) break;
        items.push({
          ordered: /\d/.test(item[1]),
          text: item[2].trim(),
        });
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !/^\s*---+\s*$/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  for (const block of blocks) {
    if (block.type === "heading") block.id = slugify(block.text);
  }

  return blocks;
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

function renderTaskItem(text) {
  const match = text.match(/^\[([ xX])\]\s+(.*)$/);
  if (!match) return null;
  return { checked: match[1].toLowerCase() === "x", text: match[2] };
}

function renderBlocks(blocks) {
  const html = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const tag = `h${Math.min(block.level, 6)}`;
        html.push(`<${tag} id="${block.id}">${inline(block.text)}</${tag}>`);
        break;
      }
      case "paragraph":
        html.push(`<p>${inline(block.text)}</p>`);
        break;
      case "quote":
        html.push(`<blockquote class="note"><p>${inline(block.text)}</p></blockquote>`);
        break;
      case "hr":
        html.push('<hr class="rule">');
        break;
      case "code":
        html.push(`<pre><code>${escapeHtml(block.text)}</code></pre>`);
        break;
      case "list": {
        const ordered = block.items.some((item) => item.ordered);
        const tag = ordered ? "ol" : "ul";
        html.push(`<${tag}>`);
        for (const item of block.items) {
          const task = renderTaskItem(item.text);
          if (task) {
            html.push(
              `<li class="task"><span class="box${task.checked ? " checked" : ""}"></span>${inline(task.text)}</li>`,
            );
          } else {
            html.push(`<li>${inline(item.text)}</li>`);
          }
        }
        html.push(`</${tag}>`);
        break;
      }
      case "table": {
        html.push('<table class="data">');
        html.push("<thead><tr>");
        block.headers.forEach((header, index) => {
          const align = block.aligns[index] ?? "left";
          html.push(`<th style="text-align:${align}">${inline(header)}</th>`);
        });
        html.push("</tr></thead><tbody>");
        for (const row of block.rows) {
          html.push("<tr>");
          row.forEach((cell, index) => {
            const align = block.aligns[index] ?? "left";
            html.push(`<td style="text-align:${align}">${inline(cell)}</td>`);
          });
          html.push("</tr>");
        }
        html.push("</tbody></table>");
        break;
      }
      default:
        break;
    }
  }

  return html.join("\n");
}

function renderToc(blocks) {
  const entries = blocks.filter(
    (block) =>
      block.type === "heading" &&
      (block.level === 2 || block.level === 3 || block.level === 4),
  );

  const items = entries
    .map(
      (entry) => `<li class="lvl-${entry.level}">
        <a href="#${entry.id}">
          <span class="t">${inline(entry.text)}</span>
          <span class="leader"></span>
          <span class="pg" data-target="${entry.id}"></span>
        </a>
      </li>`,
    )
    .join("\n");

  return `<nav class="toc-page">
    <h2 class="toc-title">Contenido</h2>
    <ol class="toc">${items}</ol>
  </nav>`;
}

/* ------------------------------------------------------------------ */
/* Extracción de portada y ficha                                       */
/* ------------------------------------------------------------------ */

function buildDocument(markdown) {
  const blocks = parseMarkdown(markdown);

  const firstHeading = blocks.find((block) => block.type === "heading" && block.level === 1);
  const subtitle = blocks.find((block) => block.type === "paragraph");
  const metaTable = blocks.find((block) => block.type === "table");
  const note = blocks.find((block) => block.type === "quote");

  const meta = new Map();
  if (metaTable) {
    for (const row of metaTable.rows) meta.set(row[0], row[1] ?? "");
  }

  const skip = new Set([firstHeading, subtitle, metaTable, note].filter(Boolean));
  const content = blocks.filter((block) => !skip.has(block));

  // El primer separador queda huérfano después de quitar la ficha.
  while (content[0] && (content[0].type === "hr")) content.shift();

  const metaRow = (label, value) => {
    const pending = /\[completar\]/.test(value);
    return `<tr><td class="k">${escapeHtml(label)}</td><td class="v${pending ? " pending" : ""}">${inline(value)}</td></tr>`;
  };

  const coverMeta = [
    ["Autor", meta.get("Autor") ?? "Maximiliano Rodríguez"],
    ["Tipo de trabajo", meta.get("Tipo de trabajo") ?? "Trabajo Final Integrador (TFI)"],
    ["Docente / tutor", meta.get("Docente / tutor") ?? "[completar]"],
    ["Cátedra", meta.get("Cátedra") ?? "[completar]"],
    ["Institución", meta.get("Institución") ?? "[completar]"],
    ["Período documentado", "06/09/2026 – 02/11/2026"],
    ["Última actualización", meta.get("Última actualización") ?? "02/11/2026"],
  ]
    .map(([label, value]) => metaRow(label, value))
    .join("\n");

  const cover = `<section class="cover">
    <div class="cover-band"></div>
    <div class="cover-inner">
      <div class="cover-kicker">Trabajo Final Integrador</div>
      <h1 class="cover-title">${escapeHtml(TITLE)}</h1>
      <div class="cover-subtitle">${escapeHtml(SUBTITLE)}</div>
      <div class="cover-rule"></div>
      <table class="cover-meta"><tbody>${coverMeta}</tbody></table>
    </div>
    <div class="cover-foot">
      <span>Documentación del proyecto · ${VERSION}</span>
      <span>Repositorio: logística agro</span>
    </div>
  </section>`;

  const noteHtml = note
    ? `<aside class="note"><p>${inline(note.text)}</p></aside>`
    : "";

  const body = `<main>${renderBlocks(content)}</main>`;

  return {
    blocks: content,
    html: `${cover}${renderToc(content).replace("</nav>", `${noteHtml}</nav>`)}${body}`,
  };
}

/* ------------------------------------------------------------------ */
/* Estilos de impresión                                                */
/* ------------------------------------------------------------------ */

const CSS = String.raw`
@page {
  size: A4;
  margin: 23mm 18mm 20mm;

  @top-left {
    content: "TFI · Gestión Logística de Caña de Azúcar";
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 7.4pt;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #7b8c80;
    vertical-align: bottom;
    padding-bottom: 3mm;
  }
  @top-right {
    content: "Bitácora de trabajo";
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 7.4pt;
    color: #7b8c80;
    vertical-align: bottom;
    padding-bottom: 3mm;
  }
  @bottom-left {
    content: "Maximiliano Rodríguez";
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 7.4pt;
    color: #7b8c80;
    vertical-align: top;
    padding-top: 3mm;
  }
  @bottom-right {
    content: "Página " counter(page) " de " counter(pages);
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 7.4pt;
    color: #7b8c80;
    vertical-align: top;
    padding-top: 3mm;
  }
}

@page cover {
  margin: 0;
  @top-left { content: ""; }
  @top-right { content: ""; }
  @bottom-left { content: ""; }
  @bottom-right { content: ""; }
}

@page :first {
  @top-left { content: ""; }
  @top-right { content: ""; }
  @bottom-left { content: ""; }
  @bottom-right { content: ""; }
}

html {
  font-size: 10.4pt;
}

body {
  margin: 0;
  font-family: Cambria, Georgia, "Times New Roman", serif;
  color: #1d2b22;
  line-height: 1.55;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  color: #1f3d2b;
  break-after: avoid;
  page-break-after: avoid;
}

h2 {
  font-size: 16.5pt;
  line-height: 1.2;
  margin: 0 0 11pt;
  padding-bottom: 5pt;
  border-bottom: 1.6pt solid #2e6b46;
  break-before: page;
  page-break-before: always;
}

h3 {
  font-size: 12.2pt;
  line-height: 1.3;
  color: #2e6b46;
  margin: 15pt 0 5pt;
}

h4 {
  font-size: 10.8pt;
  margin: 11pt 0 4pt;
}

p {
  margin: 0 0 6.5pt;
  text-align: justify;
  hyphens: auto;
  overflow-wrap: break-word;
}

p:has(+ ul), p:has(+ ol) {
  margin-bottom: 3pt;
}

strong {
  color: #17331f;
}

a {
  color: #2e6b46;
  text-decoration: none;
}

ul, ol {
  margin: 2pt 0 8pt;
  padding-left: 15pt;
}

li {
  margin: 0 0 2.5pt;
  padding-left: 1pt;
}

li.task {
  list-style: none;
  margin-left: -12pt;
}

li.task .box {
  display: inline-block;
  width: 8pt;
  height: 8pt;
  border: 0.8pt solid #63796b;
  border-radius: 1.5pt;
  margin-right: 5pt;
  vertical-align: -0.6pt;
}

li.task .box.checked {
  background: #2e6b46;
  border-color: #2e6b46;
}

table.data {
  width: 100%;
  border-collapse: collapse;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 8.4pt;
  line-height: 1.36;
  margin: 6pt 0 11pt;
}

table.data thead {
  display: table-header-group;
}

table.data th {
  background: #2e6b46;
  color: #ffffff;
  font-weight: 600;
  text-align: left;
  padding: 4.2pt 5pt;
  border: 0.6pt solid #2e6b46;
}

table.data td {
  padding: 3.6pt 5pt;
  border: 0.5pt solid #cfdcd3;
  vertical-align: top;
}

table.data tbody tr:nth-child(even) td {
  background: #f4f8f5;
}

table.data tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

blockquote.note,
aside.note {
  margin: 8pt 0 10pt;
  padding: 8pt 10pt;
  background: #edf5ef;
  border-left: 3pt solid #2e6b46;
  font-size: 9.2pt;
  line-height: 1.5;
  break-inside: avoid;
}

aside.note {
  margin-top: 16pt;
}

aside.note p {
  margin: 0;
  text-align: left;
}

pre {
  margin: 6pt 0 10pt;
  padding: 8pt 10pt;
  background: #f5f8f6;
  border: 0.5pt solid #d7e2da;
  border-radius: 3pt;
  font-family: Consolas, "Cascadia Mono", monospace;
  font-size: 8.1pt;
  line-height: 1.45;
  white-space: pre-wrap;
  break-inside: avoid;
}

pre code {
  background: none;
  padding: 0;
  font-size: inherit;
}

code {
  font-family: Consolas, "Cascadia Mono", monospace;
  font-size: 8.7pt;
  background: #eef3ef;
  padding: 0 2pt;
  border-radius: 2pt;
}

hr.rule {
  border: none;
  border-top: 0.6pt solid #dbe5de;
  margin: 12pt 0;
}

/* ---------------------------- Portada ---------------------------- */

.cover {
  page: cover;
  position: relative;
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  break-after: page;
  page-break-after: always;
}

.cover-band {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 16mm;
  background: #2e6b46;
}

.cover-band::after {
  content: "";
  position: absolute;
  top: 16mm;
  left: 0;
  width: 44mm;
  height: 2.4mm;
  background: #b7791f;
}

.cover-inner {
  position: absolute;
  top: 58mm;
  left: 24mm;
  right: 24mm;
}

.cover-kicker {
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 8.6pt;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #2e6b46;
}

.cover-title {
  margin: 5mm 0 0;
  max-width: 155mm;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 27pt;
  line-height: 1.14;
  color: #16321f;
}

.cover-subtitle {
  margin-top: 5mm;
  font-family: Cambria, Georgia, serif;
  font-size: 16pt;
  color: #4a5f52;
}

.cover-rule {
  width: 38mm;
  height: 2.6pt;
  margin: 8mm 0 2mm;
  background: #b7791f;
}

table.cover-meta {
  width: 158mm;
  margin-top: 2mm;
  border-collapse: collapse;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 9.3pt;
}

table.cover-meta td {
  padding: 3.1mm 0;
  border: none;
  border-bottom: 0.4pt solid #dfe8e2;
  background: none;
}

table.cover-meta td.k {
  width: 43mm;
  font-size: 7.9pt;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #6d8073;
}

table.cover-meta td.v {
  color: #1d2b22;
}

table.cover-meta td.v.pending {
  color: #8a6a2a;
  font-style: italic;
}

.cover-foot {
  position: absolute;
  left: 24mm;
  right: 24mm;
  bottom: 16mm;
  display: flex;
  justify-content: space-between;
  padding-top: 3mm;
  border-top: 0.5pt solid #dfe8e2;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 7.8pt;
  color: #7b8c80;
}

/* ------------------------------ Índice --------------------------- */

.toc-page {
  page-break-after: auto;
}

h2.toc-title {
  break-before: auto;
  page-break-before: auto;
  font-size: 19pt;
  margin-bottom: 9pt;
}

ol.toc {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 9.7pt;
}

ol.toc li {
  margin: 0;
  padding: 1.9pt 0;
}

ol.toc li.lvl-3 {
  padding-left: 13pt;
  font-size: 8.9pt;
  color: #3d5145;
}

ol.toc li.lvl-4 {
  padding-left: 26pt;
  font-size: 8.6pt;
  color: #52675b;
}

ol.toc a {
  display: flex;
  align-items: baseline;
  gap: 4pt;
  color: inherit;
}

ol.toc .leader {
  flex: 1;
  margin: 0 4pt;
  border-bottom: 0.5pt dotted #9fb3a6;
  transform: translateY(-2.5pt);
}

ol.toc .pg {
  min-width: 2.2em;
  text-align: right;
  color: #4a5f52;
  font-variant-numeric: tabular-nums;
}
`;

/* ------------------------------------------------------------------ */
/* Impresión                                                           */
/* ------------------------------------------------------------------ */

function buildHtml(documentHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bitácora de trabajo — TFI</title>
  <meta name="author" content="Maximiliano Rodríguez" />
  <meta name="description" content="Bitácora de trabajo del Trabajo Final Integrador: Sistema de Gestión Logística y Control de Fletes de Caña de Azúcar." />
  <style>${CSS}</style>
</head>
<body>
${documentHtml}
<script>
  window.PagedConfig = { auto: false };
</script>
<script src="${pathToFileURL(PAGED_JS).href}"></script>
<script>
  window.__pagedDone = false;
  window.PagedPolyfill.preview()
    .then(function () {
      // Numeración del índice según la página real de cada título.
      var pageOf = new Map();
      document.querySelectorAll(".pagedjs_page [id]").forEach(function (element) {
        var pageElement = element.closest(".pagedjs_page");
        if (pageElement && !pageOf.has(element.id)) {
          pageOf.set(element.id, pageElement.getAttribute("data-page-number"));
        }
      });
      document.querySelectorAll(".pg[data-target]").forEach(function (span) {
        var number = pageOf.get(span.dataset.target) || "";
        span.textContent = number || "—";
      });
      window.__pagedDone = true;
    })
    .catch(function (error) { window.__pagedError = String(error); });
</script>
</body>
</html>`;
}

async function main() {
  const markdown = fs.readFileSync(MD_PATH, "utf8");
  const { html } = buildDocument(markdown);

  fs.writeFileSync(HTML_PATH, buildHtml(html), "utf8");
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--allow-file-access-from-files", "--no-sandbox", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(180000);
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.6 });
    await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction("window.__pagedDone === true || window.__pagedError", {
      timeout: 180000,
    });

    const pagedError = await page.evaluate(() => window.__pagedError);
    if (pagedError) throw new Error(`Paged.js: ${pagedError}`);

    // El propio HTML numera el índice al terminar de paginar.
    const tocInfo = await page.evaluate(() => {
      const numbered = [...document.querySelectorAll(".pg[data-target]")].filter(
        (span) => span.textContent.trim() && span.textContent.trim() !== "—",
      ).length;
      return { entries: numbered, pages: document.querySelectorAll(".pagedjs_page").length };
    });

    await page.pdf({
      path: PDF_PATH,
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true,
    });

    // Capturas por página para control visual.
    for (const file of fs.readdirSync(PREVIEW_DIR)) {
      if (file.endsWith(".png")) fs.unlinkSync(path.join(PREVIEW_DIR, file));
    }
    const pageElements = await page.$$(".pagedjs_page");
    for (let index = 0; index < pageElements.length; index += 1) {
      const number = String(index + 1).padStart(3, "0");
      await pageElements[index].screenshot({
        path: path.join(PREVIEW_DIR, `pagina-${number}.png`),
      });
    }

    const stats = fs.statSync(PDF_PATH);
    console.log(`PDF generado: ${PDF_PATH}`);
    console.log(`Páginas: ${tocInfo.pages} · Entradas de índice numeradas: ${tocInfo.entries}`);
    console.log(`Tamaño: ${(stats.size / 1024).toFixed(0)} KB`);
    console.log(`Capturas: ${PREVIEW_DIR}`);
  } finally {
    await browser.close();
  }
}

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntryPoint) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { parseMarkdown, buildDocument };
