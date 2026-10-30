// İlan detay sayfası (sağdan açılan panel) + #/ilan/<id> adresi + görsel galerisi.

import { gorselUret } from "./gorsel.js";
import { ilanYasi } from "./ilanlar.js";

const BICIM = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

export function detayKur({ kok, ilanBul, benzerBul, haritadaGoster, toast, onSil }) {
  let acikIlan = null;
  let foto = 0;
  let tetikleyici = null;

  kok.innerHTML = `
    <div class="detay-tutamac" aria-hidden="true"></div>
    <header class="detay-ust">
      <button class="detay-geri" type="button" data-geri>← haritaya dön</button>
      <span class="detay-no" data-no></span>
      <button class="detay-kapat" type="button" data-kapat aria-label="kapat">×</button>
    </header>

    <div class="detay-gorsel">
      <img data-img alt="" />
      <button class="gorsel-ok gorsel-ok--sol" type="button" data-once aria-label="önceki foto">‹</button>
      <button class="gorsel-ok gorsel-ok--sag" type="button" data-sonra aria-label="sonraki foto">›</button>
      <span class="gorsel-saya" data-saya></span>
      <span class="gorsel-rozet" data-rozet hidden>senin ilanın</span>
    </div>

    <div class="detay-kaydir">
      <div class="detay-baslik">
        <p class="detay-kategori" data-kategori></p>
        <h2 data-baslik></h2>
        <p class="detay-fiyat" data-fiyat></p>
      </div>

      <ul class="detay-kunye" data-kunye></ul>

      <div class="detay-eylem">
        <button class="dugme dugme--birincil" type="button" data-yaz>satıcıya yaz</button>
        <button class="dugme" type="button" data-harita>haritada göster</button>
        <button class="dugme dugme--ikon" type="button" data-paylas aria-label="bağlantıyı kopyala">paylaş</button>
        <button class="dugme dugme--ikon" type="button" data-kaydet aria-pressed="false">kaydet</button>
      </div>

      <section class="detay-bolum">
        <h3>açıklama</h3>
        <p class="detay-metin" data-aciklama></p>
      </section>

      <section class="detay-bolum">
        <h3>satıcı</h3>
        <div class="satici-kart">
          <span class="satici-harf" data-harf></span>
          <div>
            <p class="satici-ad" data-satici></p>
            <p class="satici-alt" data-satici-alt></p>
          </div>
        </div>
      </section>

      <section class="detay-bolum">
        <h3>benzer ilanlar</h3>
        <ul class="benzer" data-benzer></ul>
      </section>

      <footer class="detay-alt">
        <span data-alt-not></span>
        <button class="dugme dugme--tehlike" type="button" data-sil hidden>ilanı kaldır</button>
      </footer>
    </div>`;

  const q = (s) => kok.querySelector(s);
  const img = q("[data-img]");
  const kaydirilan = q(".detay-kaydir");

  function fotograflar(ilan) {
    const kendi = Array.isArray(ilan.fotolar) ? ilan.fotolar : [];
    const uretilen = [gorselUret(ilan, 0), gorselUret(ilan, 1), gorselUret(ilan, 2)];
    return [...kendi, ...uretilen].slice(0, kendi.length ? 5 : 3);
  }

  let liste = [];

  function fotoCiz() {
    if (!liste.length) return;
    img.src = liste[foto];
    img.alt = `${acikIlan.baslik} — fotoğraf ${foto + 1}`;
    q("[data-saya]").textContent = `${foto + 1} / ${liste.length}`;
    const cok = liste.length > 1;
    q("[data-once]").hidden = !cok;
    q("[data-sonra]").hidden = !cok;
  }

  function kunyeCiz(ilan) {
    const satirlar = [
      ["kategori", ilan.kategori],
      ["durum", ilan.durum],
      ["yer", `${ilan.ilce} / ${ilan.il} · ${ilan.bolge || ""}`.trim()],
      ["yayın", ilanYasi(ilan)],
      ["ilan no", ilan.id],
      ["satıcı puanı", `${ilan.puan} / 5`],
    ];
    q("[data-kunye]").innerHTML = satirlar
      .map(([k, v]) => `<li><span>${k}</span><b></b></li>`)
      .join("");
    [...q("[data-kunye]").children].forEach((li, i) => {
      li.querySelector("b").textContent = satirlar[i][1];
    });
  }

  function benzerCiz(ilan) {
    const kap = q("[data-benzer]");
    const benzer = benzerBul(ilan, 4);
    kap.replaceChildren();
    if (!benzer.length) {
      kap.innerHTML = `<li class="benzer-bos">bu kategoride başka ilan yok</li>`;
      return;
    }
    for (const b of benzer) {
      const li = document.createElement("li");
      li.innerHTML = `<button type="button" class="benzer-dugme">
          <img alt="" />
          <span class="benzer-ad"></span>
          <span class="benzer-fiyat"></span>
          <span class="benzer-yer"></span>
        </button>`;
      const btn = li.firstElementChild;
      btn.querySelector("img").src = gorselUret(b, 0);
      btn.querySelector(".benzer-ad").textContent = b.baslik;
      btn.querySelector(".benzer-fiyat").textContent = `${BICIM.format(b.fiyat)} ₺`;
      btn.querySelector(".benzer-yer").textContent = `${b.ilce}/${b.il} · ${b.durum}`;
      btn.addEventListener("click", () => ac(b.id, { adres: true }));
      kap.appendChild(li);
    }
  }

  function doldur(ilan) {
    acikIlan = ilan;
    foto = 0;
    liste = fotograflar(ilan);
    kaydirilan.scrollTop = 0;

    q("[data-no]").textContent = ilan.id;
    q("[data-kategori]").textContent = ilan.kategori;
    q("[data-baslik]").textContent = ilan.baslik;
    q("[data-fiyat]").textContent = `${BICIM.format(ilan.fiyat)} ₺`;
    q("[data-aciklama]").textContent = ilan.aciklama || "Satıcı açıklama eklemedi.";
    q("[data-satici]").textContent = ilan.satici;
    q("[data-satici-alt]").textContent = `${ilan.ilce}/${ilan.il} · ${ilanYasi(ilan)} yayında · cevap süresi ~${1 + (ilan.ilanNo % 5)} sa`;
    q("[data-harf]").textContent = (ilan.satici || "?").trim().charAt(0).toUpperCase();
    q("[data-rozet]").hidden = !ilan.benim;
    q("[data-sil]").hidden = !ilan.benim;
    q("[data-kaydet]").dataset.aktif = kayitliMi(ilan.id) ? "1" : "0";
    q("[data-kaydet]").textContent = kayitliMi(ilan.id) ? "kayıtlı" : "kaydet";
    q("[data-alt-not]").textContent = ilan.benim
      ? "bu ilan bu tarayıcıda kayıtlı — sadece sende görünür"
      : "kurgusal ilan · demo verisi";

    kunyeCiz(ilan);
    benzerCiz(ilan);
    fotoCiz();
  }

  function kayitliMi(id) {
    try {
      return JSON.parse(localStorage.getItem("dunya-pazari:kayitli") || "[]").includes(id);
    } catch {
      return false;
    }
  }

  function kayitDegistir(id) {
    let liste2 = [];
    try {
      liste2 = JSON.parse(localStorage.getItem("dunya-pazari:kayitli") || "[]");
    } catch {
      liste2 = [];
    }
    const varMi = liste2.includes(id);
    const yeni = varMi ? liste2.filter((x) => x !== id) : [id, ...liste2].slice(0, 200);
    localStorage.setItem("dunya-pazari:kayitli", JSON.stringify(yeni));
    return !varMi;
  }

  function ac(id, { adres = false } = {}) {
    const ilan = ilanBul(id);
    if (!ilan) return false;
    if (kok.hidden) tetikleyici = document.activeElement;
    doldur(ilan);
    kok.hidden = false;
    requestAnimationFrame(() => (kok.dataset.acik = "1"));
    document.body.dataset.detay = "1";
    if (adres) {
      const hedef = `#/ilan/${encodeURIComponent(id)}`;
      if (location.hash !== hedef) history.pushState(null, "", hedef);
    }
    return true;
  }

  function kapat(adresTemizle = true) {
    if (kok.hidden) return;
    delete kok.dataset.acik;
    document.body.dataset.detay = "0";
    acikIlan = null;
    setTimeout(() => {
      if (!kok.dataset.acik) kok.hidden = true;
    }, 320);
    if (adresTemizle && location.hash.startsWith("#/ilan/")) {
      history.pushState(null, "", location.pathname + location.search);
    }
    if (tetikleyici && typeof tetikleyici.focus === "function") {
      try {
        tetikleyici.focus({ preventScroll: true });
      } catch {
        /* yoksay */
      }
    }
    tetikleyici = null;
  }

  // ——— olaylar ———
  q("[data-kapat]").addEventListener("click", () => kapat());
  q("[data-geri]").addEventListener("click", () => kapat());

  q("[data-once]").addEventListener("click", () => {
    foto = (foto - 1 + liste.length) % liste.length;
    fotoCiz();
  });
  q("[data-sonra]").addEventListener("click", () => {
    foto = (foto + 1) % liste.length;
    fotoCiz();
  });

  q("[data-harita]").addEventListener("click", () => {
    if (acikIlan && haritadaGoster) haritadaGoster(acikIlan);
  });

  q("[data-paylas]").addEventListener("click", async () => {
    if (!acikIlan) return;
    const adres = `${location.origin}${location.pathname}#/ilan/${encodeURIComponent(acikIlan.id)}`;
    try {
      await navigator.clipboard.writeText(adres);
      toast("bağlantı kopyalandı", adres);
    } catch {
      toast("bağlantı", adres);
    }
  });

  q("[data-kaydet]").addEventListener("click", () => {
    if (!acikIlan) return;
    const eklendi = kayitDegistir(acikIlan.id);
    q("[data-kaydet]").dataset.aktif = eklendi ? "1" : "0";
    q("[data-kaydet]").textContent = eklendi ? "kayıtlı" : "kaydet";
    toast(eklendi ? "ilan kaydedildi" : "kayıttan çıkarıldı");
  });

  q("[data-yaz]").addEventListener("click", () => {
    if (!acikIlan) return;
    toast("mesaj kutusu demo", "gerçek pazaryeri bağlı değil — satıcıya iletim yok");
  });

  q("[data-sil]").addEventListener("click", () => {
    if (!acikIlan || !acikIlan.benim) return;
    const id = acikIlan.id;
    onSil?.(id);
    kapat();
    toast("ilan kaldırıldı");
  });

  addEventListener("keydown", (e) => {
    if (kok.hidden) return;
    if (e.key === "Escape") {
      kapat();
      return;
    }
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "ArrowLeft" && liste.length > 1) {
      foto = (foto - 1 + liste.length) % liste.length;
      fotoCiz();
    } else if (e.key === "ArrowRight" && liste.length > 1) {
      foto = (foto + 1) % liste.length;
      fotoCiz();
    }
  });

  addEventListener("popstate", () => {
    const es = adrestenIlanId();
    if (es) ac(es);
    else kapat(false);
  });

  return {
    ac,
    kapat,
    get acik() {
      return kok.hidden ? null : acikIlan;
    },
  };
}

export function adrestenIlanId() {
  const m = location.hash.match(/^#\/ilan\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}
