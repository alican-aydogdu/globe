// Kendi ilanların: localStorage'da tutulur, üretilen ilanlarla birleştirilir.

const ANAHTAR = "dunya-pazari:ilanlar:v1";
const EN_FAZLA = 40;

export function yerelIlanlariOku() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return [];
    const veri = JSON.parse(ham);
    if (!Array.isArray(veri)) return [];
    return veri.filter((i) => i && typeof i.id === "string" && typeof i.baslik === "string");
  } catch {
    return [];
  }
}

export function yerelIlanEkle(ilan) {
  const liste = yerelIlanlariOku();
  liste.unshift(ilan);
  const kirp = liste.slice(0, EN_FAZLA);
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(kirp));
  } catch (hata) {
    // kota doldu: fotoğrafları düşürüp yeniden dene
    const hafif = kirp.map((i) => ({ ...i, fotolar: [] }));
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(hafif));
    } catch {
      throw hata;
    }
  }
  return kirp;
}

export function yerelIlanSil(id) {
  const kalan = yerelIlanlariOku().filter((i) => i.id !== id);
  localStorage.setItem(ANAHTAR, JSON.stringify(kalan));
  return kalan;
}

// Yüklenen fotoğrafı tarayıcıda küçültüp JPEG data URL'e çevirir.
export function fotografiKucult(dosya, enFazla = 1100) {
  return new Promise((coz, reddet) => {
    if (!dosya.type.startsWith("image/")) {
      reddet(new Error("sadece görsel dosyası"));
      return;
    }
    const url = URL.createObjectURL(dosya);
    const img = new Image();
    img.onload = () => {
      const olcek = Math.min(1, enFazla / Math.max(img.width, img.height));
      const g = Math.round(img.width * olcek);
      const y = Math.round(img.height * olcek);
      const tuval = document.createElement("canvas");
      tuval.width = g;
      tuval.height = y;
      const ctx = tuval.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, g, y);
      URL.revokeObjectURL(url);
      coz(tuval.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reddet(new Error("görsel açılamadı"));
    };
    img.src = url;
  });
}
