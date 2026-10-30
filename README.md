# Dünya Pazarı

Sembolik dünya haritası + ikinci el pazaryeri. three.js ile çizilen vektör küre;
her ülke kendi dolgusu ve sınırıyla, şehirler ilan sayısına göre büyüyen işaretlerle.

- Canlı: https://alican-aydogdu.github.io/globe/
- Depo: https://github.com/alican-aydogdu/globe (CV sitesinden ayrı)

## Yapı

```
index.html            HUD, arama, filtre çubuğu, detay paneli, ilan formu
src/main.js           sahne, kamera, hover, arama, kart, filtre/detay bağlantısı
src/sembol.js         ülke/şehir geometrisi, kimlik haritası (hover için raster)
src/pazaryeri.js      ilan noktaları (shader) + ekran uzayı isabet testi
src/ilanlar.js        kurgusal ilan/satıcı üreteci (deterministik)
src/filtre.js         kategori çipleri + fiyat aralığı
src/detay.js          ilan detay sayfası (#/ilan/<id>) + galeri
src/ekle.js           ilan verme formu (#/ilan-ekle)
src/gorsel.js         ilan fotoğrafları: kategoriye göre üretilen SVG
src/depo.js           kendi ilanların (localStorage) + fotoğraf küçültme
public/veri/          Natural Earth GeoJSON + üretilmiş ulkeler.json / sehirler.json
tools/veri_hazirla.py GeoJSON -> JSON (sadeleştirme, Türkçe adlar)
```

## Özellikler

- **İlan detay sayfası** — şehir kartındaki satıra tıkla; sağdan açılan panelde
  görsel galerisi (kendi fotoğrafın + üretilen 3 kare), künye, açıklama, satıcı,
  benzer ilanlar. Adres çubuğu `#/ilan/<id>` olur, bağlantı paylaşılabilir.
  "haritada göster" kamerayı o şehre uçurur.
- **Kategori + fiyat filtresi** — sol alttaki çiplerden çoklu kategori, fiyat
  açılırında çift aralıklı sürgü + kısayollar. Harita ve kart aynı süzgeci kullanır.
- **İlan ver** — sağ alttaki düğme. Fotoğraf (en fazla 3, tarayıcıda küçültülür),
  başlık/kategori/fiyat/şehir/durum/açıklama. Kayıt `localStorage`'da tutulur,
  yalnızca o tarayıcıda görünür; noktası haritada halkalı ve parlak çizilir.

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
