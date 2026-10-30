#!/usr/bin/env python3
"""Türkiye il/ilçe sınırlarını harita için hazırlar.

Kaynak: OSM dışa aktarımı (izzetkalic/geojsons-of-turkey)
  turkey-admin-level-4.geojson -> 81 il (ISO3166-2 = TR-xx)
  turkey-admin-level-6.geojson -> ilçeler
Çıktı: public/veri/tr_il.json, public/veri/tr_ilce.json
  - basitleştirilmiş halkalar [lon, lat] (4 ondalık)
  - il -> coğrafi bölge eşlemesi (plaka kodu)
  - ilçe -> il eşlemesi (ilçe merkezi hangi il poligonundaysa)

Kullanım: python3 tools/tr_veri_hazirla.py <level4.geojson> <level6.geojson>
"""
import json
import math
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
CIKTI = KOK / "public" / "veri"

BOLGELER = {
    "Marmara": [34, 22, 39, 59, 17, 10, 16, 77, 41, 54, 11],
    "Ege": [35, 45, 9, 20, 48, 64, 3, 43],
    "Akdeniz": [7, 32, 15, 33, 1, 80, 31, 46],
    "İç Anadolu": [6, 42, 26, 58, 38, 68, 51, 50, 40, 71, 18, 70, 66],
    "Karadeniz": [55, 52, 28, 61, 53, 8, 29, 69, 60, 5, 19, 57, 37, 74, 78, 67, 81, 14],
    "Doğu Anadolu": [25, 24, 36, 75, 76, 4, 65, 49, 13, 12, 23, 62, 44, 30],
    "Güneydoğu Anadolu": [27, 63, 21, 47, 72, 56, 73, 2, 79],
}
PLAKA_BOLGE = {p: b for b, ps in BOLGELER.items() for p in ps}


