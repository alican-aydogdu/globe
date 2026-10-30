# Türkiye Pazarı

İkinci el pazaryeri + Türkiye haritası. Harita Türkiye sınırlarıyla kilitli; ülke
görünümünden yakınlaştıkça **il**, daha da yakınlaşınca **ilçe** kırılımı açılır.
Dolgular korokromatik: bölge, ilan yoğunluğu ya da ortalama fiyata göre boyanır.

- Canlı: https://alican-aydogdu.github.io/globe/
- Depo: https://github.com/alican-aydogdu/globe (CV sitesinden ayrı)

## Yapı

```
index.html            HUD, arama, filtre çubuğu, detay paneli, ilan formu
src/main.js           harita, arama, kart, filtre/detay/ilan verme bağlantısı
src/harita.js         Türkiye SVG haritası: il/ilçe katmanları, zoom, korokromatik boyama
src/ilanlar.js        kurgusal ilan/satıcı üreteci (deterministik)
src/filtre.js         kategori çipleri + fiyat aralığı
src/detay.js          ilan detay sayfası (#/ilan/<id>) + galeri
src/ekle.js           ilan verme formu (#/ilan-ekle)
src/gorsel.js         ilan fotoğrafları: kategoriye göre üretilen SVG
src/depo.js           kendi ilanların (localStorage) + fotoğraf küçültme
public/veri/          tr_il.json (81 il), tr_ilce.json (973 ilçe)
tools/tr_veri_hazirla.py  OSM sınırları -> sadeleştirilmiş JSON (eps 0.0038, 4 ondalık)
```

## Özellikler

- **Türkiye haritası** — sürükle gez, tekerlek/pinch ile yakınlaş, il/ilçe tıkla.
  2.1× üzeri ilçe sınırları ve ilan noktaları, 6.2× üzeri ilçe adları görünür.
  Sağdaki kırıntı (`Türkiye › İl › İlçe`) ve `+ / − / ⌂` düğmeleri ile gezinme.
- **Korokromatik boyama** — sağ alttaki panelden üç mod: **bölge** (7 coğrafi bölge),
  **yoğunluk** (ilan sayısı), **fiyat** (ortalama fiyat). Efsane moda göre yenilenir;
  filtre değişince renkler anında güncellenir. İlçe seviyesinde ilçeler de boyanır.
- **İl/ilçe kartı** — il veya ilçeye tıkla: o bölgenin ilanları soldaki listede,
  satıra tıkla detaya geç. Kendi ilanların yeşil noktayla işaretlenir.
- **İlan detay sayfası** — şehir kartındaki satıra tıkla; sağdan açılan panelde
  görsel galerisi (kendi fotoğrafın + üretilen 3 kare), künye, açıklama, satıcı,
  benzer ilanlar. Adres çubuğu `#/ilan/<id>` olur, bağlantı paylaşılabilir.
  "haritada göster" haritayı ilçeye uçurur ve ilanın noktasını vurgular.
- **Kategori + fiyat filtresi** — sol alttaki çiplerden çoklu kategori, fiyat
  açılırında çift aralıklı sürgü + kısayollar. Harita ve kart aynı süzgeci kullanır.
- **İlan ver** — sağ alttaki düğme. Fotoğraf (en fazla 3, tarayıcıda küçültülür),
  başlık/kategori/fiyat/il/ilçe/durum/açıklama (ilçe listesi seçilen ile göre süzülür). Kayıt `localStorage`'da tutulur,
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
