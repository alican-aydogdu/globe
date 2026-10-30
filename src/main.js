import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";
import {
  ulkeGeometrisi,
  ulkeMeshYap,
  sehirGeometrisi,
  sehirMalzeme,
  yildizAlani,
  atmosfer,
  koordinatVektor,
  kimlikHaritasi,
} from "./sembol.js";
import { ilanlariUret, SEHIR_LISTESI, KATEGORILER, DURUM_LISTESI } from "./ilanlar.js";
import { pazarKatmani } from "./pazaryeri.js";
import { filtreKur } from "./filtre.js";
import { detayKur, adrestenIlanId } from "./detay.js";
import { ekleKur } from "./ekle.js";
import { yerelIlanlariOku, yerelIlanEkle, yerelIlanSil } from "./depo.js";
import { gorselUret } from "./gorsel.js";

const YARICAP = 1;
const taban = import.meta.env.BASE_URL;

const sahneKabi = document.querySelector("#sahne");
const durum = document.querySelector("#durum");
const koordinat = document.querySelector("#koordinat");
const ipucuKutu = document.querySelector("#ipucuKutu");
const ipucuTur = document.querySelector("#ipucuTur");
const ipucuAd = document.querySelector("#ipucuAd");
const ipucuAlt = document.querySelector("#ipucuAlt");
const perde = document.querySelector("#perde");
const cubuk = document.querySelector("#cubuk");
const perdeYazi = document.querySelector("#perdeYazi");
const azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderci;
try {
  renderci = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (hata) {
  perdeYazi.textContent = "webgl açılamadı";
  throw hata;
}
const dpr = Math.min(devicePixelRatio, 1.75);
renderci.setPixelRatio(dpr);
renderci.setSize(innerWidth, innerHeight);
renderci.outputColorSpace = THREE.SRGBColorSpace;
sahneKabi.appendChild(renderci.domElement);

const sahne = new THREE.Scene();
sahne.background = new THREE.Color("#04070d");

const kamera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.0015, 600);
const BASLANGIC = koordinatVektor(33.5, 38.5, 2.95);
kamera.position.copy(BASLANGIC);

const kontroller = new OrbitControls(kamera, renderci.domElement);
kontroller.enableDamping = true;
kontroller.dampingFactor = 0.06;
kontroller.rotateSpeed = 0.45;
kontroller.zoomSpeed = 0.9;
kontroller.minDistance = YARICAP * 1.004;
kontroller.maxDistance = 9;
kontroller.enablePan = false;
kontroller.autoRotate = !azHareket;
kontroller.autoRotateSpeed = 0.26;

// ——— veri ———
cubuk.style.width = "12%";
const [ulkeler, sehirler] = await Promise.all([
  fetch(`${taban}veri/ulkeler.json`).then((r) => r.json()),
  fetch(`${taban}veri/sehirler.json`).then((r) => r.json()),
]);
cubuk.style.width = "55%";

// şehirlerin ülke adını Türkçeye çevir (Natural Earth: İngilizce)
const ulkeCeviri = new Map();
for (const u of ulkeler) if (u.e) ulkeCeviri.set(u.e, u.n);
for (const s of sehirler) if (ulkeCeviri.has(s[4])) s[4] = ulkeCeviri.get(s[4]);

const kimlik = kimlikHaritasi(ulkeler, 2048);

// ——— okyanus gövdesi ———
const okyanus = new THREE.Mesh(
  new THREE.SphereGeometry(YARICAP, 128, 96),
  new THREE.MeshBasicMaterial({ color: "#07121d" })
);
sahne.add(okyanus);

// ——— ülkeler + sınırlar ———
const { mesh: ulkeMesh, sinirCizgi, malzeme: ulkeMalzeme } = ulkeMeshYap(ulkeGeometrisi(ulkeler));
sahne.add(ulkeMesh, sinirCizgi);
cubuk.style.width = "78%";

