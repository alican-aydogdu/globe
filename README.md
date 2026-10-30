# Dünya — şehirlere kadar

three.js ile çizilmiş, yakınlaştıkça yüzeye inen interaktif dünya.
Statik site; `alican-aydogdu.github.io/globe/` altında yayınlanıyor.

**Adres:** https://alican-aydogdu.github.io/globe/

## Durum

- [x] Adım 1 — Erişilebilir site + dünya (küre, gece/gündüz, atmosfer, yıldızlar, zoom)
- [ ] Adım 2 — Şehir işaretleri + şehre uçuş
- [ ] Adım 3 — Sokak/uydu ölçeğinde döşeme (tile) yükleme

## Yapı

- `src/main.js` — sahne, kamera, OrbitControls, HUD, koordinat okuma, döngü
- `src/dunya.js` — küre shader'ı (gündüz/gece/topoloji), atmosfer, yıldız alanı
- `src/style.css` — HUD ve perde
- `public/textures/` — NASA Blue Marble (gündüz), city lights (gece), topoloji

## Komutlar

```bash
npm run dev      # http://127.0.0.1:5199 (base=/globe/ olduğu için /globe/ altında açılır)
npm run build    # dist/
./deploy.sh "mesaj"   # derle + GitHub Pages'e gönder
```

## Kontroller

Konsolda `window.__kure` açık: `kamera`, `kontroller`, `dunya`,
`koordinatVektor(38.5, 33.5)` ve `ekranKesisme(x, y)`.

- Ekran merkezindeki koordinat `ekranKesisme(innerWidth/2, innerHeight/2)` ile okunur.
- Sahra (23K 12D) merkezdeyken piksel rengi dokudaki kum rengine eşit çıkıyor
  (204,175,124 ≈ 207,170,118) — koordinat ↔ doku eşleşmesi doğrulandı.

## Notlar

- Kamera en yakın 1.045R'ye inebiliyor (yüzeyden ~285 km); şehir ölçeği için
  Adım 3'te döşeme katmanı gerekiyor, tek 4K doku bu mesafede bulanıklaşıyor.
- `prefers-reduced-motion` açıksa otomatik dönüş kapalı.
- Başsız (headless) tarayıcıda `requestAnimationFrame` duruyor; ekran görüntüsü
  alırken kare elle çizilmeli: `__kure.renderci.render(__kure.sahne, __kure.kamera)`.
