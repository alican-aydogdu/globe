// İkinci el pazaryeri için örnek (kurgusal) ilan üreteci.
// İlanlar Türkiye'nin 81 iline, ilçe sayısına göre dağıtılır; her ilan bir ilçeye düşer.
// Deterministik: aynı veri + aynı tohum → aynı ilanlar.

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

// Büyükşehirlerde ilan yoğunluğu biraz daha yüksek (plaka kodu -> çarpan)
const BUYUKSEHIR = { 34: 2.6, 6: 2.0, 35: 1.8, 1: 1.35, 16: 1.3, 7: 1.3, 42: 1.25, 41: 1.2 };

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

function aciklamaYaz(kategori, model, durum, yas, ilce, il) {
  const parcalar = [
    `${model} (${kategori.toLocaleLowerCase("tr")}) — ${durum.toLocaleLowerCase("tr")} durumda.`,
    ACIKLAMA_ACILIS[tamsayi(0, ACIKLAMA_ACILIS.length - 1)],
    ACIKLAMA_ORTA[tamsayi(0, ACIKLAMA_ORTA.length - 1)],
  ];
  if (yas > 20) parcalar.push("İlan uzun süredir yayında, fiyatta esneklik var.");
  parcalar.push(ACIKLAMA_KAPANIS[tamsayi(0, ACIKLAMA_KAPANIS.length - 1)]);
  parcalar.push(`${ilce}/${il} içinde görüşüp teslim edebiliriz.`);
  return parcalar.join(" ");
}

const HAVUZ = [];
for (const u of URUNLER) for (let i = 0; i < (u[4] || 1); i++) HAVUZ.push(u);

/**
 * @param {{iller: Array, ilceler: Array}} veri  public/veri/tr_il.json + tr_ilce.json
 */
export function ilanlariUret(veri) {
  const ilceler = veri.ilceler || [];
  const ilcelerIlBazinda = new Map();
  for (const ilce of ilceler) {
    if (!ilcelerIlBazinda.has(ilce.il)) ilcelerIlBazinda.set(ilce.il, []);
    ilcelerIlBazinda.get(ilce.il).push(ilce);
  }

  const ilanlar = [];
  let sayac = 0;

  for (const il of veri.iller || []) {
    const yerel = ilcelerIlBazinda.get(il.ad) || [];
    if (!yerel.length) continue;
    const carpan = BUYUKSEHIR[il.plaka] || 1;
    const adet = Math.max(2, Math.round(yerel.length * 1.05 * carpan));

    for (let i = 0; i < adet; i++) {
      const ilce = yerel[tamsayi(0, yerel.length - 1)];
      const urun = HAVUZ[tamsayi(0, HAVUZ.length - 1)];
      const [kategori, varyantlar, min, max] = urun;
      const model = varyantlar[tamsayi(0, varyantlar.length - 1)];

      // nokta ilçenin içine düşsün: ilçe sınır kutusunun küçük bir oranı kadar kaydır
      const xs = ilce.halkalar.flatMap((h) => h.map((p) => p[0]));
      const ys = ilce.halkalar.flatMap((h) => h.map((p) => p[1]));
      const gw = Math.max(...xs) - Math.min(...xs);
      const gh = Math.max(...ys) - Math.min(...ys);
      const pay = Math.min(gw, gh) * 0.34;
      const lat = Math.max(Math.min(...ys), Math.min(Math.max(...ys), ilce.merkez[1] + (rnd() - 0.5) * 2 * pay));
      const lon = Math.max(Math.min(...xs), Math.min(Math.max(...xs), ilce.merkez[0] + (rnd() - 0.5) * 2 * pay));

      sayac += 1;
      const ilan = {
        id: `IL-${String(sayac).padStart(5, "0")}`,
        baslik: `${model} · ${kategori}`,
        kategori,
        fiyat: fiyat(min, max),
        il: il.ad,
        ilce: ilce.ad,
        bolge: il.bolge,
        lat,
        lon,
        satici: ADLAR[tamsayi(0, ADLAR.length - 1)],
        durum: DURUMLAR[tamsayi(0, DURUMLAR.length - 1)],
        yas: tamsayi(0, 45),
        puan: (3.4 + rnd() * 1.6).toFixed(1),
        ilanNo: 1000 + sayac * 7,
      };
      ilan.aciklama = aciklamaYaz(kategori, model, ilan.durum, ilan.yas, ilce.ad, il.ad);
      ilanlar.push(ilan);
    }
  }

  ilanlar.sort((a, b) => a.yas - b.yas);
  return { ilanlar, ilSayisi: (veri.iller || []).length, ilceSayisi: ilceler.length };
}

export function ilanYasi(ilan) {
  return gunOnce(ilan.yas);
}

export const KATEGORILER = [...new Set(URUNLER.map((u) => u[0]))].sort((a, b) => a.localeCompare(b, "tr"));
export const DURUM_LISTESI = [...DURUMLAR];
