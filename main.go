// omarchy-web-theme turns the current Omarchy theme into a Brave theme and
// into the colours file the web apps extension reads.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/BurntSushi/toml"
)

const usage = `omarchy-web-theme: Brave and WhatsApp/Discord web apps in the current Omarchy theme.

Usage: omarchy-web-theme brave      build the Brave theme extension (~/.local/share/brave-theme-omarchy)
       omarchy-web-theme webapps    write the web apps extension's colors.json
       omarchy-web-theme all        both`

var home = os.Getenv("HOME")

type rgb [3]int

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, usage)
		os.Exit(2)
	}
	colors := map[string]any{}
	path := filepath.Join(home, ".local/state/omarchy/current/theme/colors.toml")
	if _, err := toml.DecodeFile(path, &colors); err != nil {
		fail(err)
	}
	switch os.Args[1] {
	case "brave":
		fail(brave(colors))
	case "webapps":
		fail(webapps(colors))
	case "all":
		fail(brave(colors))
		fail(webapps(colors))
	default:
		fmt.Fprintln(os.Stderr, usage)
		os.Exit(2)
	}
}

func fail(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "omarchy-web-theme:", err)
		os.Exit(1)
	}
}

// writeJSON replaces the file atomically, so readers never see half of it.
func writeJSON(path string, v any) error {
	raw, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, raw, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

// webapps exports the theme for the web apps extension, which re-reads it
// every few seconds.
func webapps(colors map[string]any) error {
	return writeJSON(filepath.Join(home, ".local/share/omarchy-webapps-theme/colors.json"), colors)
}

// color reads a "#rrggbb" key, falling back to another key.
func color(c map[string]any, key, fallback string) rgb {
	s, ok := c[key].(string)
	if !ok {
		s, _ = c[fallback].(string)
	}
	var out rgb
	if len(s) == 7 {
		for i := range out {
			v, _ := strconv.ParseUint(s[1+2*i:3+2*i], 16, 8)
			out[i] = int(v)
		}
	}
	return out
}

func luminance(c rgb) float64 {
	lin := func(v int) float64 {
		x := float64(v) / 255
		if x <= 0.03928 {
			return x / 12.92
		}
		return math.Pow((x+0.055)/1.055, 2.4)
	}
	return 0.2126*lin(c[0]) + 0.7152*lin(c[1]) + 0.0722*lin(c[2])
}

func contrast(a, b rgb) float64 {
	hi, lo := luminance(a), luminance(b)
	if lo > hi {
		hi, lo = lo, hi
	}
	return (hi + 0.05) / (lo + 0.05)
}

func mix(a, b rgb, w float64) rgb {
	var out rgb
	for i := range out {
		out[i] = int(math.RoundToEven(float64(a[i])*w + float64(b[i])*(1-w)))
	}
	return out
}

// brave builds an unpacked theme extension. Omarchy only sets one
// BrowserThemeColor, from which Brave derives a tinted palette; a theme sets
// each colour.
func brave(c map[string]any) error {
	fg, bg := color(c, "foreground", "foreground"), color(c, "background", "background")
	// Some themes set dark_foreground to their muted gray; for inactive tab
	// text keep it only when it stays readable on the toolbar.
	secondary := color(c, "dark_foreground", "foreground")
	if contrast(secondary, bg) < 4.5 {
		secondary = mix(fg, bg, 0.65)
	}
	colors := map[string]rgb{
		"frame":                        color(c, "darker_background", "background"),
		"frame_inactive":               color(c, "darker_background", "background"),
		"toolbar":                      bg,
		"tab_text":                     fg,
		"tab_background_text":          secondary,
		"tab_background_text_inactive": mix(fg, bg, 0.5),
		"bookmark_text":                fg,
		"toolbar_button_icon":          fg,
		"toolbar_text":                 fg,
		"omnibox_background":           color(c, "lighter_background", "background"),
		"omnibox_text":                 fg,
		"ntp_background":               bg,
		"ntp_text":                     fg,
		"ntp_link":                     color(c, "accent", "foreground"),
	}
	now := time.Now().Unix()
	manifest := map[string]any{
		"manifest_version": 3,
		"name":             "Omarchy",
		// Bump on every build so Brave picks up the new colours on reload.
		"version": fmt.Sprintf("1.%d.%d", now/65536, now%65536),
		"theme": map[string]any{
			"colors":     colors,
			"properties": map[string]string{"ntp_background_alignment": "bottom"},
		},
	}
	return writeJSON(filepath.Join(home, ".local/share/brave-theme-omarchy/manifest.json"), manifest)
}
