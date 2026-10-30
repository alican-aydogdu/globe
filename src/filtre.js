// Kategori + fiyat filtresi. Haritayı ve şehir kartını aynı durumdan besler.

const BICIM = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

export function filtreKur({ kategoriKok, fiyatKok, ilanlar, onChange }) {
  const sayilar = new Map();
  for (const i of ilanlar) sayilar.set(i.kategori, (sayilar.get(i.kategori) || 0) + 1);

  const kategoriler = [...sayilar.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"));

  let altSinir = Infinity;
  let ustSinir = -Infinity;
  for (const i of ilanlar) {
    if (i.fiyat < altSinir) altSinir = i.fiyat;
    if (i.fiyat > ustSinir) ustSinir = i.fiyat;
  }
  const ADIM = 500;
  const TABAN = Math.floor((altSinir || 0) / ADIM) * ADIM;
  const TAVAN = Math.ceil((ustSinir || 100000) / ADIM) * ADIM;

  const durum = { secili: new Set(), min: TABAN, max: TAVAN };

  // ——— kategori çipleri ———
  const tumCip = document.createElement("button");
  tumCip.type = "button";
  tumCip.className = "cip cip--tum";
  tumCip.dataset.aktif = "1";
  tumCip.innerHTML = `Tümü <b>${BICIM.format(ilanlar.length)}</b>`;
  kategoriKok.appendChild(tumCip);

  const cipler = new Map();
  for (const [kategori, adet] of kategoriler) {
    const cip = document.createElement("button");
    cip.type = "button";
    cip.className = "cip";
    cip.dataset.kategori = kategori;
    cip.innerHTML = `<span class="cip-ad"></span><b>${BICIM.format(adet)}</b>`;
    cip.querySelector(".cip-ad").textContent = kategori;
    kategoriKok.appendChild(cip);
    cipler.set(kategori, cip);
  }

  function cipDurumlari() {
    const hepsi = durum.secili.size === 0;
    tumCip.dataset.aktif = hepsi ? "1" : "0";
    for (const [kategori, cip] of cipler) {
      cip.dataset.aktif = durum.secili.has(kategori) ? "1" : "0";
    }
  }

  kategoriKok.addEventListener("click", (e) => {
    const cip = e.target.closest(".cip");
    if (!cip) return;
    if (cip === tumCip) {
      durum.secili.clear();
    } else {
      const kategori = cip.dataset.kategori;
      if (durum.secili.has(kategori)) durum.secili.delete(kategori);
      else durum.secili.add(kategori);
    }
    cipDurumlari();
    yay();
  });

  // ——— fiyat ———
  fiyatKok.innerHTML = `
    <button class="fiyat-ac" type="button" aria-expanded="false">
      <span class="fiyat-ac-ad">fiyat</span>
      <span class="fiyat-ac-deger" data-deger>tümü</span>
      <span class="fiyat-ac-ok" aria-hidden="true">▾</span>
    </button>
    <div class="fiyat-panel" hidden>
      <div class="fiyat-izgara">
        <label class="fiyat-alan">
          <span>en az</span>
          <input type="number" inputmode="numeric" data-min-metin min="0" step="500" />
        </label>
        <label class="fiyat-alan">
          <span>en çok</span>
          <input type="number" inputmode="numeric" data-max-metin min="0" step="500" />
        </label>
      </div>
      <div class="fiyat-cift">
        <div class="fiyat-ray"><span data-dolgu></span></div>
        <input type="range" data-min-ray min="${TABAN}" max="${TAVAN}" step="100" aria-label="en düşük fiyat" />
        <input type="range" data-max-ray min="${TABAN}" max="${TAVAN}" step="100" aria-label="en yüksek fiyat" />
      </div>
      <div class="fiyat-kisayol">
        <button type="button" data-hizli="0-5000">0–5 bin</button>
        <button type="button" data-hizli="5000-25000">5–25 bin</button>
        <button type="button" data-hizli="25000-999999">25 bin +</button>
      </div>
      <p class="fiyat-not" data-not></p>
    </div>`;

  const acDugme = fiyatKok.querySelector(".fiyat-ac");
  const panel = fiyatKok.querySelector(".fiyat-panel");
  const degerEtiket = fiyatKok.querySelector("[data-deger]");
  const minRay = fiyatKok.querySelector("[data-min-ray]");
  const maxRay = fiyatKok.querySelector("[data-max-ray]");
  const minMetin = fiyatKok.querySelector("[data-min-metin]");
  const maxMetin = fiyatKok.querySelector("[data-max-metin]");
  const dolgu = fiyatKok.querySelector("[data-dolgu]");
  const not = fiyatKok.querySelector("[data-not]");

  minRay.min = maxRay.min = TABAN;
  minRay.max = maxRay.max = TAVAN;
  minRay.value = durum.min;
  maxRay.value = durum.max;
  minMetin.value = durum.min;
  maxMetin.value = durum.max;

  function fiyatCiz() {
    const oran = (v) => ((v - TABAN) / (TAVAN - TABAN || 1)) * 100;
    const sol = oran(durum.min);
    const sag = oran(durum.max);
    dolgu.style.left = `${sol}%`;
    dolgu.style.right = `${100 - sag}%`;
    minMetin.value = durum.min;
    maxMetin.value = durum.max;
    const tumu = durum.min === TABAN && durum.max === TAVAN;
    degerEtiket.textContent = tumu
      ? "tümü"
      : `${BICIM.format(durum.min)} – ${BICIM.format(durum.max)} ₺`;
    acDugme.dataset.aktif = tumu ? "0" : "1";
    const adet = ilanlar.filter((i) => durum.min <= i.fiyat && i.fiyat <= durum.max).length;
    not.textContent = `${BICIM.format(adet)} ilan bu aralıkta`;
  }

  function fiyatAyarla(min, max, kaynak) {
    let a = Number.isFinite(+min) ? Math.round(+min) : durum.min;
    let b = Number.isFinite(+max) ? Math.round(+max) : durum.max;
    a = Math.max(TABAN, Math.min(a, TAVAN));
    b = Math.max(TABAN, Math.min(b, TAVAN));
    if (a > b) {
      if (kaynak === "min") b = a;
      else a = b;
    }
    durum.min = a;
    durum.max = b;
    minRay.value = a;
    maxRay.value = b;
    fiyatCiz();
    yay();
  }

  minRay.addEventListener("input", () => fiyatAyarla(minRay.value, durum.max, "min"));
  maxRay.addEventListener("input", () => fiyatAyarla(durum.min, maxRay.value, "max"));
  minMetin.addEventListener("change", () => fiyatAyarla(minMetin.value, durum.max, "min"));
  maxMetin.addEventListener("change", () => fiyatAyarla(durum.min, maxMetin.value, "max"));

  fiyatKok.querySelectorAll("[data-hizli]").forEach((b) => {
    b.addEventListener("click", () => {
      const [a, c] = b.dataset.hizli.split("-").map(Number);
      fiyatAyarla(a, c);
    });
  });

  acDugme.addEventListener("click", () => {
    const acik = panel.hidden;
    panel.hidden = !acik;
    acDugme.setAttribute("aria-expanded", String(acik));
    acDugme.dataset.acik = acik ? "1" : "0";
  });

  document.addEventListener("click", (e) => {
    if (panel.hidden) return;
    if (!fiyatKok.contains(e.target)) {
      panel.hidden = true;
      acDugme.setAttribute("aria-expanded", "false");
      acDugme.dataset.acik = "0";
    }
  });

  function yay() {
    onChange({ kategoriler: durum.secili, min: durum.min, max: durum.max });
  }

  function suz(ilan) {
    if (durum.secili.size && !durum.secili.has(ilan.kategori)) return false;
    return durum.min <= ilan.fiyat && ilan.fiyat <= durum.max;
  }

  function sifirla() {
    durum.secili.clear();
    durum.min = TABAN;
    durum.max = TAVAN;
    minRay.value = TABAN;
    maxRay.value = TAVAN;
    cipDurumlari();
    fiyatCiz();
    yay();
  }

  function aktifMi() {
    return durum.secili.size > 0 || durum.min !== TABAN || durum.max !== TAVAN;
  }

  cipDurumlari();
  fiyatCiz();

  return {
    suz,
    sifirla,
    aktifMi,
    kategoriler: kategoriler.map(([k]) => k),
    get durum() {
      return durum;
    },
    yay,
  };
}