// ——— şehirler ———
const sehirGeo = sehirGeometrisi(sehirler);
const sehirMat = sehirMalzeme();
const sehirNokta = new THREE.Points(sehirGeo, sehirMat);
sehirNokta.frustumCulled = false;
sahne.add(sehirNokta);
sehirMat.uniforms.uBoyut.value = 4.2 * dpr;

const sehirKonum = [];
for (let i = 0; i < sehirler.length; i++) {
  sehirKonum.push(
    new THREE.Vector3(
      sehirGeo.attributes.position.getX(i),
      sehirGeo.attributes.position.getY(i),
      sehirGeo.attributes.position.getZ(i)
    )
  );
}

// ——— ilan katmanı ———
const { ilanlar: uzakIlanlar } = ilanlariUret();
let kendiIlanlar = yerelIlanlariOku().map((i) => ({
  ...i,
  benim: true,
  fotolar: Array.isArray(i.fotolar) ? i.fotolar : [],
}));
let ilanlar = [...kendiIlanlar, ...uzakIlanlar];
let ilanHaritasi = new Map(ilanlar.map((i) => [i.id, i]));

const pazar = pazarKatmani();
pazar.malzeme.uniforms.uBoyut.value = 8.5 * dpr;
sahne.add(pazar.nokta);

const aramaSayi = document.querySelector("#aramaSayi");
const pazarNot = document.querySelector("#pazarNot");
const aramaGirdi = document.querySelector("#arama");
const kart = document.querySelector("#ilanKart");
const kartSehir = document.querySelector("#kartSehir");
const kartAdet = document.querySelector("#kartAdet");
const kartListe = document.querySelector("#kartListe");
const kartAlt = document.querySelector("#kartAlt");
const filtreTemizle = document.querySelector("#filtreTemizle");
const filtreDurum = document.querySelector("#filtreDurum");
const detayKok = document.querySelector("#detay");
const ekleKok = document.querySelector("#ekle");
const toastKutu = document.querySelector("#toast");
const toastBaslik = document.querySelector("#toastBaslik");
const toastAlt = document.querySelector("#toastAlt");

const fiyatBicim = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
let aramaMetni = "";
let kartIli = null;
let suzgec = () => true;

// ——— bildirim ———
let toastZaman = 0;
function toast(baslik, alt = "") {
  toastBaslik.textContent = baslik;
  toastAlt.textContent = alt;
  toastAlt.hidden = !alt;
  toastKutu.hidden = false;
  requestAnimationFrame(() => (toastKutu.dataset.acik = "1"));
  clearTimeout(toastZaman);
  toastZaman = setTimeout(() => {
    delete toastKutu.dataset.acik;
    setTimeout(() => {
      if (!toastKutu.dataset.acik) toastKutu.hidden = true;
    }, 260);
  }, 3200);
  window.__sonToast = { baslik, alt, zaman: Date.now() };
}

// ——— kamera uçuşu ———
let ucus = null;
let ucusZaman = 0;

function ucusBitir() {
  if (!ucus) return;
  kamera.position.copy(ucus.hedef);
  ucus = null;
  kontroller.enabled = true;
  sonEtkilesim = performance.now();
}

function ucusYap(lon, lat, mesafe = 1.62) {
  ucus = {
    bas: performance.now(),
    sure: 1150,
    baslangicKonum: kamera.position.clone(),
    hedef: koordinatVektor(lon, lat, mesafe),
  };
  kontroller.autoRotate = false;
  kontroller.enabled = false;
  // sekme arka plana düşerse animasyon yarıda kalmasın
  clearTimeout(ucusZaman);
  ucusZaman = setTimeout(ucusBitir, 1150 + 400);
}

