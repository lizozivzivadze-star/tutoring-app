#!/usr/bin/env python3
"""
public/icons/ui-ის PNG ხატულების მომზადება ორიგინალებიდან.

წყარო: scripts/icon-src/<name>.png (ორიგინალი 20x20, არ იცვლება).
შედეგი: public/icons/ui/<name>.png, <name>@2x.png, <name>@3x.png.

რას აკეთებს (ზომა და ხაზის სისქე არ იცვლება):
1. ხატულას მთელი პიქსელებით ცენტრში აწყობს 20x20 ველში (ზუსტად ერთმანეთის
   ქვეშ ჯდება, გადაადგილება რესემპლინგის გარეშე, ანუ არ ბუნდოვდება).
2. @2x/@3x-ისთვის: დიდ ზომამდე ადიდებს (Lanczos), კიდეებს ამკვეთრებს
   (alpha სიგლუვის მრუდი) ისე, რომ "მელნის" რაოდენობა ორიგინალის ტოლი
   დარჩეს (ხატულა არ გაფერმკრთალდეს), და სამიზნე ზომამდე ჩამოაქვს.

გაშვება პროექტის ფესვიდან:  python3 scripts/enhance-icons.py   (pip install pillow numpy)
"""
import glob
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "scripts", "icon-src")
OUT = os.path.join(ROOT, "public", "icons", "ui")
BASE = 20
SS = 4          # supersampling მაგ. 3x სამიზნეზე ვმუშაობთ 3*4=12x ზომაზე
STEEP = 7.0     # კიდეების სიმკვეთრე (დიდი = უფრო მკვეთრი)


def ink(a):
    return float(a.sum())


def center_shift(alpha):
    ys, xs = np.where(alpha > 0.3)
    cx = (xs.min() + xs.max() + 1) / 2
    cy = (ys.min() + ys.max() + 1) / 2
    return int(round(BASE / 2 - cx)), int(round(BASE / 2 - cy))


def shift_rgba(arr, dx, dy):
    out = np.zeros_like(arr)
    h, w = arr.shape[:2]
    ys0, ys1 = max(0, dy), min(h, h + dy)
    xs0, xs1 = max(0, dx), min(w, w + dx)
    out[ys0:ys1, xs0:xs1] = arr[ys0 - dy : ys1 - dy, xs0 - dx : xs1 - dx]
    return out


def curve(x, mid):
    """სიგმოიდი, რომელიც 0-ზე ზუსტად 0-ია და 1-ზე ზუსტად 1 (ფონზე ბინდი არ დარჩეს)"""
    f = lambda v: 1 / (1 + np.exp(-STEEP * (v - mid)))
    f0, f1 = f(0.0), f(1.0)
    return np.clip((f(x) - f0) / (f1 - f0), 0.0, 1.0)


def sharpen_to_mass(alpha_big, target_mass):
    """alpha-ს მრუდით ვამკვეთრებთ; მიდების წერტილს ვეძებთ ისე, რომ ჯამი = target"""
    lo, hi = 0.0, 1.0
    for _ in range(30):
        mid = (lo + hi) / 2
        a = curve(alpha_big, mid)
        # ჯამი ზომის გათვალისწინებით (target 1x ზომაზეა)
        if a.sum() / (alpha_big.shape[0] / BASE) ** 2 > target_mass:
            lo = mid
        else:
            hi = mid
    mid = (lo + hi) / 2
    return curve(alpha_big, mid)


def build(path):
    img = Image.open(path).convert("RGBA")
    arr = np.asarray(img).astype(np.float32) / 255.0
    dx, dy = center_shift(arr[..., 3])
    arr = shift_rgba(arr, dx, dy)
    base_img = Image.fromarray((arr * 255 + 0.5).astype(np.uint8), "RGBA")
    mass = ink(arr[..., 3])
    outs = {"": base_img}
    for scale in (2, 3):
        size = BASE * scale * SS
        pm = Image.fromarray((arr * 255 + 0.5).astype(np.uint8), "RGBA").convert("RGBa")
        big = np.asarray(pm.resize((size, size), Image.LANCZOS).convert("RGBA")).astype(np.float32) / 255.0
        a = sharpen_to_mass(np.clip(big[..., 3], 0, 1), mass)
        big[..., 3] = a
        res = Image.fromarray((np.clip(big, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA")
        # დაპატარავება ყუთით (box) = სუფთა ანტიალიასინგი
        outs[f"@{scale}x"] = res.resize((BASE * scale, BASE * scale), Image.BOX)
    return outs


def main():
    for path in sorted(glob.glob(os.path.join(SRC, "*.png"))):
        name = os.path.basename(path)[:-4]
        for suffix, im in build(path).items():
            im.save(os.path.join(OUT, f"{name}{suffix}.png"))
        print("ok", name)


if __name__ == "__main__":
    main()
