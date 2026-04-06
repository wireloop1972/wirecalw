#!/bin/bash
echo "=== Current version ==="
openclaw --version

echo ""
echo "=== Check for updates ==="
npm list -g openclaw 2>/dev/null || npm list -g @openclaw/cli 2>/dev/null || echo "Not installed via npm global"

echo ""
echo "=== Which openclaw binary ==="
which openclaw
file $(which openclaw)

echo ""
echo "=== Check npm for latest ==="
npm view openclaw version 2>/dev/null || npm view @openclaw/cli version 2>/dev/null || echo "Not found on npm"