// ——— filtreler ———
const filtre = filtreKur({
  kategoriKok: document.querySelector("#filtreKategoriler"),
  fiyatKok: document.querySelector("#filtreFiyat"),
  ilanlar,
  onChange: () => {
    filtreTemizle.hidden = !filtre.aktifMi();
    filtreDurum.textContent = filtre.aktifMi()
      ? `${filtre.durum.secili.size ? [...filtre.durum.secili].join(", ") : "tüm kategoriler"} · ${fiyatBicim.format(filtre.durum.min)}–${fiyatBicim.format(filtre.durum.max)} ₺`
      : "tüm ilanlar";
    ilanlariGrupla();
  },
});
suzgec = (ilan) => filtre.suz(ilan);
filtreTemizle.addEventListener("click", () => filtre.sifirla());

// ——— detay sayfası ———
const detay = detayKur({
  kok: detayKok,
  ilanBul: (id) => ilanHaritasi.get(id),
  benzerBul: (ilan, adet) => {
    const ayniSehir = [];
    const ayniKategori = [];
    for (const i of ilanlar) {
      if (i.id === ilan.id) continue;
      if (i.kategori !== ilan.kategori) continue;
      (i.sehir === ilan.sehir ? ayniSehir : ayniKategori).push(i);
    }
    return [...ayniSehir, ...ayniKategori].slice(0, adet);
  },
  haritadaGoster: (ilan) => {
    ucusYap(ilan.lon, ilan.lat, 1.42);
    toast("haritada", `${ilan.sehir} · ${ilan.baslik}`);
  },
  toast,
  onSil: (id) => {
    yerelIlanSil(id);
    kendiIlanlar = kendiIlanlar.filter((i) => i.id !== id);
    veriyiYenile();
  },
});

// ——— ilan ekleme ———
const ekle = ekleKur({
  kok: ekleKok,
  sehirler: SEHIR_LISTESI,
  kategoriler: KATEGORILER,
  durumlar: DURUM_LISTESI,
  varsayilanSatici: "Ali Can",
  onEkle: (ilan) => {
    yerelIlanEkle(ilan);
    kendiIlanlar = [{ ...ilan, benim: true }, ...kendiIlanlar];
    veriyiYenile();
    ucusYap(ilan.lon, ilan.lat, 1.5);
    setTimeout(() => detay.ac(ilan.id, { adres: true }), 900);
  },
  toast,
});

document.querySelector("#ilanVer").addEventListener("click", () => ekle.ac());

function veriyiYenile() {
  ilanlar = [...kendiIlanlar, ...uzakIlanlar];
  ilanHaritasi = new Map(ilanlar.map((i) => [i.id, i]));
  ilanlariGrupla();
}

function ilanlariGrupla() {
  const q = aramaMetni.trim().toLocaleLowerCase("tr");
  const suzulen = ilanlar.filter((i) => {
    if (!suzgec(i)) return false;
    if (!q) return true;
    return `${i.baslik} ${i.kategori} ${i.sehir} ${i.satici}`
      .toLocaleLowerCase("tr")
      .includes(q);
  });

  const gruplar = new Map();
  for (const ilan of suzulen) {
    let g = gruplar.get(ilan.sehir);
    if (!g) {
      g = { sehir: ilan.sehir, lat: 0, lon: 0, ilanlar: [] };
      gruplar.set(ilan.sehir, g);
    }
    g.ilanlar.push(ilan);
    g.lat += ilan.lat;
    g.lon += ilan.lon;
  }

  const iller = [...gruplar.values()];
  for (const g of iller) {
    g.lat /= g.ilanlar.length;
    g.lon /= g.ilanlar.length;
    g.ilanlar.sort((a, b) => (b.benim ? 1 : 0) - (a.benim ? 1 : 0) || a.yas - b.yas);
    g.benim = g.ilanlar.some((i) => i.benim);
  }
  iller.sort((a, b) => b.ilanlar.length - a.ilanlar.length);

  pazar.guncelle(iller);
  aramaSayi.textContent = `${fiyatBicim.format(suzulen.length)} ilan`;
  pazarNot.textContent = q
    ? `“${aramaMetni.trim()}” · ${iller.length} şehir`
    : `${fiyatBicim.format(suzulen.length)} ilan · ${iller.length} şehir`;
  durum.textContent = suzulen.length ? `${fiyatBicim.format(suzulen.length)} ilan` : "sonuç yok";
  durum.dataset.hazir = suzulen.length ? "1" : "0";
  kartKapat_();
  return iller;
}

