import * as THREE from "three";
import { koordinatVektor } from "./sembol.js";

// İlan katmanı: her şehirde kaç ilan varsa o kadar büyüyen nokta.
// Nokta boyutu ekranda sabit kalır (zoom'dan bağımsız), adet arttıkça büyür.

export function pazarKatmani() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
  geo.setAttribute("aAdet", new THREE.BufferAttribute(new Float32Array(0), 1));
  geo.setAttribute("aIdx", new THREE.BufferAttribute(new Float32Array(0), 1));
  geo.setAttribute("aBenim", new THREE.BufferAttribute(new Float32Array(0), 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uEsik: { value: 1 },
      uBoyut: { value: 10 },
      uRenk: { value: new THREE.Color("#ffb454") },
      uCekirdek: { value: new THREE.Color("#fff3e0") },
      uSecili: { value: -1 },
      uZaman: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aAdet;
      attribute float aIdx;
      attribute float aBenim;
      uniform float uEsik;
      uniform float uBoyut;
      uniform float uSecili;
      varying float vAdet;
      varying float vSecili;
      varying float vBenim;

      void main() {
        vAdet = aAdet;
        vSecili = step(abs(aIdx - uSecili), 0.5);
        vBenim = aBenim;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        // ufkun arkasındaki noktalar kürenin içinden görünmesin
        float onde = step(1.0 / length(cameraPosition) + 0.015, dot(normalize(position), normalize(cameraPosition)));
        float gorunur = step(uEsik, aAdet) * onde;
        float boy = uBoyut * (0.85 + sqrt(aAdet) * 0.26) * (1.0 + vSecili * 0.35) * (1.0 + aBenim * 0.22);
        gl_PointSize = gorunur * min(boy, 46.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uRenk;
      uniform vec3 uCekirdek;
      uniform float uZaman;
      varying float vAdet;
      varying float vSecili;
      varying float vBenim;

      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        float r = length(d) * 2.0;
        if (r > 1.0) discard;

        // dış halka + iç dolgu: harita işareti görünümü
        float halka = smoothstep(1.0, 0.90, r) * smoothstep(0.62, 0.70, r);
        float disHalka = vBenim * smoothstep(1.0, 0.94, r) * smoothstep(0.86, 0.90, r);
        float dolgu = smoothstep(0.56, 0.46, r);
        float nabiz = 0.75 + 0.25 * sin(uZaman * (2.2 + vBenim * 1.5) + vAdet);

        vec3 halkaRenk = mix(uRenk, uCekirdek, vBenim * 0.85);
        vec3 renk = mix(halkaRenk, uCekirdek, dolgu);
        float alfa = max(halka * 0.85 * nabiz, dolgu);
        alfa = max(alfa, disHalka * 0.9 * nabiz);
        alfa *= 1.0 + vSecili * 0.25;
        gl_FragColor = vec4(renk, min(alfa, 1.0));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  const nokta = new THREE.Points(geo, mat);
  nokta.frustumCulled = false;
  nokta.renderOrder = 20;

  let iller = [];

  function guncelle(yeniIller) {
    iller = yeniIller;
    const n = iller.length;
    const poz = new Float32Array(n * 3);
    const adet = new Float32Array(n);
    const idx = new Float32Array(n);
    const benim = new Float32Array(n);

    iller.forEach((il, i) => {
      const p = koordinatVektor(il.lon, il.lat, 1.006);
      poz.set([p.x, p.y, p.z], i * 3);
      adet[i] = il.ilanlar.length;
      idx[i] = i;
      benim[i] = il.benim ? 1 : 0;
    });

    geo.setAttribute("position", new THREE.BufferAttribute(poz, 3));
    geo.setAttribute("aAdet", new THREE.BufferAttribute(adet, 1));
    geo.setAttribute("aIdx", new THREE.BufferAttribute(idx, 1));
    geo.setAttribute("aBenim", new THREE.BufferAttribute(benim, 1));
    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingSphere();
  }

  // Ekran uzayında en yakın ilan noktası
  function ekrandaBul(kamera, x, y, gen, yuk, sinir = 22) {
    let en = sinir * sinir;
    let bulunan = -1;
    const kamYon = kamera.position.clone().normalize();
    const esik = 1 / kamera.position.length();
    const v = new THREE.Vector3();

    iller.forEach((il, i) => {
      if (il.ilanlar.length < mat.uniforms.uEsik.value) return;
      v.copy(koordinatVektor(il.lon, il.lat, 1.006));
      if (v.dot(kamYon) < esik) return;
      const n = v.project(kamera);
      if (n.z > 1) return;
      const px = ((n.x + 1) / 2) * gen;
      const py = ((1 - n.y) / 2) * yuk;
      const d2 = (px - x) ** 2 + (py - y) ** 2;
      if (d2 < en) {
        en = d2;
        bulunan = i;
      }
    });
    return bulunan;
  }

  return { nokta, malzeme: mat, guncelle, ekrandaBul, get iller() { return iller; } };
}
