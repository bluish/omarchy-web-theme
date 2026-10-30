// Paint WhatsApp Web and Discord with the current Omarchy theme colors.
// colors.json is rewritten by the theme-set hook; it is re-read every few
// seconds, so a theme change shows up live without reloading anything.
// Variable maps adapted from catppuccin/userstyles (WhatsApp) and
// catppuccin/discord (MIT).

const POLL_MS = 3000;
const STYLE_ID = "omarchy-webapps-theme";

// --- color helpers (Sass/Less semantics) -----------------------------------

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const rgbToHex = (rgb) =>
  "#" + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");

const rgbToHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
};
const hslToRgb = ([h, s, l]) => {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
};

const shiftLightness = (hex, amount) => {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([h, s, Math.min(1, Math.max(0, l + amount / 100))]));
};
const lighten = (hex, pct) => shiftLightness(hex, pct);
const darken = (hex, pct) => shiftLightness(hex, -pct);
// mix(a, b, w): w% of a, rest b (Sass/Less order)
const mix = (a, b, w) => {
  const [ra, rb] = [hexToRgb(a), hexToRgb(b)];
  return rgbToHex(ra.map((v, i) => v * (w / 100) + rb[i] * (1 - w / 100)));
};
const alpha = (hex, a) => `rgba(${hexToRgb(hex).join(", ")}, ${+a.toFixed(3)})`;
const fade = (hex, pct) => alpha(hex, pct / 100);
const rgbify = (color) => {
  const m = color.match(/rgba?\(([^)]+)\)/);
  return m ? m[1].split(",").slice(0, 3).map((v) => v.trim()).join(", ") : hexToRgb(color).join(", ");
};

// --- Omarchy colors.toml -> Catppuccin-style roles --------------------------

// WCAG contrast ratio between two hex colors
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (la + 0.05) / (lb + 0.05);
};

const palette = (o) => {
  const bg = o.background, fg = o.foreground;
  const lighter = o.lighter_background && o.lighter_background.toLowerCase() !== bg.toLowerCase()
    ? o.lighter_background : mix(fg, bg, 8);
  // Some themes set dark_foreground to their muted gray; for secondary text
  // keep it only when it stays readable on the background.
  const secondary = o.dark_foreground && contrast(o.dark_foreground, bg) >= 4.5
    ? o.dark_foreground : mix(fg, bg, 65);
  const c = {
    crust: o.darker_background || darken(bg, 4),
    mantle: o.dark_background || darken(bg, 2),
    base: bg,
    surface0: lighter,
    surface1: mix(fg, bg, 14),
    surface2: mix(fg, bg, 20),
    overlay0: o.muted || mix(fg, bg, 40),
    overlay1: mix(fg, o.muted || bg, 30),
    overlay2: secondary,
    subtext0: secondary,
    subtext1: mix(fg, secondary, 50),
    text: fg,
    red: o.red, green: o.green, yellow: o.yellow, blue: o.blue,
    peach: o.orange || o.yellow,
    pink: o.bright_magenta || o.magenta,
    mauve: o.magenta,
    teal: o.cyan, sky: o.bright_cyan || o.cyan, sapphire: o.cyan,
    lavender: o.bright_blue || o.blue,
    rosewater: o.bright_red || o.red,
  };
  c.accent = c.brand = o.accent || o.blue;
  c.dark = (o.mode || "dark") !== "light";
  return c;
};

// --- WhatsApp Web -------------------------------------------------------------