function kartKapat_() {
  kart.hidden = true;
  kartIli = null;
  pazar.malzeme.uniforms.uSecili.value = -1;
}

function kartAc(i, x, y) {
  const il = pazar.iller[i];
  if (!il) return;
  kartIli = i;
  pazar.malzeme.uniforms.uSecili.value = i;

  kartSehir.textContent = il.sehir;
  kartAdet.textContent = `${fiyatBicim.format(il.ilanlar.length)} ilan`;
  kartListe.replaceChildren();

  const SINIR = 40;
  for (const ilan of il.ilanlar.slice(0, SINIR)) {
    const li = document.createElement("li");
    li.className = "kart-satir";
    li.dataset.benim = ilan.benim ? "1" : "0";

    const dugme = document.createElement("button");
    dugme.type = "button";
    dugme.className = "kart-dugme";
    dugme.innerHTML = `
      <img class="kart-foto" alt="" loading="lazy" />
      <span class="kart-metin">
        <span class="kart-baslik"></span>
        <span class="kart-meta"></span>
      </span>
      <span class="kart-fiyat"></span>`;

    dugme.querySelector(".kart-foto").src = gorselUret(ilan, 0);
    dugme.querySelector(".kart-baslik").textContent = ilan.baslik;
    dugme.querySelector(".kart-meta").textContent = `${ilan.satici} · ${ilan.durum} · ${ilan.benim ? "senin ilanın" : `IL-${ilan.id.split("-").pop()}`}`;
    dugme.querySelector(".kart-fiyat").textContent = `${fiyatBicim.format(ilan.fiyat)} ₺`;
    dugme.addEventListener("click", () => {
      kartKapat_();
      detay.ac(ilan.id, { adres: true });
    });

    li.appendChild(dugme);
    kartListe.appendChild(li);
  }

  const kalan = il.ilanlar.length - Math.min(SINIR, il.ilanlar.length);
  kartAlt.textContent = kalan > 0 ? `+${fiyatBicim.format(kalan)} ilan daha var` : "";

  kart.hidden = false;
  const gen = kart.offsetWidth;
  const sol = Math.max(12, Math.min(x - gen / 2, innerWidth - gen - 12));
  const ust = Math.max(12, Math.min(y - 18, innerHeight - kart.offsetHeight - 12));
  kart.style.left = `${sol}px`;
  kart.style.top = `${ust}px`;
}

document.querySelector("#kartKapat").addEventListener("click", kartKapat_);

let aramaZaman = 0;
aramaGirdi.addEventListener("input", () => {
  clearTimeout(aramaZaman);
  aramaZaman = setTimeout(() => {
    aramaMetni = aramaGirdi.value;
    ilanlariGrupla();
  }, 120);
});
document.querySelector("#aramaForm").addEventListener("submit", (e) => {
  e.preventDefault();
  aramaMetni = aramaGirdi.value;
  ilanlariGrupla();
});

ilanlariGrupla();

// doğrudan bağlantı: #/ilan/IL-00042 · #/ilan-ekle
const adrestekiIlan = adrestenIlanId();
if (adrestekiIlan) {
  setTimeout(() => {
    if (!detay.ac(adrestekiIlan)) toast("ilan bulunamadı", adrestekiIlan);
  }, 420);
} else if (location.hash === "#/ilan-ekle") {
  setTimeout(() => ekle.ac(), 420);
}

sahne.add(atmosfer(YARICAP));
const yildizlar = yildizAlani();
sahne.add(yildizlar);
cubuk.style.width = "92%";

