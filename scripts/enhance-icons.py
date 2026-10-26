#!/usr/bin/env python3
"""
public/icons/ui-ის PNG ხატულების @2x/@3x ვერსიების ხარისხის გაუმჯობესება.

ძირითადი ფაილი (name.png, 20x20) რჩება უცვლელი. @2x და @3x მისგან თავიდან
მზადდება: Lanczos-ით დიდ ზომამდე გადიდება (premultiplied alpha-ზე, რომ
ფერები არ "გაიცხელოს"), კიდეების გამკვეთრება alpha არხზე, შემდეგ
Lanczos-ით დაპატარავება სამიზნე ზომამდე და მსუბუქი unsharp.

გაშვება პროექტის ფესვიდან:  python3 scripts/enhance-icons.py
საჭიროა: pip install pillow
"""
import glob
import os
from PIL import Image, ImageFilter

DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons", "ui")
BASE = 20          # 1x ზომა
WORK = 240         # შუალედური დიდი ზომა
GAIN = 1.6         # კიდეების სიმკვეთრე (1 = გამორთული)
SKIP = {"check-green"}  # 1x და @3x ამ ხატულას სხვადასხვა გამოსახულებაა, არ ვეხებით


def sharpen_alpha(img: Image.Image) -> Image.Image:
    r, g, b, a = img.split()
    lut = []
    for v in range(256):
        x = v / 255.0
        y = 0.5 + (x - 0.5) * GAIN
        lut.append(int(max(0.0, min(1.0, y)) * 255 + 0.5))
    return Image.merge("RGBA", (r, g, b, a.point(lut)))


def enhance(src_path: str, scale: int) -> Image.Image:
    src = Image.open(src_path).convert("RGBa")  # premultiplied
    big = src.resize((WORK, WORK), Image.LANCZOS).convert("RGBA")
    big = sharpen_alpha(big)
    size = BASE * scale
    out = big.resize((size, size), Image.LANCZOS)
    return out.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=0))


def main():
    names = sorted(
        {
            os.path.basename(f).split("@")[0].replace(".png", "")
            for f in glob.glob(os.path.join(DIR, "*.png"))
        }
    )
    for n in names:
        if n in SKIP:
            continue
        base = os.path.join(DIR, f"{n}.png")
        for scale in (2, 3):
            enhance(base, scale).save(os.path.join(DIR, f"{n}@{scale}x.png"))
        print("ok", n)


if __name__ == "__main__":
    main()
