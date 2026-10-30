# AGENTS.md

Omarchy theming for Brave and the WhatsApp/Discord web apps:

- `main.go`: the `omarchy-web-theme` binary (Go, BurntSushi/toml). Reads
  `~/.local/state/omarchy/current/theme/colors.toml` and writes the Brave
  theme manifest and the web apps' `colors.json`.
- `extension/`: the "Omarchy Web Apps Theme" content script (plain JS, no
  build). Variable maps are adapted from catppuccin (MIT); keep the notice in
  LICENSE when changing them.
- `bin/brave-restart` (bash).
- `hooks/`: Omarchy `theme-set` hooks.
- Optional settings (browser, policy file, after-restart command) are shell variables read
  from `~/.config/omarchy-web-theme/config`; defaults match Omarchy.

## Rules

- `colors.json` and the manifest are replaced atomically (temp file and
  rename); the extension polls the file and must never read half of it.
- Bump the Brave theme version on every build, or Brave keeps the old colours.

## Testing

`go vet . && go build`, then `./omarchy-web-theme all` and compare the
manifest and `colors.json` with the theme's `colors.toml`. `bash -n bin/*
hooks/*` for the scripts. Restarting Brave closes every window, so only run
`brave-restart` when that is fine.

## Commits

`type(scope): description` in English; body with why, then lowercase
bullets of what changed, then a `Validation:` line with what was actually run.