// ——— yükleme perdesi ———
let hazirMi = false;
function hazir() {
  if (hazirMi) return;
  hazirMi = true;
  durum.textContent = `${fiyatBicim.format(ilanlar.length)} ilan`;
  durum.dataset.hazir = "1";
  cubuk.style.width = "100%";
  perde.hidden = true;
  setTimeout(() => {
    if (perde.hidden) perde.style.display = "none";
  }, 600);
}
setTimeout(hazir, 150);

// ——— şehir ölçeği: yükseklik arttıkça daha az şehir ———
const ESIKLER = [
  [16000, 3e6],
  [7000, 1e6],
  [2500, 3e5],
  [800, 8e4],
  [200, 2e4],
  [0, 5e3],
];
function nufusEsigi(dist) {
  const alt = (dist - 1) * 6371;
  for (const [altEsik, nufus] of ESIKLER) if (alt > altEsik) return nufus;
  return 5e3;
}
let sonEsik = 0;
function esikGuncelle() {
  const esik = nufusEsigi(kontroller.getDistance());
  if (esik !== sonEsik) {
    sonEsik = esik;
    sehirMat.uniforms.uEsik.value = esik;
  }
}
esikGuncelle();
kontroller.addEventListener('change', esikGuncelle);

// ——— hover ———
const isin = new THREE.Raycaster();
const fare = new THREE.Vector2();
let fareX = 0;
let fareY = 0;
let icerde = false;
let seciliSehir = -1;

// ışın ↔ birim küre (analitik, raycast yok)
function isinNoktasi() {
  isin.setFromCamera(fare, kamera);
  const o = isin.ray.origin;
  const d = isin.ray.direction;
  const b = o.dot(d);
  const c = o.dot(o) - 1;
  const disk = b * b - c;
  if (disk < 0) return null;
  const t = -b - Math.sqrt(disk);
  if (t < 0) return null;
  return o.clone().addScaledVector(d, t);
}

function noktadanKoordinat(p) {
  const lat = 90 - (Math.acos(THREE.MathUtils.clamp(p.y / p.length(), -1, 1)) * 180) / Math.PI;
  let phi = Math.atan2(p.z, -p.x);
  if (phi < 0) phi += Math.PI * 2;
  let lon = -180 + (phi * 180) / Math.PI;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}

let sonNokta = null;
let sonKoordinat = null;
function ulkeBul() {
  if (!sonKoordinat) return -1;
  return kimlik.ulkeBul(sonKoordinat.lon, sonKoordinat.lat);
}

const gecici = new THREE.Vector3();
function sehirBul() {
  const sinir = 10;
  let en = sinir * sinir;
  let bulunan = -1;
  const kameraYon = gecici.copy(kamera.position).normalize().clone();
  const esik = 1 / kamera.position.length();

  for (let i = 0; i < sehirKonum.length; i++) {
    if (sehirler[i][2] < sonEsik) continue;
    const p = sehirKonum[i];
    if (p.x * kameraYon.x + p.y * kameraYon.y + p.z * kameraYon.z < esik) continue;
    const n = p.clone().project(kamera);
    if (n.z > 1) continue;
    const px = ((n.x + 1) / 2) * innerWidth;
    const py = ((1 - n.y) / 2) * innerHeight;
    const d2 = (px - fareX) ** 2 + (py - fareY) ** 2;
    if (d2 < en) {
      en = d2;
      bulunan = i;
    }
  }
  return bulunan;
}

