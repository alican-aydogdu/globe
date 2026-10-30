# Dünya Pazarı

Sembolik dünya haritası + ikinci el pazaryeri. three.js ile çizilen vektör küre;
her ülke kendi dolgusu ve sınırıyla, şehirler ilan sayısına göre büyüyen işaretlerle.

- Canlı: https://alican-aydogdu.github.io/globe/
- Depo: https://github.com/alican-aydogdu/globe (CV sitesinden ayrı)

## Yapı

```
index.html            HUD, arama kutusu, ilan kartı
src/main.js           sahne, kamera, hover, arama, kart
src/sembol.js         ülke/şehir geometrisi, kimlik haritası (hover için raster)
src/pazaryeri.js      ilan noktaları (shader) + ekran uzayı isabet testi
src/ilanlar.js        kurgusal ilan/satıcı üreteci (deterministik)
public/veri/          Natural Earth GeoJSON + üretilmiş ulkeler.json / sehirler.json
tools/veri_hazirla.py GeoJSON -> JSON (sadeleştirme, Türkçe adlar)
```

## Komutlar

```
npm install
npm run dev        # 127.0.0.1:5199
npm run build      # dist/
./deploy.sh "mesaj"  # derler, gh-pages dalına gönderir
```

## Yayın

Kaynak kod `main` dalında, yayın çıktısı `gh-pages` dalında (`.nojekyll` ile).
Pages kaynağı: `gh-pages` / kök. Vite `base: "/globe/"`.

## Not

İlanlar, satıcılar ve fiyatlar **tamamen kurgusaldır** — demo amaçlı üretilir
(`src/ilanlar.js`, sabit tohum). Gerçek pazaryeri verisi yoktur.
