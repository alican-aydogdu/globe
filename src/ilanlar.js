// İkinci el pazaryeri için örnek (kurgusal) ilan üreteci.
// Deterministik: aynı tohum → aynı ilanlar, böylece testler tekrarlanabilir.

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20261030);

const SEHIRLER = [
  ["İstanbul", 41.01, 28.97, 1.0],
  ["Ankara", 39.93, 32.86, 0.52],
  ["İzmir", 38.42, 27.14, 0.44],
  ["Bursa", 40.19, 29.06, 0.34],
  ["Antalya", 36.9, 30.7, 0.3],
  ["Kocaeli", 40.85, 29.88, 0.18],
  ["Adana", 37.0, 35.32, 0.22],
  ["Konya", 37.87, 32.48, 0.2],
  ["Gaziantep", 37.07, 37.38, 0.18],
  ["Kayseri", 38.73, 35.49, 0.16],
  ["Mersin", 36.8, 34.63, 0.16],
  ["Eskişehir", 39.78, 30.52, 0.14],
  ["Diyarbakır", 37.91, 40.24, 0.14],
  ["Samsun", 41.29, 36.33, 0.13],
  ["Denizli", 37.78, 29.09, 0.11],
  ["Şanlıurfa", 37.16, 38.8, 0.11],
  ["Malatya", 38.35, 38.31, 0.1],
  ["Trabzon", 41.0, 39.72, 0.1],
  ["Sakarya", 40.78, 30.4, 0.1],
  ["Erzurum", 39.9, 41.27, 0.09],
  ["Balıkesir", 39.65, 27.89, 0.09],
  ["Manisa", 38.61, 27.43, 0.09],
  ["Aydın", 37.85, 27.84, 0.09],
  ["Muğla", 37.22, 28.36, 0.09],
  ["Hatay", 36.2, 36.16, 0.09],
  ["Tekirdağ", 40.98, 27.51, 0.09],
  ["Kahramanmaraş", 37.58, 36.94, 0.08],
  ["Elazığ", 38.68, 39.22, 0.08],
  ["Van", 38.49, 43.38, 0.08],
  ["Sivas", 39.75, 37.02, 0.07],
  ["Zonguldak", 41.46, 31.79, 0.07],
  ["Çanakkale", 40.15, 26.41, 0.07],
  ["Isparta", 37.76, 30.55, 0.07],
  ["Edirne", 41.68, 26.56, 0.06],
  ["Rize", 41.02, 40.52, 0.06],
  ["Ordu", 40.98, 37.88, 0.06],
  ["Berlin", 52.52, 13.4, 0.09],
  ["Amsterdam", 52.37, 4.9, 0.08],
  ["Londra", 51.51, -0.13, 0.09],
  ["Paris", 48.86, 2.35, 0.08],
  ["Detroit", 42.33, -83.05, 0.06],
  ["New York", 40.71, -74.01, 0.08],
  ["Tokyo", 35.68, 139.69, 0.07],
  ["Dubai", 25.2, 55.27, 0.06],
  ["Bakü", 40.41, 49.87, 0.06],
  ["Tiflis", 41.72, 44.79, 0.05],
];