def yuzey(halka):
    a = 0.0
    for i in range(len(halka) - 1):
        x1, y1 = halka[i]
        x2, y2 = halka[i + 1]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def mesafe_nokta_dogru(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def sadelestir(halka, eps):
    """Douglas–Peucker (yinelemeli, yığınla)."""
    if len(halka) < 4:
        return halka
    n = len(halka)
    tut = [False] * n
    tut[0] = tut[n - 1] = True
    yigin = [(0, n - 1)]
    while yigin:
        i, j = yigin.pop()
        en, idx = 0.0, -1
        for k in range(i + 1, j):
            d = mesafe_nokta_dogru(halka[k], halka[i], halka[j])
            if d > en:
                en, idx = d, k
        if idx != -1 and en > eps:
            tut[idx] = True
            yigin.append((i, idx))
            yigin.append((idx, j))
    return [p for p, t in zip(halka, tut) if t]


def halkalari_al(geom):
    t = geom.get("type")
    if t == "Polygon":
        return [geom["coordinates"][0]]
    if t == "MultiPolygon":
        return [p[0] for p in geom["coordinates"]]
    return []


def temizle(geom, eps, asgari_alan, ondalik=4):
    cikti = []
    for halka in halkalari_al(geom):
        if len(halka) < 4:
            continue
        h = [(round(float(x), ondalik), round(float(y), ondalik)) for x, y in halka]
        if h[0] != h[-1]:
            h.append(h[0])
        h2 = sadelestir(h, eps)
        if len(h2) < 4:
            continue
        tekil = [h2[0]]
        for p in h2[1:]:
            if p != tekil[-1]:
                tekil.append(p)
        if len(tekil) < 4 or tekil[0] != tekil[-1]:
            continue
        if yuzey(tekil) < asgari_alan:
            continue
        cikti.append([[p[0], p[1]] for p in tekil])
    return cikti


def alan_toplam(halkalar):
    return sum(yuzey(h) for h in halkalar)


def merkez(halkalar):
    en = max(halkalar, key=yuzey)
    a = cx = cy = 0.0
    for i in range(len(en) - 1):
        x1, y1 = en[i]
        x2, y2 = en[i + 1]
        f = x1 * y2 - x2 * y1
        a += f
        cx += (x1 + x2) * f
        cy += (y1 + y2) * f
    if abs(a) < 1e-12:
        xs = [p[0] for p in en]
        ys = [p[1] for p in en]
        return [round(sum(xs) / len(xs), 4), round(sum(ys) / len(ys), 4)]
    return [round(cx / (3 * a), 4), round(cy / (3 * a), 4)]


def nokta_poligonda(x, y, halka):
    icinde = False
    j = len(halka) - 1
    for i in range(len(halka)):
        xi, yi = halka[i]
        xj, yj = halka[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-18) + xi:
            icinde = not icinde
        j = i
    return icinde


def ozellikler(yol):
    d = json.load(open(yol, encoding="utf-8"))
    for f in d.get("features", []):
        if f.get("geometry") and f["geometry"].get("type") in ("Polygon", "MultiPolygon"):
            yield f


def main(yol4, yol6):
    CIKTI.mkdir(parents=True, exist_ok=True)

    # ——— iller ———
    iller_ham = {}
    for f in ozellikler(yol4):
        p = f["properties"]
        iso = p.get("ISO3166-2") or ""
        if not iso.startswith("TR-"):
            continue
        ad = (p.get("name:tr") or p.get("name") or "").strip()
        if not ad:
            continue
        plaka = int(iso.split("-")[1])
        halkalar = temizle(f["geometry"], eps=0.0045, asgari_alan=0.0009)
        if not halkalar:
            continue
        alan = alan_toplam(halkalar)
        # aynı il birden çok özellikte geliyorsa en büyük olanı tut
        if plaka not in iller_ham or alan > iller_ham[plaka]["alan"]:
            iller_ham[plaka] = {"ad": ad, "plaka": plaka, "halkalar": halkalar, "alan": alan}

    iller = []
    for plaka in sorted(iller_ham):
        i = iller_ham[plaka]
        iller.append(
            {
                "ad": i["ad"],
                "plaka": plaka,
                "bolge": PLAKA_BOLGE.get(plaka, "İç Anadolu"),
                "merkez": merkez(i["halkalar"]),
                "halkalar": i["halkalar"],
            }
        )

    il_index = []
    for il in iller:
        xs = [p[0] for h in il["halkalar"] for p in h]
        ys = [p[1] for h in il["halkalar"] for p in h]
        il_index.append((il, min(xs), max(xs), min(ys), max(ys)))

    # ——— ilçeler ———
    ham = {}
    for f in ozellikler(yol6):
        p = f["properties"]
        ad = (p.get("name:tr") or p.get("name") or "").strip()
        if not ad or len(ad) < 2:
            continue
        halkalar = temizle(f["geometry"], eps=0.0038, asgari_alan=0.0004)
        if not halkalar:
            continue
        # Yunanca/Kiril adlı komşu ülke parçalarını ele
        if any("\u0370" <= k <= "\u04ff" for k in ad):
            continue
        m = merkez(halkalar)
        # Türkiye dışı (Yunanistan adaları vb.) parçaları ele
        if not (25.5 <= m[0] <= 45.0 and 35.6 <= m[1] <= 42.3):
            continue
        alan = alan_toplam(halkalar)
        anahtar = (ad, round(m[1], 2), round(m[0], 2))  # isim + ~1 km ızgara
        if anahtar not in ham or alan > ham[anahtar]["alan"]:
            ham[anahtar] = {"ad": ad, "halkalar": halkalar, "merkez": m, "alan": alan}

    ilceler = []
    disarida = []
    for kayit in ham.values():
        m = kayit["merkez"]
        bulunan = None
        for il, x0, x1, y0, y1 in il_index:
            if not (x0 <= m[0] <= x1 and y0 <= m[1] <= y1):
                continue
            if any(nokta_poligonda(m[0], m[1], h) for h in il["halkalar"]):
                bulunan = il["ad"]
                break
        if not bulunan:
            ilk = kayit["halkalar"][0][0]
            for il, x0, x1, y0, y1 in il_index:
                if not (x0 <= ilk[0] <= x1 and y0 <= ilk[1] <= y1):
                    continue
                if any(nokta_poligonda(ilk[0], ilk[1], h) for h in il["halkalar"]):
                    bulunan = il["ad"]
                    break
        if not bulunan:
            # ada/taşra: en yakın il sınırına ata
            en_yakin, en_mesafe = None, float("inf")
            for il, x0, x1, y0, y1 in il_index:
                for h in il["halkalar"]:
                    for x, y in h[:: max(1, len(h) // 30)]:
                        d = (x - m[0]) ** 2 + (y - m[1]) ** 2
                        if d < en_mesafe:
                            en_mesafe, en_yakin = d, il["ad"]
            bulunan = en_yakin
            if bulunan:
                disarida.append(f"{kayit['ad']}->{bulunan}")
        if not bulunan:
            continue
        ilceler.append({"ad": kayit["ad"], "il": bulunan, "merkez": m, "halkalar": kayit["halkalar"]})

    ilceler.sort(key=lambda i: (i["il"], i["ad"]))

    (CIKTI / "tr_il.json").write_text(
        json.dumps({"iller": iller}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (CIKTI / "tr_ilce.json").write_text(
        json.dumps({"ilceler": ilceler}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    nokta_il = sum(len(h) for i in iller for h in i["halkalar"])
    nokta_ilce = sum(len(h) for i in ilceler for h in i["halkalar"])
    print(f"il: {len(iller)}  nokta: {nokta_il}")
    print(f"ilçe: {len(ilceler)}  nokta: {nokta_ilce}")
    if disarida:
        print("sınır dışı merkez (en yakın ile atandı):", len(disarida), disarida[:6])
    for ad in ("tr_il.json", "tr_ilce.json"):
        print(f"{ad}: {(CIKTI / ad).stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
