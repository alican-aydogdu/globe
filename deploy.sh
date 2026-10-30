#!/usr/bin/env bash
# Derler, dist/ çıktısını gh-pages dalına gönderir.
# Kaynak kod main dalında; yayın gh-pages'te.
# Kullanım: ./deploy.sh "commit mesajı"
set -euo pipefail
cd "$(dirname "$0")"

echo "1/4 derleme"
npm run build

echo "2/4 kaynak commit"
git add -A
if git diff --cached --quiet; then
  echo "kaynakta değişiklik yok"
else
  git -c user.name="Ali Can AYDOGDU" -c user.email="alican.aydogdu@treves-group.com" \
    commit -m "${1:-güncelleme}" >/dev/null
  git push origin main
fi

echo "3/4 gh-pages hazırlanıyor"
TMP="$(mktemp -d)"
cp -a dist/. "$TMP"/
cd "$TMP"
git init -q -b gh-pages
touch .nojekyll
git add -A
git -c user.name="Ali Can AYDOGDU" -c user.email="alican.aydogdu@treves-group.com" \
  commit -qm "${1:-güncelleme}"

echo "4/4 yayınlanıyor"
git push -f https://github.com/alican-aydogdu/globe.git gh-pages 2>&1 | tail -2
rm -rf "$TMP"

echo "Tamam: https://alican-aydogdu.github.io/globe/  (Pages ~1 dk)"