const URUNLER = [
  ["Bisiklet", ["Trek FX 2", "Rockrider ST 540", "Carraro Sportive 227", "Giant Escape 3", "Salcano City Fun"], 3500, 46000, 5],
  ["Bisiklet", ["Katlanır bisiklet 20\"", "Yol bisikleti karbon", "BMX 20\"", "Elektrikli bisiklet 500W"], 6500, 62000, 5],
  ["Kaykay", ["Element komple kaykay", "Penny board 22\"", "Longboard 41\"", "Korlayıcı seti"], 700, 6800, 2],
  ["Kamera", ["Sony A7 III gövde", "Canon EOS R + 24-105", "Fujifilm X-T4", "Nikon Z6 II", "GoPro Hero 11"], 4500, 74000, 3],
  ["Kamera", ["Mamiya RB67 orta format", "Polaroid Now+", "DJI Osmo Pocket", "Vintage lens 50mm f/1.4"], 2200, 48000, 3],
  ["Gitar", ["Fender Squier Strat", "Yamaha F310 akustik", "Ibanez RG550", "Klasik gitar 3/4", "Bas gitar 4 telli"], 1800, 38000, 2],
  ["Koltuk", ["IKEA KIVIK 3'lü", "Kadife Chester koltuk", "L köşe koltuk", "Tekli berjer", "Yataklı kanepe"], 2900, 29000, 4],
  ["Buzdolabı", ["Arçelik 570 lt No-Frost", "Bosch KGN56", "Samsung French Door", "Mini buzdolabı 90 lt"], 3800, 32000, 2],
  ["Çamaşır makinesi", ["Arçelik 9 kg", "Bosch Serie 6", "Samsung EcoBubble 8 kg", "Siemens iQ300"], 4500, 28000, 2],
  ["Bulaşık makinesi", ["Bosch SMS46", "Arçelik 8 program", "Beko 6 program"], 4200, 24000, 1],
  ["Telefon", ["iPhone 13 128 GB", "iPhone 15 Pro", "Samsung S23", "Xiaomi 13T", "Pixel 7a"], 4200, 48000, 4],
  ["Laptop", ["MacBook Air M1", "ThinkPad T14", "Asus ROG G14", "Dell XPS 13", "Huawei MateBook D15"], 6500, 72000, 4],
  ["Oyun konsolu", ["PlayStation 5 Slim", "Xbox Series S", "Nintendo Switch OLED", "PS4 Pro + 2 kol"], 4800, 26000, 3],
  ["Drone", ["DJI Mini 3 Pro", "DJI Air 2S", "Mavic 2 Zoom", "FPV set"], 4200, 42000, 1],
  ["Çadır", ["Quechua 2 saniye 2 kişilik", "Husky 4 mevsim", "Kamp çadırı 6 kişilik", "Tarp + poles"], 1400, 12500, 2],
  ["Klima", ["Daikin 12000 BTU", "Arçelik 18000 BTU inverter", "Baymak 9000 BTU", "Taşınabilir klima"], 8500, 41000, 2],
  ["Elektrikli scooter", ["Xiaomi Mi Pro 2", "Segway Ninebot Max", "Kugoo M4 Pro"], 5800, 34000, 2],
  ["Plak", ["Pink Floyd – The Wall", "Cem Karaca – Yoksulluk Kader", "Jazz koleksiyonu 40 plak", "Beatles – Abbey Road"], 220, 2800, 1],
  ["Kitap", ["Kürk Mantolu Madonna", "Sefiller (2 cilt)", "Yapı Kredi klasikler 12 kitap", "Sapiens"], 60, 640, 3],
  ["Monitör", ["Dell U2720Q 4K", "LG 27GN850", "Samsung Odyssey G5", "Asus 144Hz 24\""], 2400, 21000, 2],
  ["Bebek arabası", ["Stokke Xplory", "Chicco Trio", "Joie compact", "Baston araba"], 1900, 15500, 2],
  ["Kask", ["Shoei NXR2", "Arai RX-7V", "Bisiklet kaskı M", "Tam yüz kask L"], 650, 6400, 3],
  ["Halı", ["Hereke yün 2x3", "Uşak desen 200x300", "Yün yolluk", "Modern dokuma 160x230"], 1400, 19000, 2],
  ["Gardırop", ["IKEA PAX 3 kapak", "Sürgülü 6 kapak", "Ceviz gardırop", "Açık askılık"], 2800, 21000, 2],
  ["Masa", ["Çalışma masası 140 cm", "Yemek masası 8 kişilik", "Ahşap sehpa", "Ayarlanabilir yükseklik"], 1100, 9500, 2],
  ["Ayna", ["Boy aynası 60x180", "Altın çerçeve", "LED makyaj aynası"], 380, 4200, 1],
  ["Matkap", ["Bosch GSB 18V", "Makita DHP482", "Darbeli matkap 750W", "Vidalama seti"], 850, 8200, 1],
  ["Kamp ocağı", ["MSR PocketRocket", "Trangia 27 seti", "Campingaz 2 göz"], 450, 3600, 1],
  ["Tenis raketi", ["Wilson Pro Staff", "Babolat Pure Drive", "Head Speed MP"], 750, 7200, 1],
  ["Koşu bandı", ["Technogym Run", "Altis 2.5 HP", "Katlanır koşu bandı"], 3800, 31000, 1],
  ["Akvaryum", ["120 lt bitkili set", "Nano akvaryum 30 lt", "Deniz akvaryumu + sump"], 950, 9200, 1],
];

const ADLAR = [
  "Mert K.", "Ayşe D.", "Burak T.", "Elif S.", "Can Y.", "Zeynep A.", "Emre B.", "Selin Ö.",
  "Hakan M.", "Deniz G.", "Kerem U.", "Ece N.", "Onur K.", "Buse Ç.", "Tolga Ş.", "İrem P.",
  "Serkan V.", "Nilay Y.", "Ozan R.", "Melis T.", "Kaan İ.", "Ceren A.", "Barış D.", "Sıla K.",
  "Volkan H.", "Yasemin E.", "Cem L.", "Gizem F.", "Umut C.", "Pelin S.", "Arda G.", "Tuğçe M.",
  "Levent B.", "Duygu O.", "Ege Ş.", "Nazlı U.", "Murat Ç.", "Sevgi T.", "Yusuf A.", "Bilge K.",
];

