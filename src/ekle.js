// Kendi ilanını ekleme formu (#/ilan-ekle). Fotoğraf tarayıcıda küçültülür.

import { fotografiKucult } from "./depo.js";

const EN_FAZLA_FOTO = 3;

export function ekleKur({ kok, iller, ilceler, kategoriler, durumlar, varsayilanSatici, onEkle, toast }) {
  let fotolar = [];
  let acik = false;

  kok.innerHTML = `
    <form class="ekle-form" novalidate>
      <header class="ekle-ust">
        <div>
          <p class="ekle-etiket">YENİ İLAN</p>
          <h2>ilan ver</h2>
        </div>
        <button class="ekle-kapat" type="button" data-kapat aria-label="kapat">×</button>
      </header>

      <div class="ekle-govde">
        <div class="ekle-foto">
          <label class="foto-birak" data-birak>
            <input type="file" accept="image/*" multiple data-dosya hidden />
            <span class="foto-ikon" aria-hidden="true">＋</span>
            <span class="foto-yazi">fotoğraf ekle</span>
            <span class="foto-alt">sürükle bırak ya da tıkla · en fazla ${EN_FAZLA_FOTO}</span>
          </label>
          <ul class="foto-liste" data-liste></ul>
        </div>

        <div class="ekle-alanlar">
          <label class="alan alan--genis">
            <span>başlık <b>*</b></span>
            <input name="baslik" type="text" maxlength="70" placeholder="ör. Trek FX 2 şehir bisikleti" autocomplete="off" />
          </label>

          <label class="alan">
            <span>kategori <b>*</b></span>
            <select name="kategori">${kategoriler
              .map((k) => `<option value="${k}">${k}</option>`)
              .join("")}</select>
          </label>

          <label class="alan">
            <span>durum</span>
            <select name="durum">${durumlar.map((d) => `<option value="${d}">${d}</option>`).join("")}</select>
          </label>

          <label class="alan">
            <span>fiyat (₺) <b>*</b></span>
            <input name="fiyat" type="number" inputmode="numeric" min="1" max="900000" step="50" placeholder="12500" />
          </label>

          <label class="alan">
            <span>il <b>*</b></span>
            <select name="il">${iller.map((i) => `<option value="${i.ad}">${i.ad}</option>`).join("")}</select>
          </label>

          <label class="alan">
            <span>ilçe <b>*</b></span>
            <select name="ilce" data-ilce></select>
          </label>

          <label class="alan alan--genis">
            <span>açıklama</span>
            <textarea name="aciklama" rows="3" maxlength="400" placeholder="kullanım durumu, kusur, teslim tercihi…"></textarea>
            <em class="alan-sayac" data-sayac>0 / 400</em>
          </label>

          <label class="alan alan--genis">
            <span>satıcı adı</span>
            <input name="satici" type="text" maxlength="40" value="${varsayilanSatici}" autocomplete="off" />
          </label>
        </div>

        <p class="ekle-hata" data-hata hidden></p>
      </div>

      <footer class="ekle-alt">
        <p class="ekle-not">ilan yalnızca bu tarayıcıda saklanır · demo</p>
        <button class="dugme" type="button" data-vazgec>vazgeç</button>
        <button class="dugme dugme--birincil" type="submit" data-gonder>ilanı yayınla</button>
      </footer>
    </form>`;

  const form = kok.querySelector("form");
  const hata = kok.querySelector("[data-hata]");
  const dosyaGirdi = kok.querySelector("[data-dosya]");
  const birak = kok.querySelector("[data-birak]");
  const liste = kok.querySelector("[data-liste]");
  const aciklama = form.elements.aciklama;
  const sayac = kok.querySelector("[data-sayac]");
  const gonder = kok.querySelector("[data-gonder]");
  const ilSecim = form.elements.il;
  const ilceSecim = form.elements.ilce;

  // il değişince ilçe listesini tazele
  function ilceleriDoldur(ilAd, secili) {
    const yerel = ilceler.filter((i) => i.il === ilAd).sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
    ilceSecim.replaceChildren(
      ...yerel.map((i) => {
        const o = document.createElement("option");
        o.value = i.ad;
        o.textContent = i.ad;
        return o;
      })
    );
    ilceSecim.disabled = yerel.length === 0;
    if (secili && yerel.some((i) => i.ad === secili)) ilceSecim.value = secili;
  }
  ilSecim.addEventListener("change", () => ilceleriDoldur(ilSecim.value));
  ilceleriDoldur(ilSecim.value);

  function hataGoster(mesaj) {
    hata.textContent = mesaj;
    hata.hidden = !mesaj;
    if (mesaj) hata.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function fotoListeCiz() {
    liste.replaceChildren();
    fotolar.forEach((veri, i) => {
      const li = document.createElement("li");
      li.className = "foto-mini";
      li.innerHTML = `<img alt="" /><button type="button" aria-label="fotoğrafı kaldır">×</button>`;
      li.querySelector("img").src = veri;
      li.querySelector("button").addEventListener("click", () => {
        fotolar.splice(i, 1);
        fotoListeCiz();
      });
      liste.appendChild(li);
    });
    birak.hidden = fotolar.length >= EN_FAZLA_FOTO;
  }

  async function dosyaAl(dosyalar) {
    const yer = EN_FAZLA_FOTO - fotolar.length;
    if (yer <= 0) {
      hataGoster(`en fazla ${EN_FAZLA_FOTO} fotoğraf ekleyebilirsin`);
      return;
    }
    hataGoster("");
    for (const dosya of [...dosyalar].slice(0, yer)) {
      try {
        fotolar.push(await fotografiKucult(dosya));
      } catch {
        hataGoster("bu dosya bir görsel değil");
      }
    }
    fotoListeCiz();
  }

  dosyaGirdi.addEventListener("change", () => {
    if (dosyaGirdi.files?.length) dosyaAl(dosyaGirdi.files);
    dosyaGirdi.value = "";
  });

  ["dragenter", "dragover"].forEach((olay) =>
    birak.addEventListener(olay, (e) => {
      e.preventDefault();
      birak.dataset.uzerinde = "1";
    })
  );
  ["dragleave", "drop"].forEach((olay) =>
    birak.addEventListener(olay, (e) => {
      e.preventDefault();
      delete birak.dataset.uzerinde;
    })
  );
  birak.addEventListener("drop", (e) => {
    if (e.dataTransfer?.files?.length) dosyaAl(e.dataTransfer.files);
  });

  aciklama.addEventListener("input", () => {
    sayac.textContent = `${aciklama.value.length} / 400`;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const baslik = form.elements.baslik.value.trim();
    const fiyat = Math.round(Number(form.elements.fiyat.value));
    const kategori = form.elements.kategori.value;
    const il = form.elements.il.value;
    const ilce = form.elements.ilce.value;

    if (baslik.length < 5) return hataGoster("başlık en az 5 karakter olmalı");
    if (!Number.isFinite(fiyat) || fiyat <= 0) return hataGoster("geçerli bir fiyat gir");
    if (fiyat > 900000) return hataGoster("fiyat 900.000 ₺ üstü olamaz");
    if (!kategori) return hataGoster("kategori seç");
    if (!il) return hataGoster("il seç");
    if (!ilce) return hataGoster("ilçe seç");

    const ilceSatiri = ilceler.find((i) => i.il === il && i.ad === ilce);
    const ilan = {
      id: `IL-K-${String(Date.now()).slice(-6)}`,
      baslik,
      kategori,
      fiyat,
      il,
      ilce,
      bolge: iller.find((i) => i.ad === il)?.bolge || "",
      lat: ilceSatiri ? ilceSatiri.merkez[1] : 39,
      lon: ilceSatiri ? ilceSatiri.merkez[0] : 35,
      satici: form.elements.satici.value.trim() || varsayilanSatici,
      durum: form.elements.durum.value,
      aciklama: form.elements.aciklama.value.trim(),
      yas: 0,
      puan: "5.0",
      ilanNo: 900000 + (Date.now() % 99999),
      fotolar: [...fotolar],
      benim: true,
    };

    gonder.disabled = true;
    try {
      onEkle(ilan);
      toast("ilanın yayında", `${ilan.baslik} · ${ilce}/${il}`);
      kapat(false);
    } catch {
      hataGoster("ilan kaydedilemedi — tarayıcı depolaması dolu olabilir");
    } finally {
      gonder.disabled = false;
    }
  });

  function ac() {
    if (acik) return;
    acik = true;
    hataGoster("");
    kok.hidden = false;
    requestAnimationFrame(() => (kok.dataset.acik = "1"));
    document.body.dataset.ekle = "1";
    if (!location.hash.startsWith("#/ilan-ekle")) {
      history.pushState(null, "", "#/ilan-ekle");
    }
    setTimeout(() => form.elements.baslik.focus({ preventScroll: true }), 260);
  }

  function kapat(adresTemizle = true) {
    if (!acik) return;
    acik = false;
    delete kok.dataset.acik;
    document.body.dataset.ekle = "0";
    setTimeout(() => {
      if (!kok.dataset.acik) kok.hidden = true;
    }, 280);
    if (adresTemizle && location.hash.startsWith("#/ilan-ekle")) {
      history.pushState(null, "", location.pathname + location.search);
    }
    fotolar = [];
    fotoListeCiz();
    form.reset();
    ilceleriDoldur(ilSecim.value);
    form.elements.satici.value = varsayilanSatici;
    sayac.textContent = "0 / 400";
  }

  kok.querySelector("[data-kapat]").addEventListener("click", () => kapat());
  kok.querySelector("[data-vazgec]").addEventListener("click", () => kapat());
  kok.addEventListener("click", (e) => {
    if (e.target === kok) kapat();
  });
  addEventListener("keydown", (e) => {
    if (acik && e.key === "Escape") kapat();
  });

  return { ac, kapat, get acik() { return acik; } };
}
