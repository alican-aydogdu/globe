#!/usr/bin/env bash
# Siteyi derler, docs/ klasörüne yazar ve kendi deposuna (alican-aydogdu/globe) gönderir.
# Kullanım: ./deploy.sh "commit mesajı"
set -euo pipefail
cd "$(dirname "$0")"

echo "1/3 derleme"
npm run build

echo "2/3 commit"
git add -A
if git diff --cached --quiet; then
  echo "değişiklik yok — gönderim atlandı"
  exit 0
fi
git -c user.name="Ali Can AYDOGDU" -c user.email="alican.aydogdu@treves-group.com" \
  commit -m "${1:-güncelleme}" >/dev/null

echo "3/3 gönderim"
git push origin main

echo "Tamam: https://alican-aydogdu.github.io/globe/  (Pages ~1 dk)"