const DURUMLAR = ["Sıfır gibi", "İyi", "Orta", "Az kullanılmış", "Yenilenmiş"];

const ACIKLAMA_ACILIS = [
  "Ev değişikliği yüzünden satıyorum.",
  "İhtiyaç fazlası, boşta duruyor.",
  "Yükseltme yaptığım için çıkarıyorum.",
  "Taşınma öncesi elden çıkarıyorum.",
  "Kullanmadığım için satılık.",
];

const ACIKLAMA_ORTA = [
  "Düzenli bakımı yapıldı, çalışır durumda.",
  "Kozmetik olarak temiz, işlevinde sorun yok.",
  "Tüm parçaları tam, eksik yok.",
  "Faturalı, orijinal kutusu mevcut.",
  "Küçük kullanım izleri var, fotoğraflarda görünüyor.",
  "Sigara içilmeyen, evcil hayvansız evde kullanıldı.",
];

const ACIKLAMA_KAPANIS = [
  "Pazarlık payı sınırlı. Elden teslim.",
  "Şehir içi elden teslim, kargo alıcıya ait.",
  "Denemek isteyen gelebilir, gündüz uygunum.",
  "Takas düşünmüyorum, nakit tercihim.",
  "Pazartesi–cumartesi 18:00 sonrası ulaşabilirsin.",
];

function aciklamaYaz(kategori, model, durum, yas, sehir) {
  const parcalar = [
    `${model} (${kategori.toLocaleLowerCase("tr")}) — ${durum.toLocaleLowerCase("tr")} durumda.`,
    ACIKLAMA_ACILIS[tamsayi(0, ACIKLAMA_ACILIS.length - 1)],
    ACIKLAMA_ORTA[tamsayi(0, ACIKLAMA_ORTA.length - 1)],
  ];
  if (yas > 20) parcalar.push("İlan uzun süredir yayında, fiyatta esneklik var.");
  parcalar.push(ACIKLAMA_KAPANIS[tamsayi(0, ACIKLAMA_KAPANIS.length - 1)]);
  parcalar.push(`${sehir} içinde görüşüp teslim edebiliriz.`);
  return parcalar.join(" ");
}


const HAVUZ = [];
for (const u of URUNLER) for (let i = 0; i < (u[4] || 1); i++) HAVUZ.push(u);
function agirlikliUrun() {
  return HAVUZ[tamsayi(0, HAVUZ.length - 1)];
}

function tamsayi(min, max) {
  return Math.floor(min + rnd() * (max - min + 1));
}

function fiyat(min, max) {
  const t = Math.pow(rnd(), 1.6);
  const v = min + t * (max - min);
  return Math.max(50, Math.round(v / 50) * 50);
}

function gunOnce(gun) {
  return gun === 0 ? "bugün" : gun === 1 ? "dün" : `${gun} gün önce`;
}

export function ilanlariUret() {
  const ilanlar = [];
  let sayac = 0;

  for (const [sehir, lat, lon, agirlik] of SEHIRLER) {
    const adet = Math.max(10, Math.round(agirlik * 140));
    for (let i = 0; i < adet; i++) {
      const [kategori, varyantlar, min, max] = agirlikliUrun();
      const model = varyantlar[tamsayi(0, varyantlar.length - 1)];
      const baslik = `${model} · ${kategori}`;
      sayac += 1;
      ilanlar.push({
        id: `IL-${String(sayac).padStart(5, "0")}`,
        baslik,
        kategori,
        fiyat: fiyat(min, max),
        sehir,
        lat: lat + (rnd() - 0.5) * 0.22,
        lon: lon + (rnd() - 0.5) * 0.3,
        satici: ADLAR[tamsayi(0, ADLAR.length - 1)],
        durum: DURUMLAR[tamsayi(0, DURUMLAR.length - 1)],
        yas: tamsayi(0, 45),
        puan: (3.4 + rnd() * 1.6).toFixed(1),
        ilanNo: 1000 + sayac * 7,
        aciklama: "",
      });
      const son = ilanlar[ilanlar.length - 1];
      son.aciklama = aciklamaYaz(kategori, model, son.durum, son.yas, sehir);
    }
  }

  ilanlar.sort((a, b) => a.yas - b.yas);
  return { ilanlar, sehirSayisi: SEHIRLER.length };
}

export function ilanYasi(ilan) {
  return gunOnce(ilan.yas);
}

// Form ve filtre için: tüm şehirler, kategoriler, durumlar.
export const SEHIR_LISTESI = SEHIRLER.map(([ad, lat, lon]) => [ad, lat, lon]);
export const KATEGORILER = [...new Set(URUNLER.map((u) => u[0]))].sort((a, b) => a.localeCompare(b, "tr"));
export const DURUM_LISTESI = [...DURUMLAR];