const whatsappCss = (c) => {
  const out = [];
  const wds = (id, color) => out.push(`--WDS-${id}: ${color}`, `--WDS-${id}-RGB: ${rgbify(color)}`, `--WDS-${id}-rgb: ${rgbify(color)}`);
  const rgb = (id, color) => out.push(`--${id}: ${color}`, `--${id}-rgb: ${rgbify(color)}`);
  const accentContent = c.dark ? c.crust : c.base;
  const deemp = c.dark ? 30 : 15;

  wds("accent", c.accent);
  wds("accent-deemphasized", fade(c.accent, deemp));
  wds("accent-emphasized", lighten(c.accent, 10));
  wds("secondary-negative", c.red);
  wds("secondary-negative-deemphasized", fade(c.red, deemp));
  wds("secondary-negative-emphasized", c.red);
  wds("secondary-positive", c.green);
  wds("secondary-positive-deemphasized", fade(c.green, deemp));
  wds("secondary-warning", c.yellow);
  wds("secondary-warning-deemphasized", fade(c.yellow, deemp));
  wds("content-default", c.text);
  wds("content-deemphasized", c.overlay2);
  wds("content-disabled", fade(c.text, 50));
  wds("content-on-accent", accentContent);
  wds("content-action-default", c.accent);
  wds("content-action-emphasized", lighten(c.accent, 10));
  wds("content-external-link", c.blue);
  wds("content-inverse", c.crust);
  wds("content-read", c.blue);
  wds("background-wash-inset", c.crust);
  wds("background-wash-plain", c.crust);
  wds("background-elevated-wash-plain", c.crust);
  wds("background-elevated-wash-inset", c.crust);
  wds("background-dimmer", fade("#000000", 30));
  wds("modal-backdrop-solid", c.crust);
  wds("surface-default", c.mantle);
  out.push("--background-default: var(--WDS-surface-default)", "--search-container-background: var(--WDS-surface-default)");
  wds("surface-emphasized", c.base);
  wds("surface-elevated-default", c.base);
  wds("surface-elevated-emphasized", mix(c.text, c.base, 10));
  wds("surface-highlight", fade(c.text, 20));
  wds("surface-inverse", c.text);
  wds("surface-pressed", fade(c.text, 20));
  wds("lines-divider", fade(c.text, 10));
  wds("lines-outline-default", c.overlay0);
  wds("lines-outline-deemphasized", fade(c.text, deemp));
  wds("persistent-activity-indicator", fade(c.green, 90));
  wds("persistent-always-black", "#000000");
  wds("persistent-always-white", "#ffffff");
  wds("persistent-always-branded", c.accent);
  wds("systems-bubble-surface-incoming", c.base);
  wds("systems-bubble-surface-outgoing", mix(c.accent, c.base, 20));
  wds("systems-bubble-content-deemphasized", fade(c.text, 50));
  wds("systems-bubble-surface-overlay", c.mantle);
  wds("systems-bubble-surface-system", c.mantle);
  wds("systems-bubble-surface-e2e", mix(c.yellow, c.mantle, 20));
  wds("systems-bubble-content-e2e", c.yellow);
  wds("systems-bubble-surface-business", mix(c.teal, c.mantle, 20));
  wds("systems-chat-surface-composer", c.base);
  wds("systems-chat-background-wallpaper", c.crust);
  wds("systems-chat-foreground-wallpaper", c.mantle);
  wds("systems-chat-surface-tray", c.base);
  wds("systems-status-seen", fade(c.text, 50));
  wds("components-platform-gesture-bar", fade(c.crust, 50));
  wds("components-platform-status-bar", fade(c.crust, 80));
  wds("components-surface-nav-bar", c.base);
  wds("app-wash", c.surface0);
  wds("white", c.crust);
  rgb("white", c.crust);
  rgb("toast-background", c.surface1);
  rgb("toast-text", c.text);
  rgb("picker-background", c.surface1);
  rgb("gray-500", c.overlay2);
  rgb("focus-animation", mix(c.accent, c.base, 40));
  rgb("focus-animation-deeper", mix(c.accent, c.base, 30));
  rgb("startup-icon", c.surface1);
  rgb("startup-background", c.crust);
  rgb("progress-background", c.surface0);

  const vars = out.map((d) => `  ${d} !important;`).join("\n");
  return `:root, :root .color-refresh, .color-refresh, .app-wrapper-web.app-wrapper-web,\n` +
    `:root.dark, .dark .app-wrapper-web.app-wrapper-web, .dark.color-refresh, .color-refresh.dark {\n${vars}\n}`;
};

// --- Discord ------------------------------------------------------------------

const discordCss = (c) => {
  const vars = DISCORD_VARS.map(([name, fn]) => `  ${name}: ${fn(c)} !important;`).join("\n");
  return `.visual-refresh.theme-dark, .visual-refresh .theme-dark,\n` +
    `.visual-refresh.theme-light, .visual-refresh .theme-light,\n` +
    `.theme-dark, .theme-darker, .theme-midnight, .theme-light {\n${vars}\n}\n` +
    `::selection { background-color: ${alpha(c.brand, 0.6)}; }`;
};

// --- apply + live reload ----------------------------------------------------------

const buildCss = location.hostname === "web.whatsapp.com" ? whatsappCss : discordCss;
let lastColors = null;

const apply = (css) => {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
  }
  style.textContent = css;
  // Keep it last in <html> so it wins over the site's own stylesheets.
  (document.documentElement || document).appendChild(style);
};

const refresh = async () => {
  try {
    const res = await fetch(chrome.runtime.getURL("colors.json"), { cache: "no-store" });
    const text = await res.text();
    if (text !== lastColors) {
      lastColors = text;
      apply(buildCss(palette(JSON.parse(text))));
    } else if (!document.getElementById(STYLE_ID)) {
      apply(buildCss(palette(JSON.parse(text))));
    }
  } catch (e) {
    // Extension reloaded or colors.json mid-write: try again next tick.
  }
};

refresh();
setInterval(refresh, POLL_MS);
