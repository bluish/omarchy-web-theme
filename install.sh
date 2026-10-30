#!/bin/sh
# Build and install for your user: the binary, the scripts, the web apps
# extension and the theme-set hooks. Brave's flags and the policy rule are
# manual (see README). Needs Go to build.
set -e
cd "$(dirname "$0")"
go build -trimpath -o omarchy-web-theme .
install -Dm755 omarchy-web-theme "$HOME/.local/bin/omarchy-web-theme"
for f in bin/*; do install -Dm755 "$f" "$HOME/.local/bin/$(basename "$f")"; done
ext="$HOME/.local/share/omarchy-webapps-theme"
install -d "$ext"
install -m644 extension/* "$ext/"
"$HOME/.local/bin/omarchy-web-theme" all
omarchy hook install theme-set hooks/brave-omarchy-theme
omarchy hook install theme-set hooks/omarchy-webapps-theme
cat <<MSG
Add both extensions to --load-extension in ~/.config/brave-origin-flags.conf
(comma-separated, after the ones already there):
  $HOME/.local/share/brave-theme-omarchy,$ext
then restart Brave.
MSG
