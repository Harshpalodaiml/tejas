#!/usr/bin/env bash
# Regenerate all pitch PDFs from source files in docs/pitch/
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PITCH="$ROOT/docs/pitch"
cd "$PITCH"

echo "→ PPTX → PDF"
soffice --headless --convert-to pdf --outdir . \
  Tejas-AI-Factory-Deck.pptx \
  Tejas-AI-Pitch-Deck.pptx 2>/dev/null || true

echo "→ Markdown → PDF"
for f in ai-factory-elevated-pitch.md 60-second-elevated-pitch.md one-pager.md pitch.md; do
  [ -f "$f" ] || continue
  pandoc "$f" -o "${f%.md}.docx" --from markdown --to docx
  soffice --headless --convert-to pdf --outdir . "${f%.md}.docx"
  rm -f "${f%.md}.docx"
done

echo "Done:"
ls -lh "$PITCH"/*.pdf