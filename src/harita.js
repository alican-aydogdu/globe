// Türkiye haritası: korokromatik il/ilçe katmanı, yakınlaştıkça kırılım, ilan noktaları.
// Saf SVG + DOM; üçüncü parti harita kütüphanesi yok.

const SVG_NS = "http://www.w3.org/2000/svg";

// Türkiye çerçevesi (harita birimleri = boylam derecesi)
export const CERCEVE = { bati: 25.4, dogu: 45.1, guney: 35.6, kuzey: 42.4 };

function merc(lat) {
  const r = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + r / 2)) * (180 / Math.PI);
}

export function izdusum(lon, lat) {
  return [lon - CERCEVE.bati, merc(CERCEVE.kuzey) - merc(lat)];
}

const HARITA_GEN = CERCEVE.dogu - CERCEVE.bati;
const HARITA_YUK = merc(CERCEVE.kuzey) - merc(CERCEVE.guney);

// ——— renkler ———
export const BOLGE_RENK = {
  Marmara: "#2f6b8a",
  Ege: "#367a63",
  Akdeniz: "#9a6c3c",
  "İç Anadolu": "#8a7a41",
  Karadeniz: "#3d7a80",
  "Doğu Anadolu": "#6a5a8c",
  "Güneydoğu Anadolu": "#8c5547",
};

const YOGUNLUK_RAMP = ["#132433", "#1d3d4d", "#2d5f63", "#6d7a4a", "#b98a3e", "#ffb454"];
const FIYAT_RAMP = ["#12202e", "#1b3a4d", "#26566b", "#3b7d7a", "#63a184", "#a8c98a"];

