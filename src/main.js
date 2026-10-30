// Türkiye Pazarı — harita, arama, filtre, ilan detayı ve ilan verme akışını bağlar.

import "./style.css";
import { ilanlariUret, KATEGORILER, DURUM_LISTESI } from "./ilanlar.js";
import { haritaKur } from "./harita.js";
import { filtreKur } from "./filtre.js";
import { detayKur, adrestenIlanId } from "./detay.js";
import { ekleKur } from "./ekle.js";
import { yerelIlanlariOku, yerelIlanEkle, yerelIlanSil } from "./depo.js";
import { gorselUret } from "./gorsel.js";

const el = (id) => document.getElementById(id);
const BICIM = new Intl.NumberFormat("tr-TR");
const BASE = import.meta.env.BASE_URL;

let toastZaman = 0;
function toast(baslik, alt = "") {
  const kutu = el("toast");
  el("toastBaslik").textContent = baslik;
  el("toastAlt").textContent = alt;
  kutu.hidden = false;
  kutu.dataset.acik = "1";
  clearTimeout(toastZaman);
  toastZaman = setTimeout(() => {
    kutu.dataset.acik = "0";
    setTimeout(() => {
      if (kutu.dataset.acik === "0") kutu.hidden = true;
    }, 220);
  }, 3200);
}

function perde(deger, yazi) {
  const bar = el("cubuk");
  if (bar) bar.style.width = `${Math.round(deger * 100)}%`;
  if (yazi) el("perdeYazi").textContent = yazi;
  if (deger >= 1) {
    const p = el("perde");
    p.dataset.kapali = "1";
    setTimeout(() => (p.hidden = true), 420);
  }
}

async function jsonAl(yol) {
  const cevap = await fetch(`${BASE}${yol}`);
  if (!cevap.ok) throw new Error(`${yol}: ${cevap.status}`);
  return cevap.json();
}