function bicimNufus(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",")}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}B`;
  return `${n}`;
}

function ipucuGoster() {
  ipucuKutu.style.left = `${fareX}px`;
  ipucuKutu.style.top = `${fareY}px`;
  if (ipucuKutu.hidden) {
    ipucuKutu.hidden = false;
    requestAnimationFrame(() => (ipucuKutu.dataset.gorunur = "1"));
  }
}

function ipucuGizle() {
  ipucuKutu.dataset.gorunur = "0";
  ipucuKutu.hidden = true;
}

function secimiTemizle() {
  ipucuGizle();
  if (kartIli === null) pazar.malzeme.uniforms.uSecili.value = -1;
  durum.textContent = `${fiyatBicim.format(pazar.iller.reduce((t, il) => t + il.ilanlar.length, 0))} ilan`;
  if (ulkeMalzeme.userData.shader) ulkeMalzeme.userData.shader.uniforms.uSecili.value = -1;
  seciliSehir = -1;
}

function tarama() {
  if (!icerde) return;

  sonNokta = isinNoktasi();
  sonKoordinat = sonNokta ? noktadanKoordinat(sonNokta) : null;
  if (!sonKoordinat) {
    secimiTemizle();
    return;
  }

  const ilanNokta = pazar.ekrandaBul(kamera, fareX, fareY, innerWidth, innerHeight, 20);
  if (ilanNokta !== -1) {
    const il = pazar.iller[ilanNokta];
    ipucuTur.textContent = "ilan";
    ipucuAd.textContent = il.sehir;
    ipucuAlt.textContent = `${fiyatBicim.format(il.ilanlar.length)} ilan · tıkla`;
    ipucuGoster();
    durum.textContent = `${il.sehir} · ${fiyatBicim.format(il.ilanlar.length)} ilan`;
    durum.dataset.hazir = "1";
    pazar.malzeme.uniforms.uSecili.value = ilanNokta;
    if (ulkeMalzeme.userData.shader) ulkeMalzeme.userData.shader.uniforms.uSecili.value = -1;
    return;
  }
  pazar.malzeme.uniforms.uSecili.value = kartIli ?? -1;

  const sehir = sehirBul();
  if (sehir !== -1) {
    seciliSehir = sehir;
    const [, , nufus, ad, ulke, baskent] = sehirler[sehir];
    ipucuTur.textContent = baskent ? "başkent" : "şehir";
    ipucuAd.textContent = ad;
    ipucuAlt.textContent = `${ulke} · ${bicimNufus(nufus)}`;
    ipucuGoster();
    durum.textContent = `${ad} · ${ulke}`;
    durum.dataset.hazir = "1";
    if (ulkeMalzeme.userData.shader) ulkeMalzeme.userData.shader.uniforms.uSecili.value = -1;
    return;
  }

  const ulke = ulkeBul();
  if (ulke >= 0) {
    seciliSehir = -1;
    const u = ulkeler[ulke];
    ipucuTur.textContent = "ülke";
    ipucuAd.textContent = u.n;
    ipucuAlt.textContent = [u.i, u.k].filter(Boolean).join(" · ");
    ipucuGoster();
    durum.textContent = u.n;
    durum.dataset.hazir = "1";
    if (ulkeMalzeme.userData.shader) ulkeMalzeme.userData.shader.uniforms.uSecili.value = ulke;
  } else {
    secimiTemizle();
  }
}

// rAF'a bağlı değil: sekme arka planda olsa da hover çalışsın
let sonTarama = 0;
renderci.domElement.addEventListener("pointermove", (e) => {
  fareX = e.clientX;
  fareY = e.clientY;
  fare.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  icerde = true;
  const simdi = performance.now();
  if (simdi - sonTarama > 45) {
    sonTarama = simdi;
    tarama();
  }
});

renderci.domElement.addEventListener("pointerleave", () => {
  icerde = false;
  secimiTemizle();
});

// ——— ilan kartı: tıkla ———
let baslaX = 0;
let baslaY = 0;
renderci.domElement.addEventListener("pointerdown", (e) => {
  baslaX = e.clientX;
  baslaY = e.clientY;
});
renderci.domElement.addEventListener("click", (e) => {
  if (Math.hypot(e.clientX - baslaX, e.clientY - baslaY) > 6) return;
  const i = pazar.ekrandaBul(kamera, e.clientX, e.clientY, innerWidth, innerHeight, 24);
  if (i === -1) {
    kartKapat_();
    return;
  }
  kartAc(i, e.clientX, e.clientY);
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape") kartKapat_();
});

// ——— etkileşim: otomatik dönüş ———
let sonEtkilesim = performance.now();
const etkilesim = () => {
  sonEtkilesim = performance.now();
  kontroller.autoRotate = false;
};
["pointerdown", "wheel", "touchstart"].forEach((olay) =>
  renderci.domElement.addEventListener(olay, etkilesim, { passive: true })
);

renderci.domElement.addEventListener("dblclick", () => {
  kamera.position.copy(BASLANGIC);
  kontroller.target.set(0, 0, 0);
  kontroller.update();
});

// ——— döngü ———
const saat = new THREE.Clock();
const atmosferMesh = sahne.children.find((c) => c.material?.uniforms?.uKamera);

function dongu() {
  yildizlar.material.uniforms.uZaman.value = saat.getElapsedTime();

  // ——— ilana uçuş (slerp: yay üzerinden) ———
  if (ucus) {
    const t = Math.min(1, (performance.now() - ucus.bas) / ucus.sure);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const bas = ucus.baslangicKonum.clone().normalize();
    const son = ucus.hedef.clone().normalize();
    const yon = bas.clone().lerp(son, e);
    if (yon.lengthSq() < 1e-6) yon.copy(son);
    yon.normalize();
    const yaricap = ucus.baslangicKonum.length() + (ucus.hedef.length() - ucus.baslangicKonum.length()) * e;
    kamera.position.copy(yon.multiplyScalar(yaricap));
    kontroller.target.set(0, 0, 0);
    kontroller.update();
    esikGuncelle();
    if (t >= 1) {
      ucusBitir();
      clearTimeout(ucusZaman);
    }
  }

  if (!kontroller.autoRotate && !azHareket && performance.now() - sonEtkilesim > 6000) {
    kontroller.autoRotate = true;
  }
  kontroller.update();
  esikGuncelle();

  if (atmosferMesh) atmosferMesh.material.uniforms.uKamera.value.copy(kamera.position);
  pazar.malzeme.uniforms.uZaman.value = saat.getElapsedTime();

  if (icerde) {
    if (seciliSehir !== -1) {
      const yeni = sehirBul();
      if (yeni !== seciliSehir) tarama();
      else ipucuGoster();
    }
    sonNokta = isinNoktasi();
    sonKoordinat = sonNokta ? noktadanKoordinat(sonNokta) : null;
    if (sonKoordinat) {
      const { lat, lon } = sonKoordinat;
      koordinat.textContent = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "K" : "G"} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "D" : "B"}`;
    }
  }

  renderci.render(sahne, kamera);
  requestAnimationFrame(dongu);
}
dongu();

