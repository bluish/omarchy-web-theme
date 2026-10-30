# omarchy-web-theme

Make Brave and the WhatsApp Web and Discord web apps follow the
[Omarchy](https://omarchy.org) theme.

| Piece | What it does |
|---|---|
| `omarchy-web-theme brave` | Builds a Brave theme (an unpacked theme extension in `~/.local/share/brave-theme-omarchy`) from the current theme's `colors.toml`: frame, toolbar, tabs, omnibox and new tab page. Inactive tab text falls back to a foreground/background mix when the theme's muted colour is under 4.5:1 contrast. |
| `extension/` | **Omarchy Web Apps Theme**, a content script for WhatsApp Web and Discord. It re-reads `colors.json` every 3 s, so a theme change shows up live without a reload. |
| `omarchy-web-theme webapps` | Writes the current theme's colours to the extension's `colors.json`. |
| `brave-restart` | Restarts Brave gracefully (tabs come back through "Continue where you left off"), because Brave reads its browser theme only at startup; then runs `AFTER_RESTART` from the config, if set. |
| `hooks/` | `theme-set` hooks: rebuild the Brave theme and restart Brave, and refresh the web apps' colours. |

## Why a theme extension instead of Omarchy's colour policy

Omarchy sets Brave's `BrowserThemeColor` policy to one colour, and Brave
derives a tinted palette from it, so the toolbar and vertical tabs don't
match the theme's own background. A theme extension sets each colour. The
policy file wins over a theme, so the hook deletes
`/etc/brave/policies/managed/color.json` after Omarchy writes it. That needs
a sudoers rule for the exact command, for example in
`/etc/sudoers.d/brave-theme`:

```
youruser ALL=(root) NOPASSWD: /usr/bin/rm -f /etc/brave/policies/managed/color.json
```

Without the rule, the hook skips the deletion and Omarchy's single colour wins.

## Install

```sh
sh install.sh      # builds with Go
```

Then add both extensions to `--load-extension` in
`~/.config/brave-origin-flags.conf` (the installer prints the paths) and
restart Brave.

Written for Brave Origin from Omarchy's package. Another browser, policy
path or a command to run after a restart goes in `~/.config/omarchy-web-theme/config`; see
[`examples/config`](examples/config) for every option and its default.

## License

MIT. The WhatsApp and Discord variable maps are adapted from
[catppuccin/userstyles](https://github.com/catppuccin/userstyles) and
[catppuccin/discord](https://github.com/catppuccin/discord) (MIT); see
[LICENSE](LICENSE).