async function basla() {
  perde(0.08, "sınırlar indiriliyor");
  const [ilVeri, ilceVeri] = await Promise.all([jsonAl("veri/tr_il.json"), jsonAl("veri/tr_ilce.json")]);
  const iller = ilVeri.iller;
  const ilceler = ilceVeri.ilceler;
  perde(0.4, "ilanlar hazırlanıyor");

  const ilAdlari = new Set(iller.map((i) => i.ad));
  const ilBilgi = new Map(iller.map((i) => [i.ad, i]));

  const { ilanlar: uretilen } = ilanlariUret({ iller, ilceler });

  // eski sürümden kalan kayıtları il/ilçe'ye taşı
  const kendiIlanlar = [];
  for (const kayit of yerelIlanlariOku()) {
    const il = kayit.il || kayit.sehir;
    if (!ilAdlari.has(il)) continue;
    const yerelIlceler = ilceler.filter((c) => c.il === il);
    const ilce =
      kayit.ilce ||
      yerelIlceler.find((c) => Math.abs(c.merkez[1] - (kayit.lat || 0)) < 0.4)?.ad ||
      yerelIlceler[0]?.ad;
    if (!ilce) continue;
    kendiIlanlar.push({ ...kayit, il, ilce, bolge: ilBilgi.get(il)?.bolge || "" });
  }

  let ilanlar = [...kendiIlanlar, ...uretilen];
  const ilanHaritasi = new Map(ilanlar.map((i) => [i.id, i]));

  let suzulmus = ilanlar;
  let aramaMetni = "";
  let harita;
  let filtre;
  let detay;

  // ——— harita ———
  harita = haritaKur({
    kok: el("harita"),
    iller,
    ilceler,
    ilanlarAl: () => suzulmus,
    onSecim: (id) => detay.ac(id, { adres: true }),
    onHover: (bilgi, olay) => ipucuGuncelle(bilgi, olay),
    onBosluk: () => {
      kartKapat();
      ipucuGizle();
    },
    onSeviye: () => kirintiCiz(),
    onLegend: (bilgi) => efsaneCiz(bilgi),
    onSecimDegisti: ({ il, ilce }) => {
      kirintiCiz();
      if (il) kartAc(il, ilce);
      else kartKapat();
    },
  });
  perde(0.7, "harita çiziliyor");

  // ——— filtre ———
  filtre = filtreKur({
    kategoriKok: el("filtreKategoriler"),
    fiyatKok: el("filtreFiyat"),
    ilanlar,
    onChange: () => {
      el("filtreTemizle").hidden = !filtre.aktifMi();
      uygula();
    },
  });

  // ——— detay ———
  detay = detayKur({
    kok: el("detay"),
    ilanBul: (id) => ilanHaritasi.get(id),
    benzerBul: (ilan) =>
      ilanlar
        .filter((i) => i.id !== ilan.id && i.kategori === ilan.kategori)
        .sort(
          (a, b) =>
            (b.il === ilan.il ? 1 : 0) - (a.il === ilan.il ? 1 : 0) ||
            Math.abs(a.fiyat - ilan.fiyat) - Math.abs(b.fiyat - ilan.fiyat)
        )
        .slice(0, 4),
    haritadaGoster: (ilan) => {
      harita.ilceSec(ilan.il, ilan.ilce); // ilçeye uç + kırıntıyı kur
      harita.noktaVurgula(ilan.id);
    },
    toast,
    onSil: (ilan) => {
      yerelIlanSil(ilan.id);
      ilanlar = ilanlar.filter((i) => i.id !== ilan.id);
      ilanHaritasi.delete(ilan.id);
      filtre.yay();
      yenile();
      toast("ilan kaldırıldı", ilan.baslik);
    },
  });

  // ——— ilan ekleme ———
  const ekle = ekleKur({
    kok: el("ekle"),
    iller,
    ilceler,
    kategoriler: KATEGORILER,
    durumlar: DURUM_LISTESI,
    varsayilanSatici: "Sen",
    toast,
    onEkle: (ilan) => {
      yerelIlanEkle(ilan);
      ilanlar = [ilan, ...ilanlar];
      kendiIlanlar.unshift(ilan);
      ilanHaritasi.set(ilan.id, ilan);
      yenile();
      harita.ilceSec(ilan.il, ilan.ilce); // ilçeye uç + kırıntıda göster
      harita.noktaVurgula(ilan.id);
      setTimeout(() => detay.ac(ilan.id, { adres: true }), 620);
    },
  });

  // ——— süzgeç ———
  function suzgec(i) {
    if (aramaMetni) {
      const ara = `${i.baslik} ${i.kategori} ${i.il} ${i.ilce} ${i.satici}`.toLocaleLowerCase("tr");
      if (!ara.includes(aramaMetni)) return false;
    }
    return filtre.suz(i);
  }

  function uygula() {
    suzulmus = ilanlar.filter(suzgec);
    const ilSayisi = new Set(suzulmus.map((i) => i.il)).size;
    el("aramaSayi").textContent = `${BICIM.format(suzulmus.length)} ilan`;
    el("filtreDurum").textContent = aramaMetni
      ? `“${aramaMetni}” · ${BICIM.format(suzulmus.length)} sonuç`
      : `${BICIM.format(suzulmus.length)} ilan · ${ilSayisi} il`;
    el("durum").textContent = suzulmus.length ? `${BICIM.format(suzulmus.length)} ilan` : "sonuç yok";
    harita.boya();
    const secim = harita.secili();
    if (!el("ilanKart").hidden && secim.il) kartAc(secim.il, secim.ilce);
  }

  function yenile() {
    uygula();
    kirintiCiz();
  }

  // ——— il/ilçe kartı ———
  const kart = el("ilanKart");
  const kartListe = el("kartListe");

  function kartAc(il, ilce) {
    const yerel = suzulmus.filter((i) => i.il === il && (!ilce || i.ilce === ilce));
    if (!yerel.length) {
      kartKapat();
      return;
    }
    el("kartSehir").textContent = ilce ? `${ilce} · ${il}` : il;
    el("kartAdet").textContent = `${BICIM.format(yerel.length)} ilan`;
    const SINIR = 40;
    kartListe.replaceChildren(
      ...yerel.slice(0, SINIR).map((ilan) => {
        const li = document.createElement("li");
        li.className = "kart-satir";
        if (ilan.benim) li.dataset.benim = "1";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "kart-dugme";
        btn.innerHTML = `<img class="kart-foto" alt="" loading="lazy" />
          <span class="kart-metin">
            <span class="kart-baslik"></span>
            <span class="kart-meta"></span>
          </span>
          <span class="kart-fiyat"></span>`;
        btn.querySelector(".kart-foto").src = gorselUret(ilan, 0);
        btn.querySelector(".kart-baslik").textContent = ilan.baslik;
        btn.querySelector(".kart-meta").textContent = ilan.benim ? "senin ilanın" : `${ilan.satici} · ${ilan.durum}`;
        btn.querySelector(".kart-fiyat").textContent = `${BICIM.format(ilan.fiyat)} ₺`;
        btn.addEventListener("click", () => detay.ac(ilan.id, { adres: true }));
        li.append(btn);
        return li;
      })
    );
    el("kartAlt").textContent =
      yerel.length > SINIR ? `ilk ${SINIR} ilan · yakınlaşarak daralt` : `${BICIM.format(yerel.length)} ilan listelendi`;
    kart.hidden = false;
    requestAnimationFrame(() => (kart.dataset.acik = "1"));
  }

  function kartKapat() {
    if (kart.hidden) return;
    delete kart.dataset.acik;
    setTimeout(() => {
      if (!kart.dataset.acik) kart.hidden = true;
    }, 220);
  }

  el("kartKapat").addEventListener("click", kartKapat);

  // ——— kırıntı ———
  const kirinti = el("kirinti");
  function kirintiCiz() {
    if (!harita) return; // harita kurulurken çağrılabilir
    const { il, ilce } = harita.secili();
    const dugumler = [{ ad: "Türkiye", il: null, ilce: null }];
    if (il) dugumler.push({ ad: il, il, ilce: null });
    if (il && ilce) dugumler.push({ ad: ilce, il, ilce });
    const parcalar = [];
    dugumler.forEach((d, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = d.ad;
      btn.dataset.son = i === dugumler.length - 1 ? "1" : "0";
      btn.addEventListener("click", () => {
        if (!d.il) harita.sifirla();
        else if (d.ilce) harita.ilceSec(d.il, d.ilce);
        else harita.ilSec(d.il);
      });
      parcalar.push(btn);
      if (i < dugumler.length - 1) {
        const ayrac = document.createElement("span");
        ayrac.className = "kirinti-ayrac";
        ayrac.textContent = "›";
        ayrac.setAttribute("aria-hidden", "true");
        parcalar.push(ayrac);
      }
    });
    kirinti.replaceChildren(...parcalar);
    kirinti.hidden = dugumler.length < 2;
  }

  // ——— efsane ———
  function efsaneCiz(bilgi) {
    const kutu = el("efsane");
    if (!bilgi) {
      kutu.replaceChildren();
      return;
    }
    if (bilgi.tur === "kategorik") {
      kutu.innerHTML = `<p class="efsane-bas">${bilgi.baslik}</p><ul class="efsane-liste">${bilgi.ogeler
        .map((o) => `<li><i style="background:${o.renk}"></i>${o.ad}</li>`)
        .join("")}</ul>`;
      return;
    }
    const renkler = bilgi.renkler.map((r) => `<i style="background:${r}"></i>`).join("");
    kutu.innerHTML = `<p class="efsane-bas">${bilgi.baslik}</p>
      <div class="efsane-serit">${renkler}</div>
      <div class="efsane-uc"><span>${bilgi.alt}</span><span>${bilgi.ust}</span></div>`;
  }

  // ——— ipucu ———
  const ipucuKutu = el("ipucuKutu");
  function ipucuGuncelle(bilgi, olay) {
    if (!bilgi || !olay) {
      ipucuGizle();
      return;
    }
    let tur = "";
    let ad = "";
    let alt = "";
    if (bilgi.tur === "ilan") {
      const ilan = ilanHaritasi.get(bilgi.id);
      if (!ilan) return ipucuGizle();
      tur = "ilan";
      ad = ilan.baslik;
      alt = `${BICIM.format(ilan.fiyat)} ₺ · ${ilan.ilce}/${ilan.il}`;
    } else if (bilgi.tur === "ilce") {
      tur = "ilçe";
      ad = `${bilgi.ilce} · ${bilgi.il}`;
      alt = `${BICIM.format(bilgi.adet)} ilan`;
      el("koordinat").textContent = `${bilgi.ilce} / ${bilgi.il}`;
    } else {
      tur = "il";
      ad = bilgi.il;
      alt = `${BICIM.format(bilgi.adet)} ilan`;
      el("koordinat").textContent = bilgi.il;
    }
    el("ipucuTur").textContent = tur;
    el("ipucuAd").textContent = ad;
    el("ipucuAlt").textContent = alt;
    ipucuKutu.hidden = false;
    const gen = ipucuKutu.offsetWidth || 180;
    const x = Math.min(innerWidth - gen - 12, olay.clientX + 14);
    const y = Math.max(12, olay.clientY - 46);
    ipucuKutu.style.transform = `translate(${x}px, ${y}px)`;
  }
  function ipucuGizle() {
    ipucuKutu.hidden = true;
  }

  // ——— arama ———
  const arama = el("arama");
  let aramaZaman = 0;
  arama.addEventListener("input", () => {
    clearTimeout(aramaZaman);
    aramaZaman = setTimeout(() => {
      aramaMetni = arama.value.trim().toLocaleLowerCase("tr");
      uygula();
    }, 130);
  });
  el("aramaForm").addEventListener("submit", (e) => {
    e.preventDefault();
    aramaMetni = arama.value.trim().toLocaleLowerCase("tr");
    uygula();
  });

  el("filtreTemizle").addEventListener("click", () => {
    filtre.sifirla();
    arama.value = "";
    aramaMetni = "";
    uygula();
  });

  // ——— harita kontrolleri ———
  document.querySelector("[data-yakinlas]").addEventListener("click", () => harita.yakinlastir(1.45));
  document.querySelector("[data-uzaklas]").addEventListener("click", () => harita.yakinlastir(1 / 1.45));
  document.querySelector("[data-turkiye]").addEventListener("click", () => harita.sifirla());

  // ——— korokromatik mod ———
  const modlar = [...document.querySelectorAll("[data-mod]")];
  for (const dugme of modlar) {
    dugme.addEventListener("click", () => {
      for (const d of modlar) d.setAttribute("aria-pressed", d === dugme ? "true" : "false");
      harita.modAyarla(dugme.dataset.mod);
    });
  }

  el("ilanVer").addEventListener("click", () => ekle.ac());

  el("pazarNot").textContent = `${iller.length} il · ${ilceler.length} ilçe · ${BICIM.format(ilanlar.length)} ilan`;

  setTimeout(() => {
    const id = adrestenIlanId();
    if (id) detay.ac(id, { adres: true });
    else if (location.hash === "#/ilan-ekle") ekle.ac();
  }, 320);

  addEventListener("popstate", () => {
    const id = adrestenIlanId();
    if (id) detay.ac(id, { adres: false });
  });

  uygula();
  kirintiCiz();
  perde(1, "hazır");

  window.__kure = {
    harita,
    filtre,
    detay,
    ekle,
    iller,
    ilceler,
    ilanBul: (id) => ilanHaritasi.get(id),
    get ilanlar() {
      return ilanlar;
    },
    get suzulmus() {
      return suzulmus;
    },
    get kendiIlanlar() {
      return kendiIlanlar;
    },
    get secim() {
      return harita.secili();
    },
    modAyarla: (m) => harita.modAyarla(m),
    toast,
    gorselUret,
  };
}

basla().catch((hata) => {
  console.error(hata);
  perde(1, "harita yüklenemedi");
  el("durum").textContent = "harita yüklenemedi";
  setTimeout(() => {
    el("perde").hidden = true;
    toast("harita yüklenemedi", String(hata.message || hata));
  }, 380);
});
