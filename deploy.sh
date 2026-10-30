#!/usr/bin/env bash
# Siteyi derler ve alican-aydogdu.github.io deposunun /globe/ alt yoluna gönderir.
# Kullanım: ./deploy.sh "commit mesajı"
set -euo pipefail
cd "$(dirname "$0")"

echo "1/4 derleme"
npm run build

echo "2/4 depo çekiliyor"
export GIT_SSH_COMMAND='ssh -i /root/.ssh/github_cv_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=no'
TMP="$(mktemp -d)"
git clone --depth 1 git@github.com:alican-aydogdu/alican-aydogdu.github.io.git "$TMP" >/dev/null

echo "3/4 /globe/ kopyalanıyor"
rm -rf "$TMP/globe"
mkdir -p "$TMP/globe"
cp -a dist/. "$TMP/globe/"
touch "$TMP/.nojekyll"

echo "4/4 gönderiliyor"
cd "$TMP"
git add -A globe .nojekyll
if git diff --cached --quiet; then
  echo "değişiklik yok — gönderim atlandı"
  exit 0
fi
git -c user.name="Ali Can AYDOGDU" -c user.email="alican.aydogdu@treves-group.com" \
  commit -m "globe: ${1:-güncelleme}" >/dev/null
git push origin main

echo "Tamam: https://alican-aydogdu.github.io/globe/  (Pages ~1-2 dk)"
