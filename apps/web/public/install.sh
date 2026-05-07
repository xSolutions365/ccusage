#!/bin/sh
set -e

TOKEN="$1"

if [ -z "$TOKEN" ]; then
	printf 'Error: token argument is required.\n' >&2
	printf 'Usage: curl -fsSL "https://dan-llewellyn-test.web.app/install.sh" | sh -s -- "<token>"\n' >&2
	exit 1
fi

CONFIG_DIR="$HOME/.config/ccusage"
CONFIG_FILE="$CONFIG_DIR/auth.json"

mkdir -p "$CONFIG_DIR"

printf '{"token":"%s","endpoint":"https://receiveusagereport-ogjzica23q-uc.a.run.app"}\n' "$TOKEN" > "$CONFIG_FILE"

printf 'ccusage auth configured successfully.\n'
printf 'Config written to: %s\n' "$CONFIG_FILE"
printf '\nRun "ccusage submit" to sync your stats.\n'
