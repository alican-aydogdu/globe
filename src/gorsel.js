// İlan görselleri: dış kaynak/CDN yok. Her ilan için kategoriye göre üretilen
// SVG "stüdyo fotoğrafı" (data URL). Deterministik: aynı ilan → aynı görsel.

const G = 1200;
const Y = 800;

// ——— deterministik gürültü ———
function tohum(metin) {
  let h = 2166136261;
  for (let i = 0; i < metin.length; i++) {
    h ^= metin.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function uretec(t) {
  let a = t || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// ——— kategori → görsel ailesi ———
const AILELER = {
  Bisiklet: "bisiklet",
  "Elektrikli scooter": "bisiklet",
  Kaykay: "bisiklet",
  Kamera: "kamera",
  Drone: "kamera",
  Telefon: "ekran",
  Laptop: "ekran",
  Monitör: "ekran",
  "Oyun konsolu": "ekran",
  Gitar: "gitar",
  Koltuk: "mobilya",
  Gardırop: "mobilya",
  Masa: "mobilya",
  Ayna: "mobilya",
  Halı: "hali",
  Buzdolabı: "beyaz",
  "Çamaşır makinesi": "beyaz",
  "Bulaşık makinesi": "beyaz",
  Klima: "beyaz",
  "Koşu bandı": "beyaz",
  Kitap: "medya",
  Plak: "medya",
  Çadır: "kamp",
  "Kamp ocağı": "kamp",
  Kask: "kask",
  "Tenis raketi": "raket",
  Matkap: "matkap",
  Akvaryum: "akvaryum",
  "Bebek arabası": "bebek",
};

const ZEMIN = {
  bisiklet: ["#0e1a24", "#1d3a46"],
  kamera: ["#15171d", "#2b303c"],
  ekran: ["#101624", "#20304a"],
  gitar: ["#1d1512", "#3d2a1c"],
  mobilya: ["#141a16", "#2c3a2e"],
  hali: ["#1c1512", "#3a2a20"],
  beyaz: ["#12171c", "#27333d"],
  medya: ["#1a1620", "#322842"],
  kamp: ["#111b16", "#24382b"],
  kask: ["#191420", "#302544"],
  raket: ["#131c17", "#26402c"],
  matkap: ["#1d1710", "#3c2e17"],
  akvaryum: ["#0c1c25", "#14404f"],
  bebek: ["#1b161c", "#362a38"],
};

const GOVDE = ["#e9eef7", "#a9b7c8"];
const METAL = ["#cfd9e6", "#8b9aac"];

function siluet(aile, r) {
  const c = "url(#govde)";
  const m = "url(#metal)";
  const e = "rgba(4,8,14,0.55)";

  switch (aile) {
    case "bisiklet": {
      const egim = (r() - 0.5) * 26;
      return `
      <g transform="translate(600 ${540 + egim})">
        <circle cx="-250" cy="0" r="128" fill="none" stroke="${c}" stroke-width="15"/>
        <circle cx="250" cy="0" r="128" fill="none" stroke="${c}" stroke-width="15"/>
        <circle cx="-250" cy="0" r="104" fill="none" stroke="${c}" stroke-width="4" opacity="0.45"/>
        <circle cx="250" cy="0" r="104" fill="none" stroke="${c}" stroke-width="4" opacity="0.45"/>
        <circle cx="-250" cy="0" r="16" fill="${c}"/>
        <circle cx="250" cy="0" r="16" fill="${c}"/>
        <path d="M-250 0 L-70 -170 L150 -170 L250 0 M-70 -170 L-40 0 L250 0 M150 -170 L120 -210 M120 -210 L80 -210"
              fill="none" stroke="${c}" stroke-width="13" stroke-linejoin="round"/>
        <path d="M-40 0 L-70 -170" stroke="${m}" stroke-width="9"/>
        <rect x="-120" y="-206" width="66" height="14" rx="7" fill="${c}"/>
      </g>`;
    }
    case "kamera": {
      return `
      <g transform="translate(600 470)">
        <rect x="-250" y="-160" width="500" height="330" rx="42" fill="${c}"/>
        <rect x="-250" y="-160" width="500" height="72" rx="34" fill="${e}"/>
        <circle cx="30" cy="20" r="128" fill="${e}"/>
        <circle cx="30" cy="20" r="106" fill="${m}"/>
        <circle cx="30" cy="20" r="70" fill="#0b1018"/>
        <circle cx="30" cy="20" r="42" fill="#182537"/>
        <circle cx="8" cy="-4" r="16" fill="#cfe6ff" opacity="0.75"/>
        <rect x="-196" y="-138" width="86" height="16" rx="8" fill="#c9d6e6" opacity="0.55"/>
        <rect x="150" y="-224" width="120" height="70" rx="16" fill="${c}"/>
      </g>`;
    }
    case "ekran": {
      return `
      <g transform="translate(600 470)">
        <rect x="-300" y="-190" width="600" height="330" rx="14" fill="${c}"/>
        <rect x="-278" y="-168" width="556" height="286" rx="8" fill="#0a1220"/>
        <path d="M-278 -60 L60 -168 L278 -120 L278 118 L-278 118 Z" fill="#16304a" opacity="0.85"/>
        <circle cx="120" cy="-10" r="46" fill="${GOVDE[0]}" opacity="0.18"/>
        <rect x="-70" y="140" width="140" height="26" rx="6" fill="${m}"/>
        <rect x="-130" y="164" width="260" height="16" rx="8" fill="${m}" opacity="0.8"/>
      </g>`;
    }
    case "gitar": {
      return `
      <g transform="translate(600 470) rotate(-14)">
        <path d="M0 -40 C-96 -60 -140 20 -108 96 C-88 146 -40 168 0 168 C40 168 88 146 108 96 C140 20 96 -60 0 -40 Z" fill="${c}"/>
        <ellipse cx="0" cy="30" rx="58" ry="46" fill="#0d1119"/>
        <rect x="-26" y="-300" width="52" height="270" rx="8" fill="${m}"/>
        <rect x="-36" y="-352" width="72" height="62" rx="10" fill="${c}"/>
        ${[-16, -5, 5, 16].map((x) => `<line x1="${x}" y1="-330" x2="${x}" y2="150" stroke="#20293a" stroke-width="3"/>`).join("")}
      </g>`;
    }
    case "mobilya": {
      return `
      <g transform="translate(600 520)">
        <rect x="-330" y="-150" width="660" height="180" rx="30" fill="${c}"/>
        <rect x="-330" y="-40" width="660" height="130" rx="24" fill="${m}" opacity="0.85"/>
        <rect x="-290" y="-120" width="270" height="120" rx="20" fill="#0f1720" opacity="0.28"/>
        <rect x="30" y="-120" width="260" height="120" rx="20" fill="#0f1720" opacity="0.22"/>
        <rect x="-300" y="60" width="26" height="96" rx="8" fill="#0d131b"/>
        <rect x="274" y="60" width="26" height="96" rx="8" fill="#0d131b"/>
      </g>`;
    }
    case "hali": {
      return `
      <g transform="translate(600 520)">
        <path d="M-360 40 L-230 -170 L330 -170 L360 40 L330 210 L-330 210 Z" fill="${c}"/>
        <path d="M-320 40 L-210 -140 L300 -140 L320 40 L300 182 L-300 182 Z" fill="none" stroke="${e}" stroke-width="10"/>
        <path d="M0 -140 L0 182 M-250 30 L250 30" stroke="${e}" stroke-width="6" opacity="0.5"/>
        <path d="M-140 90 L140 90 M-140 120 L140 120" stroke="${e}" stroke-width="5" opacity="0.35"/>
      </g>`;
    }
    case "beyaz": {
      return `
      <g transform="translate(600 480)">
        <rect x="-220" y="-230" width="440" height="440" rx="26" fill="${c}"/>
        <rect x="-220" y="-230" width="440" height="440" rx="26" fill="none" stroke="${e}" stroke-width="8"/>
        <line x1="-220" y1="-80" x2="220" y2="-80" stroke="${e}" stroke-width="8"/>
        <circle cx="0" cy="90" r="86" fill="${m}"/>
        <circle cx="0" cy="90" r="64" fill="#0d141d" opacity="0.75"/>
        <rect x="120" y="-200" width="60" height="14" rx="7" fill="${e}"/>
        <rect x="-200" y="-40" width="14" height="150" rx="7" fill="${e}" opacity="0.7"/>
      </g>`;
    }
    case "medya": {
      return `
      <g transform="translate(600 500)">
        <g transform="rotate(-8)">
          <rect x="-300" y="-40" width="560" height="120" rx="10" fill="${m}"/>
          <rect x="-290" y="-60" width="560" height="120" rx="10" fill="${c}"/>
          <rect x="-266" y="-42" width="512" height="84" rx="6" fill="#0e141d" opacity="0.35"/>
          <line x1="-230" y1="0" x2="200" y2="0" stroke="#0e141d" stroke-width="7" opacity="0.5"/>
        </g>
        <circle cx="120" cy="-190" r="132" fill="#0b1018"/>
        <circle cx="120" cy="-190" r="110" fill="${m}"/>
        <circle cx="120" cy="-190" r="34" fill="#0b1018"/>
        ${[0, 1, 2].map((i) => `<circle cx="120" cy="-190" r="${86 - i * 22}" fill="none" stroke="#0b1018" stroke-width="3" opacity="0.4"/>`).join("")}
      </g>`;
    }
    case "kamp": {
      return `
      <g transform="translate(600 540)">
        <path d="M-300 120 L0 -250 L300 120 Z" fill="${c}"/>
        <path d="M0 -250 L0 120 L-300 120 Z" fill="${m}" opacity="0.55"/>
        <path d="M0 -180 L96 120 L-96 120 Z" fill="#0c141c"/>
        <path d="M-300 120 L300 120" stroke="${c}" stroke-width="10"/>
      </g>`;
    }
    case "kask": {
      return `
      <g transform="translate(600 540)">
        <path d="M-220 60 A220 220 0 0 1 220 60 L220 100 L-220 100 Z" fill="${c}"/>
        <path d="M-170 40 A170 170 0 0 1 170 40 L170 66 L-170 66 Z" fill="#0b1119"/>
        <path d="M-206 74 L206 74 L120 30 L-120 30 Z" fill="#5d7ea3" opacity="0.55"/>
        <rect x="-150" y="-20" width="300" height="12" rx="6" fill="${e}" opacity="0.5"/>
      </g>`;
    }
    case "raket": {
      return `
      <g transform="translate(600 470) rotate(18)">
        <ellipse cx="0" cy="-120" rx="140" ry="180" fill="none" stroke="${c}" stroke-width="16"/>
        ${Array.from({ length: 7 }, (_, i) => {
          const x = -110 + i * 36;
          return `<line x1="${x}" y1="-282" x2="${x}" y2="52" stroke="${c}" stroke-width="3" opacity="0.55"/>`;
        }).join("")}
        ${Array.from({ length: 8 }, (_, i) => {
          const y = -276 + i * 44;
          return `<line x1="-132" y1="${y}" x2="132" y2="${y}" stroke="${c}" stroke-width="3" opacity="0.55"/>`;
        }).join("")}
        <rect x="-24" y="46" width="48" height="230" rx="18" fill="${m}"/>
        <rect x="-26" y="250" width="52" height="60" rx="14" fill="${c}"/>
      </g>`;
    }
    case "matkap": {
      return `
      <g transform="translate(600 480)">
        <path d="M-260 -40 L90 -80 L150 60 L-240 96 Z" fill="${c}"/>
        <rect x="60" y="-70" width="70" height="60" rx="12" fill="${m}"/>
        <path d="M130 -50 L330 -30 L330 6 L130 20 Z" fill="${m}"/>
        <path d="M-120 70 L-120 200 L40 200 L40 70 Z" fill="${m}" opacity="0.9"/>
        <rect x="-170" y="196" width="120" height="60" rx="14" fill="#0b1119"/>
        <circle cx="-140" cy="30" r="26" fill="#0b1119"/>
      </g>`;
    }
    case "akvaryum": {
      return `
      <g transform="translate(600 480)">
        <rect x="-320" y="-150" width="640" height="330" rx="12" fill="#0a1a24"/>
        <rect x="-320" y="-150" width="640" height="330" rx="12" fill="none" stroke="${m}" stroke-width="12"/>
        <rect x="-308" y="-40" width="616" height="208" fill="#1b5e77" opacity="0.55"/>
        ${Array.from({ length: 26 }, () => `<circle cx="${-290 + r() * 580}" cy="${-30 + r() * 180}" r="${2 + r() * 5}" fill="#c8ecff" opacity="0.5"/>`).join("")}
        <path d="M-220 200 L-160 90 L-100 200 Z" fill="#1f6b4d"/>
        <path d="M180 200 L240 60 L300 200 Z" fill="#237a55"/>
        <path d="M-40 40 q40 -30 80 0 q-40 26 -80 0" fill="#ffb454" opacity="0.9"/>
      </g>`;
    }
    case "bebek": {
      return `
      <g transform="translate(600 520)">
        <path d="M-260 -40 A180 180 0 0 1 120 -40 L120 60 L-260 60 Z" fill="${c}"/>
        <path d="M-260 60 L180 60 L120 -40" fill="none" stroke="${m}" stroke-width="12"/>
        <line x1="-210" y1="60" x2="-210" y2="120" stroke="${m}" stroke-width="12"/>
        <line x1="150" y1="60" x2="150" y2="120" stroke="${m}" stroke-width="12"/>
        <circle cx="-210" cy="150" r="34" fill="${m}"/>
        <circle cx="150" cy="150" r="34" fill="${m}"/>
      </g>`;
    }
    default:
      return `
      <g transform="translate(600 480)">
        <rect x="-230" y="-190" width="460" height="380" rx="28" fill="${c}"/>
        <circle cx="0" cy="-40" r="96" fill="${e}" opacity="0.35"/>
        <rect x="-140" y="90" width="280" height="18" rx="9" fill="${e}" opacity="0.4"/>
      </g>`;
  }
}

export function gorselUret(ilan, varyant = 0) {
  const aile = AILELER[ilan.kategori] || "genel";
  const [z0, z1] = ZEMIN[aile] || ["#12171f", "#26313e"];
  const r = uretec(tohum(`${ilan.id}-${varyant}`));
  const kaydir = pertain(ilan.id, varyant);
  const olcek = 1 + varyant * 0.06;
  const donme = (r() - 0.5) * 5 + varyant * 2.4;
  const isikX = 40 + r() * 20;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${G} ${Y}" width="${G}" height="${Y}">
  <defs>
    <linearGradient id="zemin" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${z0}"/>
      <stop offset="1" stop-color="${z1}"/>
    </linearGradient>
    <radialGradient id="isik" cx="${isikX}%" cy="34%" r="62%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="govde" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0" stop-color="${GOVDE[0]}"/>
      <stop offset="1" stop-color="${GOVDE[1]}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${METAL[0]}"/>
      <stop offset="1" stop-color="${METAL[1]}"/>
    </linearGradient>
    <radialGradient id="golge" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#000" stop-opacity="0.62"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vinyet" cx="50%" cy="46%" r="72%">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.62"/>
    </radialGradient>
    <filter id="gren">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>

  <rect width="${G}" height="${Y}" fill="url(#zemin)"/>
  <rect width="${G}" height="${Y}" fill="url(#isik)"/>

  <g opacity="0.35" stroke="#9fc4e4" stroke-width="1">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${Y}" opacity="0.06"/>`).join("")}
    ${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="${G}" y2="${i * 100}" opacity="0.06"/>`).join("")}
  </g>

  <ellipse cx="600" cy="700" rx="430" ry="70" fill="url(#golge)"/>

  <g transform="translate(${kaydir[0]} ${kaydir[1]}) scale(${olcek}) rotate(${donme} 600 500)">
    ${siluet(aile, r)}
  </g>

  <rect width="${G}" height="${Y}" filter="url(#gren)" opacity="0.05"/>
  <rect width="${G}" height="${Y}" fill="url(#vinyet)"/>

  <g font-family="'IBM Plex Mono', ui-monospace, monospace" fill="#e8f0f8">
    <text x="52" y="76" font-size="22" letter-spacing="5" opacity="0.55">FOTO ${varyant + 1}/3</text>
    <text x="52" y="${Y - 46}" font-size="20" letter-spacing="4" opacity="0.4">${kacis(ilan.kategori.toUpperCase())}</text>
    <text x="${G - 52}" y="${Y - 46}" font-size="20" letter-spacing="4" text-anchor="end" opacity="0.3">KURGUSAL</text>
  </g>
  <rect x="52" y="96" width="76" height="3" fill="#ffb454" opacity="0.9"/>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function pertain(id, varyant) {
  const r = uretec(tohum(`${id}-k-${varyant}`));
  return [(r() - 0.5) * 60, (r() - 0.5) * 34];
}

function kacis(s) {
  return String(s).replace(/[&<>"']/g, (k) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[k]);
}
