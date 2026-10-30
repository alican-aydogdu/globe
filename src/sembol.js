import * as THREE from "three";

// Sembolik (vektör) dünya: uydu dokusu yok.
// Ülkeler GeoJSON çokgenlerinden küre yüzeyine oturtulur, aralarında sınır
// çizgileri, şehirler küçük kutucuklar (nokta sprite) olarak durur.

const YARICAP = 1;

export function koordinatVektor(lon, lat, r = YARICAP) {
  const phi = ((lon + 180) * Math.PI) / 180;
  const theta = ((90 - lat) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.cos(phi) * Math.sin(theta),
    r * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// Halkayı 180. boylamı aşmayacak şekilde kaydır (Rusya, Fiji gibi ülkeler).
function halkaAc(ring) {
  const out = [];
  let onceki = null;
  for (const [lon, lat] of ring) {
    let l = lon;
    if (onceki !== null) {
      while (l - onceki > 180) l -= 360;
      while (l - onceki < -180) l += 360;
    }
    out.push([l, Math.max(-89.9, Math.min(89.9, lat))]);
    onceki = l;
  }
  // kapalı halka: kaydırma sonrası ilk nokta ile son nokta aynı olmalı,
  // yoksa earcut 360°'lik yalancı üçgen üretiyor
  if (out.length > 1) out[out.length - 1] = out[0].slice();
  return out;
}

// Delik halkasını dış halkaya yakın boylam aralığına taşı.
function delikHizala(ring, dis) {
  const acik = halkaAc(ring);
  const minDis = Math.min(...dis.map((p) => p[0]));
  const maxDis = Math.max(...dis.map((p) => p[0]));
  const orta = (minDis + maxDis) / 2;
  const minDelik = Math.min(...acik.map((p) => p[0]));
  const maxDelik = Math.max(...acik.map((p) => p[0]));
  const kaydir = Math.round((orta - (minDelik + maxDelik) / 2) / 360) * 360;
  return acik.map(([x, y]) => [x + kaydir, y]);
}

// Her ülke kendi tonunda: sönük ama ayırt edilebilir sembolik palet
function ulkeRengi(i) {
  const h = (i * 47.7 + 205) % 360;
  const s = 0.20 + ((i * 7) % 6) * 0.022;
  const l = 0.40 + ((i * 5) % 4) * 0.024;
  return new THREE.Color().setHSL(h / 360, s, l);
}

/**
 * Ülkeleri tek bir geometride birleştirir.
 * Dönen: { dolgu, sinir, ulkeler }
 */
// Kiriş (chord) kürenin içinden geçmesin: uzun kenarlı üçgenleri böl.
const ESIK_YAY = (3 * Math.PI) / 180;

function kutupsalNokta(lon, lat, kutup) {
  // kutuptan uzaklık (derece) → düzlem yarıçapı; kutup çevresinde süreklidir
  const t = kutup === "guney" ? 90 + lat : 90 - lat;
  const a = (lon * Math.PI) / 180;
  return new THREE.Vector2((t + 0.5) * Math.cos(a), (t + 0.5) * Math.sin(a));
}

/**
 * Ülkeleri tek bir geometride birleştirir.
 * Dönen: { dolgu, sinir, ulkeler }
 */
export function ulkeGeometrisi(ulkeler) {
  const poz = [];
  const renk = [];
  const ulkeIdx = [];
  const indeks = [];
  const sinir = [];
  const renkler = ulkeler.map((_, i) => ulkeRengi(i));

  ulkeler.forEach((ulke, ui) => {
    const c = renkler[ui % renkler.length];
    let dolguVar = false;

    for (const pol of ulke.g) {
      const ham = pol[0];
      const latlar = ham.map((p) => p[1]);
      const kutup = Math.max(...latlar) > 84 ? "kuzey" : Math.min(...latlar) < -84 ? "guney" : null;

      let duz; // düzlem noktaları (earcut için)
      let kure; // küre noktaları (lon, lat)
      if (kutup) {
        duz = [ham.map((p) => kutupsalNokta(p[0], p[1], kutup))];
        kure = [ham];
        for (const h of pol.slice(1)) {
          duz.push(h.map((p) => kutupsalNokta(p[0], p[1], kutup)));
          kure.push(h);
        }
      } else {
        const dis = halkaAc(ham);
        duz = [dis.map(([x, y]) => new THREE.Vector2(x, y))];
        kure = [dis];
        for (const h of pol.slice(1)) {
          const hd = delikHizala(h, dis);
          duz.push(hd.map(([x, y]) => new THREE.Vector2(x, y)));
          kure.push(hd);
        }
      }

      let yuzler = [];
      try {
        yuzler = THREE.ShapeUtils.triangulateShape(duz[0], duz.slice(1));
      } catch {
        yuzler = [];
      }
      if (!yuzler.length) continue;

      const noktalar = kure[0].concat(...kure.slice(1));
      const dunya = noktalar.map(([lon, lat]) => koordinatVektor(lon, lat, YARICAP * 1.0015));

      const ekle = (p) => {
        poz.push(p.x, p.y, p.z);
        renk.push(c.r, c.g, c.b);
        ulkeIdx.push(ui);
        return poz.length / 3 - 1;
      };
      const bol = (a, b, cc, derinlik) => {
        const ab = a.angleTo(b);
        const bc = b.angleTo(cc);
        const ca = cc.angleTo(a);
        const en = Math.max(ab, bc, ca);
        if (en > ESIK_YAY && derinlik < 7) {
          if (en === ab) {
            const m = a.clone().add(b).normalize().multiplyScalar(YARICAP * 1.0015);
            bol(a, m, cc, derinlik + 1);
            bol(m, b, cc, derinlik + 1);
          } else if (en === bc) {
            const m = b.clone().add(cc).normalize().multiplyScalar(YARICAP * 1.0015);
            bol(a, b, m, derinlik + 1);
            bol(a, m, cc, derinlik + 1);
          } else {
            const m = cc.clone().add(a).normalize().multiplyScalar(YARICAP * 1.0015);
            bol(a, b, m, derinlik + 1);
            bol(m, b, cc, derinlik + 1);
          }
          return;
        }
        indeks.push(ekle(a), ekle(b), ekle(cc));
      };
      for (const [a, b, cc] of yuzler) bol(dunya[a], dunya[b], dunya[cc], 0);
      dolguVar = true;
    }

    // kıyı + sınır çizgileri
    for (const pol of ulke.g) {
      for (const ring of pol) {
        const acik = halkaAc(ring);
        for (let i = 0; i < acik.length - 1; i++) {
          const a = koordinatVektor(acik[i][0], acik[i][1], YARICAP * 1.0022);
          const b = koordinatVektor(acik[i + 1][0], acik[i + 1][1], YARICAP * 1.0022);
          sinir.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }
    ulke.dolguVar = dolguVar;
  });

  const dolgu = new THREE.BufferGeometry();
  dolgu.setAttribute("position", new THREE.Float32BufferAttribute(poz, 3));
  dolgu.setAttribute("color", new THREE.Float32BufferAttribute(renk, 3));
  dolgu.setAttribute("aUlke", new THREE.Float32BufferAttribute(ulkeIdx, 1));
  dolgu.setIndex(indeks);
  dolgu.computeBoundingSphere();

  const sinirGeo = new THREE.BufferGeometry();
  sinirGeo.setAttribute("position", new THREE.Float32BufferAttribute(sinir, 3));

  return { dolgu, sinir: sinirGeo, ulkeler };
}

export function ulkeMeshYap({ dolgu, sinir }, { seciliRenk = "#ffb454" } = {}) {
  const malzeme = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  malzeme.onBeforeCompile = (shader) => {
    shader.uniforms.uSecili = { value: -1 };
    shader.uniforms.uSeciliRenk = { value: new THREE.Color(seciliRenk) };
    malzeme.userData.shader = shader;
    shader.vertexShader = shader.vertexShader
      .replace(
        "void main() {",
        "attribute float aUlke;\nvarying float vUlke;\nvoid main() {\n  vUlke = aUlke;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform float uSecili;\nuniform vec3 uSeciliRenk;\nvarying float vUlke;\nvoid main() {"
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
         float sec = step(abs(vUlke - uSecili), 0.5);
         diffuseColor.rgb = mix(diffuseColor.rgb, uSeciliRenk, sec * 0.85);`
      );
  };

  const mesh = new THREE.Mesh(dolgu, malzeme);
  mesh.renderOrder = 1;

  const sinirMalzeme = new THREE.LineBasicMaterial({
    color: "#cfe2f4",
    transparent: true,
    opacity: 0.5,
  });
  const sinirCizgi = new THREE.LineSegments(sinir, sinirMalzeme);
  sinirCizgi.renderOrder = 2;

  return { mesh, sinirCizgi, malzeme, sinirMalzeme };
}

export function sehirGeometrisi(sehirler) {
  const n = sehirler.length;
  const poz = new Float32Array(n * 3);
  const nufus = new Float32Array(n);
  const baskent = new Float32Array(n);

  sehirler.forEach(([lon, lat, pop, , , cap], i) => {
    const p = koordinatVektor(lon, lat, YARICAP * 1.004);
    poz.set([p.x, p.y, p.z], i * 3);
    nufus[i] = pop;
    baskent[i] = cap;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(poz, 3));
  geo.setAttribute("aNufus", new THREE.BufferAttribute(nufus, 1));
  geo.setAttribute("aBaskent", new THREE.BufferAttribute(baskent, 1));
  geo.computeBoundingSphere();
  return geo;
}

export function sehirMalzeme() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uEsik: { value: 1e7 },
      uBoyut: { value: 5.0 },
      uRenk: { value: new THREE.Color("#ffb454") },
      uBaskentRenk: { value: new THREE.Color("#f4f7ff") },
    },
    vertexShader: /* glsl */ `
      attribute float aNufus;
      attribute float aBaskent;
      uniform float uEsik;
      uniform float uBoyut;
      varying float vBaskent;

      void main() {
        vBaskent = aBaskent;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float gorunur = step(uEsik, aNufus);
        gl_PointSize = gorunur * uBoyut * (1.0 + aBaskent * 0.55);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uRenk;
      uniform vec3 uBaskentRenk;
      varying float vBaskent;

      void main() {
        vec2 d = abs(gl_PointCoord - vec2(0.5));
        // sembolik kutucuk: yumuşak kenarlı kare
        float a = smoothstep(0.5, 0.42, max(d.x, d.y));
        if (a < 0.02) discard;
        vec3 renk = mix(uRenk, uBaskentRenk, vBaskent);
        gl_FragColor = vec4(renk, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

export function yildizAlani({ adet = 4200, ic = 40, dis = 120 } = {}) {
  const konum = new Float32Array(adet * 3);
  const parlaklik = new Float32Array(adet);
  const v = new THREE.Vector3();
  for (let i = 0; i < adet; i++) {
    v.setFromSphericalCoords(
      ic + Math.pow(Math.random(), 0.6) * (dis - ic),
      Math.acos(2 * Math.random() - 1),
      Math.random() * Math.PI * 2
    );
    konum.set([v.x, v.y, v.z], i * 3);
    parlaklik[i] = 0.25 + Math.pow(Math.random(), 2.4) * 0.6;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(konum, 3));
  g.setAttribute("aParlaklik", new THREE.BufferAttribute(parlaklik, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uZaman: { value: 0 }, uBoyut: { value: 1.15 } },
    vertexShader: /* glsl */ `
      attribute float aParlaklik;
      varying float vP;
      uniform float uZaman;
      uniform float uBoyut;
      void main() {
        vP = aParlaklik * (0.88 + 0.12 * sin(uZaman * 1.3 + aParlaklik * 40.0));
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uBoyut * (0.7 + aParlaklik) * (260.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vP;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        if (length(d) > 0.5) discard;
        gl_FragColor = vec4(vec3(0.8, 0.86, 1.0), smoothstep(0.5, 0.0, length(d)) * vP);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

export function atmosfer(yaricap = YARICAP) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(yaricap * 1.06, 96, 64),
    new THREE.ShaderMaterial({
      uniforms: { uKamera: { value: new THREE.Vector3() } },
      vertexShader: /* glsl */ `
        varying vec3 vN;
        varying vec3 vP;
        void main() {
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 w = modelMatrix * vec4(position, 1.0);
          vP = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uKamera;
        varying vec3 vN;
        varying vec3 vP;
        void main() {
          vec3 bakis = normalize(uKamera - vP);
          float y = pow(1.0 - abs(dot(bakis, normalize(vN))), 3.6);
          gl_FragColor = vec4(vec3(0.32, 0.55, 0.78), 1.0) * y * 0.55;
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
}

/**
 * Ülke kimlik haritası: eşdikdörtgen 2D tuvale her ülke benzersiz renkle çizilir.
 * Hover'da lat/lon → piksel → ülke. Ağır raycast gerekmez.
 */
export function kimlikHaritasi(ulkeler, gen = 2048) {
  const yuk = gen / 2;
  const cv = document.createElement("canvas");
  cv.width = gen;
  cv.height = yuk;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, gen, yuk);

  ulkeler.forEach((ulke, i) => {
    const id = i + 1;
    // 8'lik adım: kenar yumuşatma karışımları geçersiz renk üretir, ayıklanır
    ctx.fillStyle = `rgb(${(id & 31) * 8}, ${((id >> 5) & 31) * 8}, 0)`;
    for (const pol of ulke.g) {
      for (const ring of pol) {
        const acik = halkaAc(ring);
        const xs = acik.map((p) => ((p[0] + 180) / 360) * gen);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        // 180. boylamı aşan halkaları kaydırarak çiz
        for (let kaydir = Math.floor(minX / gen) * gen; kaydir <= maxX; kaydir += gen) {
          ctx.beginPath();
          acik.forEach(([lon, lat], j) => {
            const x = ((lon + 180) / 360) * gen + kaydir;
            const y = ((90 - lat) / 180) * yuk;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  });

  const veri = ctx.getImageData(0, 0, gen, yuk).data;
  return {
    gen,
    yuk,
    ulkeBul(lon, lat) {
      const x0 = Math.floor(((lon + 180) / 360) * gen);
      const y0 = Math.floor(((90 - lat) / 180) * yuk);
      if (y0 < 0 || y0 >= yuk) return -1;
      // 5x5 komşuluk: kenar yumuşatma pikselleri elenir, çoğunluk kazanır
      const oylar = new Map();
      for (let dy = -2; dy <= 2; dy++) {
        const y = y0 + dy;
        if (y < 0 || y >= yuk) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const x = (((x0 + dx) % gen) + gen) % gen;
          const i = (y * gen + x) * 4;
          const r = veri[i];
          const g = veri[i + 1];
          if (r % 8 !== 0 || g % 8 !== 0) continue;
          const id = r / 8 + (g / 8) * 32;
          if (id === 0) continue;
          oylar.set(id, (oylar.get(id) || 0) + (dx === 0 && dy === 0 ? 2 : 1));
        }
      }
      let enId = -1;
      let enOy = 0;
      for (const [id, oy] of oylar) {
        if (oy > enOy) {
          enOy = oy;
          enId = id;
        }
      }
      return enId > 0 ? enId - 1 : -1;
    },
  };
}