function karistir(a, b, t) {
  const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const k = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${k(r1, r2)}${k(g1, g2)}${k(b1, b2)}`;
}

function rampaRenk(ramp, t) {
  const yer = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(yer));
  return karistir(ramp[i], ramp[i + 1], yer - i);
}

function yolYaz(halkalar) {
  const parca = [];
  for (const h of halkalar) {
    for (let i = 0; i < h.length; i++) {
      const [x, y] = izdusum(h[i][0], h[i][1]);
      parca.push(`${i === 0 ? "M" : "L"}${x.toFixed(3)} ${y.toFixed(3)}`);
    }
    parca.push("Z");
  }
  return parca.join("");
}

function kutu(halkalar) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const h of halkalar) {
    for (const [lon, lat] of h) {
      const [x, y] = izdusum(lon, lat);
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1, y1, gen: x1 - x0, yuk: y1 - y0 };
}

export function haritaKur({
  kok,
  iller,
  ilceler,
  ilanlarAl,
  onSecim,
  onHover,
  onBosluk,
  onIlceSecim,
  onSeviye,
  onLegend,
  onSecimDegisti,
}) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "tr-harita");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Türkiye il ve ilçe haritası");
  kok.append(svg);

  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "tr-grup");
  svg.append(g);

  const katman = (ad, sinif) => {
    const k = document.createElementNS(SVG_NS, "g");
    k.setAttribute("class", sinif || ad);
    k.dataset.katman = ad;
    g.append(k);
    return k;
  };

  const kIlDolgu = katman("ilDolgu");
  const kIlceDolgu = katman("ilceDolgu");
  const kIlceSinir = katman("ilceSinir");
  const kIlSinir = katman("ilSinir");
  const kEtiketIl = katman("etiketIl");
  const kEtiketIlce = katman("etiketIlce");
  const kNokta = katman("noktalar");

  // ——— iller ———
  const ilDugum = new Map();
  const ilBilgi = new Map();
  for (const il of iller) {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", yolYaz(il.halkalar));
    p.setAttribute("class", "il-yol");
    p.dataset.il = il.ad;
    kIlDolgu.append(p);

    const s = document.createElementNS(SVG_NS, "path");
    s.setAttribute("d", p.getAttribute("d"));
    s.setAttribute("class", "il-sinir");
    s.dataset.il = il.ad;
    kIlSinir.append(s);

    ilDugum.set(il.ad, p);
    ilBilgi.set(il.ad, { ...il, kutu: kutu(il.halkalar) });
  }

  // ——— ilçeler ———
  const ilceDugum = new Map();
  const ilceBilgi = new Map();
  const ilIlceleri = new Map();
  for (const ilce of ilceler) {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", yolYaz(ilce.halkalar));
    p.setAttribute("class", "ilce-yol");
    p.dataset.ilce = `${ilce.il}|${ilce.ad}`;
    kIlceDolgu.append(p);

    const s = document.createElementNS(SVG_NS, "path");
    s.setAttribute("d", p.getAttribute("d"));
    s.setAttribute("class", "ilce-sinir");
    kIlceSinir.append(s);

    const k = kutu(ilce.halkalar);
    ilceDugum.set(`${ilce.il}|${ilce.ad}`, p);
    ilceBilgi.set(`${ilce.il}|${ilce.ad}`, { ...ilce, kutu: k });
    if (!ilIlceleri.has(ilce.il)) ilIlceleri.set(ilce.il, []);
    ilIlceleri.get(ilce.il).push(ilce);
  }

  // ilçelere ilin bölgesini taşı (korokromatik renk için)
  const ilBolgeleri = new Map(iller.map((i) => [i.ad, i.bolge]));
  for (const kayit of ilceBilgi.values()) kayit.bolge = ilBolgeleri.get(kayit.il) || "İç Anadolu";

  // ——— etiketler ———
  const ilEtiket = new Map();
  for (const il of iller) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("class", "h-etiket h-etiket--il");
    t.setAttribute("text-anchor", "middle");
    const [x, y] = izdusum(il.merkez[0], il.merkez[1]);
    t.setAttribute("x", x.toFixed(3));
    t.setAttribute("y", y.toFixed(3));
    t.textContent = il.ad;
    kEtiketIl.append(t);
    ilEtiket.set(il.ad, t);
  }

  const ilceEtiket = new Map();
  for (const ilce of ilceler) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("class", "h-etiket h-etiket--ilce");
    t.setAttribute("text-anchor", "middle");
    const [x, y] = izdusum(ilce.merkez[0], ilce.merkez[1]);
    t.setAttribute("x", x.toFixed(3));
    t.setAttribute("y", y.toFixed(3));
    t.textContent = ilce.ad;
    kEtiketIlce.append(t);
    ilceEtiket.set(`${ilce.il}|${ilce.ad}`, t);
  }

  // ——— görünüm durumu ———
  let G = 1, Y = 1; // tuval boyutu
  let s = 1, tx = 0, ty = 0;
  let tabanS = 1;
  let mod = "bolge";
  let seciliIl = null;
  let seciliIlce = null;
  let animasyon = 0;
  const noktaDugum = new Map();

  function boyut() {
    const r = kok.getBoundingClientRect();
    G = Math.max(320, r.width);
    Y = Math.max(320, r.height);
    svg.setAttribute("viewBox", `0 0 ${G} ${Y}`);
  }

  function tabanHesapla() {
    tabanS = Math.min(G / HARITA_GEN, Y / HARITA_YUK) * 0.94;
  }

  function sinirla() {
    const gen = HARITA_GEN * s;
    const yuk = HARITA_YUK * s;
    const pay = 60;
    if (gen <= G) tx = (G - gen) / 2;
    else tx = Math.min(pay, Math.max(G - gen - pay, tx));
    if (yuk <= Y) ty = (Y - yuk) / 2;
    else ty = Math.min(pay, Math.max(Y - yuk - pay, ty));
  }

  function uygula() {
    g.setAttribute("transform", `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`);
    const oran = s / tabanS;
    svg.style.setProperty("--etiket-boy", `${(10 / s).toFixed(4)}px`);
    svg.style.setProperty("--etiket-boy-ilce", `${(8.5 / s).toFixed(4)}px`);
    noktaOlcek();
    seviyeCiz(oran);
  }

  function noktaOlcek() {
    if (!noktaDugum.size) return;
    const kucuk = (2.6 / s).toFixed(3);
    const buyuk = (4.4 / s).toFixed(3);
    for (const c of noktaDugum.values()) c.setAttribute("r", c.dataset.secilmis === "1" ? buyuk : kucuk);
  }

  let sonOran = 0;
  function seviyeCiz(oran) {
    const seviye = oran < 2.1 ? 1 : oran < 6.2 ? 2 : 3;
    if (seviye !== seviyeCiz.son) {
      const onceki = seviyeCiz.son || 1;
      svg.dataset.seviye = String(seviye);
      seviyeCiz.son = seviye;
      kIlceDolgu.style.display = seviye >= 2 ? "" : "none";
      kIlceSinir.style.display = seviye >= 2 ? "" : "none";
      kEtiketIlce.style.display = seviye >= 3 ? "" : "none";
      if (seviye >= 2 && sonDeger && onceki < 2) ilceBoya(sonDeger);
      noktalariCiz();
      onSeviye?.(seviye);
    }
    // il etiketleri: ülke görünümünde de okunur, ama küçükte seyrelt
    kEtiketIl.style.display = oran > 1.35 ? "" : "none";
    sonOran = oran;
  }

  // ——— değerler ———
  function degerler() {
    const ilanlar = ilanlarAl() || [];
    const ilAdet = new Map();
    const ilFiyat = new Map();
    const ilceAdet = new Map();
    const ilceFiyat = new Map();
    for (const i of ilanlar) {
      if (!i.il) continue;
      ilAdet.set(i.il, (ilAdet.get(i.il) || 0) + 1);
      ilFiyat.set(i.il, (ilFiyat.get(i.il) || 0) + i.fiyat);
      const k = `${i.il}|${i.ilce}`;
      ilceAdet.set(k, (ilceAdet.get(k) || 0) + 1);
      ilceFiyat.set(k, (ilceFiyat.get(k) || 0) + i.fiyat);
    }
    const adetMax = Math.max(1, ...ilAdet.values());
    const fiyatlar = [...ilFiyat.entries()].map(([ad, t]) => t / (ilAdet.get(ad) || 1));
    const fMin = Math.min(...(fiyatlar.length ? fiyatlar : [0]));
    const fMax = Math.max(...(fiyatlar.length ? fiyatlar : [1]));
    const ilceAdetMax = Math.max(1, ...ilceAdet.values());
    return { ilAdet, ilFiyat, ilceAdet, ilceFiyat, adetMax, fMin, fMax, ilceAdetMax, toplam: ilanlar.length };
  }

  function renkIl(il, d) {
    if (mod === "bolge") return BOLGE_RENK[il.bolge] || "#2f6b8a";
    if (mod === "yogunluk") {
      const a = d.ilAdet.get(il.ad) || 0;
      return a === 0 ? "#101d29" : rampaRenk(YOGUNLUK_RAMP, Math.pow(a / d.adetMax, 0.55));
    }
    const a = d.ilAdet.get(il.ad) || 0;
    if (!a) return "#101d29";
    const ort = d.ilFiyat.get(il.ad) / a;
    const t = (ort - d.fMin) / Math.max(1, d.fMax - d.fMin);
    return rampaRenk(FIYAT_RAMP, t);
  }

  function renkIlce(ilce, d) {
    const anahtar = `${ilce.il}|${ilce.ad}`;
    if (mod === "bolge") {
      const temel = BOLGE_RENK[ilce.bolge] || "#2f6b8a";
      return karistir(temel, "#0a1520", 0.45);
    }
    if (mod === "yogunluk") {
      const a = d.ilceAdet.get(anahtar) || 0;
      return a === 0 ? "#0c1824" : rampaRenk(YOGUNLUK_RAMP, Math.pow(a / d.ilceAdetMax, 0.5));
    }
    const a = d.ilceAdet.get(anahtar) || 0;
    if (!a) return "#0c1824";
    const ort = d.ilceFiyat.get(anahtar) / a;
    return rampaRenk(FIYAT_RAMP, (ort - d.fMin) / Math.max(1, d.fMax - d.fMin));
  }

  let sonDeger = null;

  function ilBoya(d) {
    for (const il of iller) {
      const p = ilDugum.get(il.ad);
      const renk = renkIl(il, d);
      p.setAttribute("fill", renk);
      p.dataset.renk = renk;
      const adet = d.ilAdet.get(il.ad) || 0;
      p.dataset.adet = String(adet);
      ilEtiket.get(il.ad)?.setAttribute("data-bos", adet ? "0" : "1");
    }
  }

  function ilceBoya(d) {
    for (const ilce of ilceler) {
      const anahtar = `${ilce.il}|${ilce.ad}`;
      const p = ilceDugum.get(anahtar);
      const renk = renkIlce(ilceBilgi.get(anahtar), d);
      p.setAttribute("fill", renk);
      const adet = d.ilceAdet.get(anahtar) || 0;
      p.dataset.adet = String(adet);
      ilceEtiket.get(anahtar)?.setAttribute("data-bos", adet ? "0" : "1");
    }
  }

  function boya() {
    const d = degerler();
    sonDeger = d;
    ilBoya(d);
    if (Number(svg.dataset.seviye || 1) >= 2) ilceBoya(d);
    svg.dataset.toplam = String(d.toplam);
    efsane(d);
    noktalariCiz();
    return d;
  }

  function efsane(d) {
    if (!onLegend) return;
    if (mod === "bolge") {
      onLegend({
        baslik: "Coğrafi bölge",
        tur: "kategorik",
        ogeler: Object.entries(BOLGE_RENK).map(([ad, renk]) => ({ ad, renk })),
      });
    } else if (mod === "yogunluk") {
      onLegend({
        baslik: "İlan yoğunluğu",
        tur: "kademeli",
        renkler: YOGUNLUK_RAMP,
        alt: "az",
        ust: `${d.adetMax} ilan`,
      });
    } else {
      const bicim = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
      onLegend({
        baslik: "Ortalama fiyat",
        tur: "kademeli",
        renkler: FIYAT_RAMP,
        alt: `${bicim.format(Math.round(d.fMin))} ₺`,
        ust: `${bicim.format(Math.round(d.fMax))} ₺`,
      });
    }
  }

  // ——— ilan noktaları ———
  function gorunenKutu() {
    return { x0: -tx / s, y0: -ty / s, x1: (G - tx) / s, y1: (Y - ty) / s };
  }

  function noktalariCiz() {
    const seviye = Number(svg.dataset.seviye || 1);
    for (const c of noktaDugum.values()) c.remove();
    noktaDugum.clear();
    if (seviye < 2) return;

    const gor = gorunenKutu();
    const ilanlar = (ilanlarAl() || []).filter((i) => {
      if (seciliIl && i.il !== seciliIl) return false;
      if (seciliIlce && i.ilce !== seciliIlce) return false;
      const [x, y] = izdusum(i.lon, i.lat);
      return x >= gor.x0 - 1 && x <= gor.x1 + 1 && y >= gor.y0 - 1 && y <= gor.y1 + 1;
    });
    const sinir = seviye >= 3 ? 700 : 420;
    for (const ilan of ilanlar.slice(0, sinir)) {
      const [x, y] = izdusum(ilan.lon, ilan.lat);
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", x.toFixed(3));
      c.setAttribute("cy", y.toFixed(3));
      const yari = (ilan.id === vurguluId ? 4.4 : 2.6) / s;
      c.setAttribute("r", yari.toFixed(3));
      c.setAttribute("class", `nokta${ilan.benim ? " nokta--benim" : ""}`);
      c.dataset.ilan = ilan.id;
      c.dataset.secilmis = ilan.id === vurguluId ? "1" : "0";
      kNokta.append(c);
      noktaDugum.set(ilan.id, c);
    }
  }

  let vurguluId = null;

  function noktaVurgula(id) {
    vurguluId = id;
    for (const [anahtar, c] of noktaDugum) {
      c.dataset.secili = anahtar === id ? "1" : "0";
      c.dataset.secilmis = anahtar === id ? "1" : "0";
    }
    noktaOlcek();
  }

  // ——— etkileşim ———
  let surukle = null;
  let hareket = false;
  let basilan = null;

  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    basilan = { x: e.clientX, y: e.clientY, hedef: e.target };
    if (e.target.closest(".nokta")) return; // nokta tıklaması: sürükleme yok
    durdur();
    surukle = { x: e.clientX, y: e.clientY, tx, ty };
    hareket = false;
    svg.setPointerCapture(e.pointerId);
    svg.classList.add("tutuluyor");
  });

  svg.addEventListener("pointermove", (e) => {
    if (!surukle) return;
    const dx = e.clientX - surukle.x;
    const dy = e.clientY - surukle.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) hareket = true;
    tx = surukle.tx + dx;
    ty = surukle.ty + dy;
    sinirla();
    uygula();
  });

  const birak = (e) => {
    if (!surukle) return;
    surukle = null;
    svg.classList.remove("tutuluyor");
    try {
      svg.releasePointerCapture(e.pointerId);
    } catch {
      /* yoksay */
    }
    if (hareket) noktalariCiz();
  };
  svg.addEventListener("pointerup", birak);
  svg.addEventListener("pointercancel", birak);

  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      durdur();
      const r = svg.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const k = e.deltaY < 0 ? 1.16 : 1 / 1.16;
      yakinlastir(px, py, k);
    },
    { passive: false }
  );

  function yakinlastir(px, py, k, sessiz) {
    const yeni = Math.max(tabanS * 0.85, Math.min(tabanS * 34, s * k));
    const gercek = yeni / s;
    tx = px - (px - tx) * gercek;
    ty = py - (py - ty) * gercek;
    s = yeni;
    sinirla();
    uygula();
    if (sessiz) noktalariCiz();
  }

  function durdur() {
    if (animasyon) cancelAnimationFrame(animasyon);
    animasyon = 0;
  }

  function ucur(hedef) {
    durdur();
    const bas = { s, tx, ty, t: performance.now() };
    const sure = 460;
    const ilerle = (simdi) => {
      const t = Math.min(1, (simdi - bas.t) / sure);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      s = bas.s + (hedef.s - bas.s) * e;
      tx = bas.tx + (hedef.tx - bas.tx) * e;
      ty = bas.ty + (hedef.ty - bas.ty) * e;
      uygula();
      if (t < 1) animasyon = requestAnimationFrame(ilerle);
      else {
        animasyon = 0;
        noktalariCiz();
      }
    };
    animasyon = requestAnimationFrame(ilerle);
  }

  function kutuyaGit(k, dolgu = 0.42) {
    const oranGen = G / Math.max(0.0001, k.gen);
    const oranYuk = Y / Math.max(0.0001, k.yuk);
    const hedefS = Math.min(oranGen, oranYuk) * (1 - dolgu);
    const cx = (k.x0 + k.x1) / 2;
    const cy = (k.y0 + k.y1) / 2;
    ucur({
      s: Math.max(tabanS * 0.9, Math.min(tabanS * 32, hedefS)),
      tx: G / 2 - cx * Math.max(tabanS * 0.9, Math.min(tabanS * 32, hedefS)),
      ty: Y / 2 - cy * Math.max(tabanS * 0.9, Math.min(tabanS * 32, hedefS)),
    });
  }

  // tıklama / vurgu
  svg.addEventListener("pointerup", (e) => {
    if (!basilan) return;
    const mesafe = Math.abs(e.clientX - basilan.x) + Math.abs(e.clientY - basilan.y);
    const hedef = basilan.hedef; // pointer yakalama yüzünden e.target svg olabilir
    basilan = null;
    if (mesafe > 5 || !hedef || hedef === svg) {
      if (mesafe <= 5 && hedef === svg) onBosluk?.();
      return;
    }
    const nokta = hedef.closest(".nokta");
    if (nokta) {
      noktaVurgula(nokta.dataset.ilan);
      onSecim?.(nokta.dataset.ilan);
      return;
    }
    const ilceYol = hedef.closest(".ilce-yol");
    const ilYol = hedef.closest(".il-yol");
    if (ilceYol && svg.dataset.seviye !== "1") {
      const [il, ilce] = ilceYol.dataset.ilce.split("|");
      ilceSec(il, ilce, true);
      return;
    }
    if (ilYol) {
      ilSec(ilYol.dataset.il, true);
      return;
    }
    onBosluk?.();
  });

  svg.addEventListener("pointerover", (e) => {
    const hedef = e.target.closest(".il-yol, .ilce-yol, .nokta");
    if (!hedef) {
      onHover?.(null, e);
      return;
    }
    if (hedef.classList.contains("nokta")) {
      onHover?.({ tur: "ilan", id: hedef.dataset.ilan }, e);
      return;
    }
    if (hedef.classList.contains("ilce-yol") && svg.dataset.seviye !== "1") {
      const [il, ilce] = hedef.dataset.ilce.split("|");
      onHover?.({ tur: "ilce", il, ilce, adet: Number(hedef.dataset.adet || 0) }, e);
      return;
    }
    onHover?.({ tur: "il", il: hedef.dataset.il, adet: Number(hedef.dataset.adet || 0) }, e);
  });

  svg.addEventListener("pointerleave", () => onHover?.(null));

  svg.addEventListener("dblclick", (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    yakinlastir(e.clientX - r.left, e.clientY - r.top, 1.7, true);
  });

  // klavye
  svg.setAttribute("tabindex", "0");
  svg.addEventListener("keydown", (e) => {
    const adim = 80;
    if (e.key === "+" || e.key === "=") yakinlastir(G / 2, Y / 2, 1.3, true);
    else if (e.key === "-") yakinlastir(G / 2, Y / 2, 1 / 1.3, true);
    else if (e.key === "ArrowLeft") { tx += adim; sinirla(); uygula(); }
    else if (e.key === "ArrowRight") { tx -= adim; sinirla(); uygula(); }
    else if (e.key === "ArrowUp") { ty += adim; sinirla(); uygula(); }
    else if (e.key === "ArrowDown") { ty -= adim; sinirla(); uygula(); }
    else if (e.key === "Escape") api.sifirla();
    else return;
    e.preventDefault();
    noktalariCiz();
  });

  // ——— seçim ———
  function boyaSecim() {
    for (const [ad, p] of ilDugum) p.dataset.secili = ad === seciliIl ? "1" : "0";
    for (const [ad, p] of ilceDugum) p.dataset.secili = ad === `${seciliIl}|${seciliIlce}` ? "1" : "0";
  }

  function ilSec(il, git) {
    seciliIl = seciliIl === il ? null : il;
    seciliIlce = null;
    boyaSecim();
    if (git && seciliIl) {
      const b = ilBilgi.get(seciliIl)?.kutu;
      if (b) kutuyaGit(b, 0.55);
    }
    if (!seciliIl && git) api.sifirla();
    noktalariCiz();
    onSeviye?.(Number(svg.dataset.seviye || 1));
    onSecimDegisti?.({ il: seciliIl, ilce: seciliIlce });
  }

  function ilceSec(il, ilce, git) {
    seciliIl = il;
    seciliIlce = seciliIlce === ilce ? null : ilce;
    boyaSecim();
    if (git && seciliIlce) {
      const b = ilceBilgi.get(`${il}|${ilce}`)?.kutu;
      if (b) kutuyaGit(b, 0.35);
    }
    noktalariCiz();
    onSecimDegisti?.({ il: seciliIl, ilce: seciliIlce });
  }

  const api = {
    svg,
    boya() {
      return boya();
    },
    modAyarla(yeni) {
      mod = yeni;
      boya();
    },
    mod() {
      return mod;
    },
    seviye() {
      return Number(svg.dataset.seviye || 1);
    },
    secili() {
      return { il: seciliIl, ilce: seciliIlce };
    },
    ilSec(il) {
      seciliIl = il;
      seciliIlce = null;
      boyaSecim();
      onSecimDegisti?.({ il: seciliIl, ilce: null });
      if (il) {
        const b = ilBilgi.get(il)?.kutu;
        if (b) kutuyaGit(b, 0.55);
      }
      noktalariCiz();
    },
    ilceSec(il, ilce) {
      // dışarıdan çağrıda aç/kapa değil, doğrudan seç
      seciliIl = il;
      seciliIlce = ilce;
      boyaSecim();
      const b = ilceBilgi.get(`${il}|${ilce}`)?.kutu;
      if (b) kutuyaGit(b, 0.35);
      noktalariCiz();
      onSecimDegisti?.({ il: seciliIl, ilce: seciliIlce });
    },
    odakla(il, ilce) {
      if (ilce) {
        const b = ilceBilgi.get(`${il}|${ilce}`)?.kutu;
        if (b) return kutuyaGit(b, 0.35);
      }
      const b = ilBilgi.get(il)?.kutu;
      if (b) kutuyaGit(b, 0.55);
    },
    sifirla() {
      seciliIl = null;
      seciliIlce = null;
      boyaSecim();
      onSecimDegisti?.({ il: null, ilce: null });
      kutuyaGit({ x0: 0, y0: 0, x1: HARITA_GEN, y1: HARITA_YUK, gen: HARITA_GEN, yuk: HARITA_YUK }, 0.02);
      noktalariCiz();
    },
    yakinlastir(k, sessiz) {
      yakinlastir(G / 2, Y / 2, k, sessiz !== false);
    },
    noktalariYenile: noktalariCiz,
    noktaVurgula,
    yenidenBoyutlandir() {
      boyut();
      tabanHesapla();
      s = Math.max(tabanS * 0.85, Math.min(tabanS * 34, s));
      sinirla();
      uygula();
      noktalariCiz();
    },
    ilanBul: (id) => (ilanlarAl() || []).find((i) => i.id === id),
    ilBilgi,
    ilceBilgi,
    buTiklandi: () => hareket,
  };

  boyut();
  tabanHesapla();
  s = tabanS;
  tx = (G - HARITA_GEN * s) / 2;
  ty = (Y - HARITA_YUK * s) / 2;
  svg.dataset.seviye = "1";
  uygula();
  boya();

  const gozlemci = new ResizeObserver(() => api.yenidenBoyutlandir());
  gozlemci.observe(kok);

  return api;
}
