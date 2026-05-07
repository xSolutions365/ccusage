#!/bin/sh
set -e

TOKEN="$1"

if [ -z "$TOKEN" ]; then
	printf 'Error: token argument is required.\n' >&2
	printf 'Usage: curl -fsSL "https://dan-llewellyn-test.web.app/install.sh" | sh -s -- "<token>"\n' >&2
	exit 1
fi

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
	x86_64) ARCH="x64" ;;
	arm64 | aarch64) ARCH="arm64" ;;
	*)
		printf 'Error: Unsupported architecture: %s\n' "$ARCH" >&2
		exit 1
		;;
esac

case "$OS" in
	darwin | linux) ;;
	*)
		printf 'Error: Unsupported OS: %s\n' "$OS" >&2
		exit 1
		;;
esac

PLATFORM="${OS}-${ARCH}"
INSTALL_DIR="$HOME/.local/bin"
CONFIG_DIR="$HOME/.config/ccusage"
DOWNLOAD_URL="https://dan-llewellyn-test.web.app/api/download?token=${TOKEN}&platform=${PLATFORM}"

printf 'Installing ccusage for %s...\n' "$PLATFORM"

mkdir -p "$INSTALL_DIR"
curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_DIR/ccusage"
chmod +x "$INSTALL_DIR/ccusage"

mkdir -p "$CONFIG_DIR"
printf '{"token":"%s","endpoint":"https://receiveusagereport-ogjzica23q-uc.a.run.app"}\n' "$TOKEN" >"$CONFIG_DIR/auth.json"

printf '\nccusage installed to %s\n' "$INSTALL_DIR/ccusage"
printf 'Auth configured at %s\n' "$CONFIG_DIR/auth.json"

if ! command -v ccusage >/dev/null 2>&1; then
	printf '\nAdd %s to your PATH:\n' "$INSTALL_DIR"
	printf '  export PATH="$HOME/.local/bin:$PATH"\n'
fi

printf '\nRun "ccusage daily" to view your usage.\n'
