#!/usr/bin/env python3
"""Natural Earth GeoJSON'larını site için küçük JSON'a indirger.

- Ülkeler: ad (Türkçe), ISO2, kıta, çokgen halkaları (3 ondalık, Douglas-Peucker)
- Şehirler: [lon, lat, nüfus, ad, ülke, başkent]

Kullanım: python3 tools/veri_hazirla.py
"""
import json
import pathlib

KOK = pathlib.Path(__file__).resolve().parent.parent
KAYNAK = KOK / "public" / "veri"


def sadelestir(noktalar, tolerans):
    """Douglas-Peucker; noktalar [(lon, lat), ...] kapalı halka."""
    if len(noktalar) < 5:
        return noktalar

    def rdp(pts):
        if len(pts) < 3:
            return pts
        (x1, y1), (x2, y2) = pts[0], pts[-1]
        dx, dy = x2 - x1, y2 - y1
        norm = (dx * dx + dy * dy) ** 0.5
        en, idx = -1.0, 0
        for i in range(1, len(pts) - 1):
            x, y = pts[i]
            if norm == 0:
                d = ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
            else:
                d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm
            if d > en:
                en, idx = d, i
        if en <= tolerans:
            return [pts[0], pts[-1]]
        return rdp(pts[: idx + 1])[:-1] + rdp(pts[idx:])

    kapali = noktalar[0] == noktalar[-1]
    govde = noktalar[:-1] if kapali else noktalar
    sade = rdp(govde + [govde[0]])[:-1]
    if len(sade) < 3:
        return noktalar
    return sade + [sade[0]]


def halka(h, tolerans):
    return [[round(x, 3), round(y, 3)] for x, y in sadelestir([(p[0], p[1]) for p in h], tolerans)]


def ulkeler():
    d = json.loads((KAYNAK / "ne_50m_admin_0_countries.geojson").read_text())
    cikti = []
    for f in d["features"]:
        p = f["properties"]
        g = f["geometry"]
        if not g:
            continue
        tip = g["type"]
        poligonlar = g["coordinates"] if tip == "MultiPolygon" else [g["coordinates"]]
        temiz = []
        for pol in poligonlar:
            ringler = []
            for i, r in enumerate(pol):
                s = halka(r, 0.035 if i == 0 else 0.02)
                # çok küçük adacıkları at
                if len(s) >= 4:
                    ringler.append(s)
            if ringler:
                temiz.append(ringler)
        if not temiz:
            continue
        cikti.append(
            {
                "n": p.get("NAME_TR") or p.get("NAME"),
                "e": p.get("NAME") or "",
                "i": p.get("ISO_A2") if p.get("ISO_A2") not in ("-99", None) else "",
                "k": p.get("CONTINENT") or "",
                "g": temiz,
            }
        )
    cikti.sort(key=lambda u: u["n"])
    (KAYNAK / "ulkeler.json").write_text(json.dumps(cikti, ensure_ascii=False, separators=(",", ":")))
    return cikti


def sehirler():
    d = json.loads((KAYNAK / "ne_10m_populated_places_simple.geojson").read_text())
    cikti = []
    for f in d["features"]:
        p = f["properties"]
        pop = int(p.get("pop_max") or 0)
        if pop < 5000:
            continue
        cikti.append(
            [
                round(float(p["longitude"]), 3),
                round(float(p["latitude"]), 3),
                pop,
                p.get("name") or p.get("nameascii") or "",
                p.get("adm0name") or "",
                1 if p.get("adm0cap") == 1 else 0,
            ]
        )
    cikti.sort(key=lambda s: -s[2])
    (KAYNAK / "sehirler.json").write_text(json.dumps(cikti, ensure_ascii=False, separators=(",", ":")))
    return cikti


if __name__ == "__main__":
    u = ulkeler()
    s = sehirler()
    for ad, veri in (("ulkeler.json", u), ("sehirler.json", s)):
        boyut = (KAYNAK / ad).stat().st_size
        print(f"{ad:16s} {len(veri):5d} kayıt  {boyut/1024:8.1f} KB")
    nokta = sum(len(r) for u_ in u for pol in u_["g"] for r in pol)
    print(f"ülke halka noktası: {nokta}")
