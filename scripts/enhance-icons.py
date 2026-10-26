#!/usr/bin/env python3
"""
public/icons/ui-ის PNG ხატულების მომზადება.

წყარო: scripts/icon-src/<name>.png (ორიგინალი 20x20, არ იცვლება).
შედეგი: public/icons/ui/<name>.png, <name>@2x.png, <name>@3x.png.

რას აკეთებს:
1. ორიგინალს დიდ ზომამდე ადიდებს (Lanczos, premultiplied alpha) და კიდეებს ამკვეთრებს.
2. ხატულას ზუსტად ჭრის საზღვრებამდე და ყველას ერთნაირ ზომის ყუთში (FIT)
   ათავსებს, ცენტრში. ასე ყველა ხატულა ვიზუალურად ერთ სიმაღლეზეა და
   ერთმანეთის ქვეშ ზუსტად ზის (მენიუშიც).
3. სამიზნე ზომამდე (20/40/60) Lanczos-ით პატარავდება და მსუბუქად ამკვეთრებს.

გაშვება პროექტის ფესვიდან:  python3 scripts/enhance-icons.py   (pip install pillow)
"""
import glob
import os
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "scripts", "icon-src")
OUT = os.path.join(ROOT, "public", "icons", "ui")
BASE = 20      # 1x ზომა
WORK = 240     # შუალედური დიდი ზომა (BASE * 12)
FIT = 18       # ხატულის მაქსიმალური გვერდი 1x ზომაზე (დანარჩენი 20-ში არის ველი)
GAIN = 1.6     # კიდეების სიმკვეთრე (1 = გამორთული)


def sharpen_alpha(img):
    r, g, b, a = img.split()
    lut = [
        int(max(0.0, min(1.0, 0.5 + (v / 255.0 - 0.5) * GAIN)) * 255 + 0.5)
        for v in range(256)
    ]
    return Image.merge("RGBA", (r, g, b, a.point(lut)))


def normalized_big(src_path):
    src = Image.open(src_path).convert("RGBa")  # premultiplied
    big = src.resize((WORK, WORK), Image.LANCZOS).convert("RGBA")
    big = sharpen_alpha(big)
    box = big.getchannel("A").point(lambda v: 255 if v > 30 else 0).getbbox()
    glyph = big.crop(box)
    target = FIT * (WORK // BASE)
    k = target / max(glyph.size)
    glyph = glyph.resize(
        (max(1, round(glyph.width * k)), max(1, round(glyph.height * k))), Image.LANCZOS
    )
    canvas = Image.new("RGBA", (WORK, WORK), (0, 0, 0, 0))
    canvas.paste(
        glyph, ((WORK - glyph.width) // 2, (WORK - glyph.height) // 2), glyph
    )
    return canvas


def main():
    for path in sorted(glob.glob(os.path.join(SRC, "*.png"))):
        name = os.path.basename(path)[:-4]
        big = normalized_big(path)
        for scale, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
            size = BASE * scale
            img = big.resize((size, size), Image.LANCZOS).filter(
                ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=0)
            )
            img.save(os.path.join(OUT, f"{name}{suffix}.png"))
        print("ok", name)


if __name__ == "__main__":
    main()