addEventListener("resize", () => {
  kamera.aspect = innerWidth / innerHeight;
  kamera.updateProjectionMatrix();
  renderci.setSize(innerWidth, innerHeight);
});

// doğrulama kancası
window.__kure = {
  sahne,
  kamera,
  kontroller,
  renderci,
  ulkeler,
  sehirler,
  ulkeMesh,
  sehirMat,
  kimlik,
  pazar,
  get ilanlar() {
    return ilanlar;
  },
  get kendiIlanlar() {
    return kendiIlanlar;
  },
  filtre,
  detay,
  ekle,
  ucusYap,
  toast,
  gorselUret,
  ilanBul: (id) => ilanHaritasi.get(id),
  veriyiYenile,
  aramaYap(q) {
    aramaGirdi.value = q;
    aramaMetni = q;
    return ilanlariGrupla();
  },
  kartAc,
  kartKapat: kartKapat_,
  koordinatVektor,
  hangiUlke(x, y) {
    fare.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    const p = isinNoktasi();
    if (!p) return null;
    const k = noktadanKoordinat(p);
    const u = kimlik.ulkeBul(k.lon, k.lat);
    return u >= 0 ? ulkeler[u].n : null;
  },
  tarama,
  sehirBul(x, y) {
    fareX = x;
    fareY = y;
    return sehirBul();
  },
};
