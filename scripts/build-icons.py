"""
ხატულების გენერატორი.

რას აკეთებს: ყოველ .ico-დან (20x20) ხატულას ჭრის ზუსტად შიგთავსზე, ზომავს
სასურველ ზომაზე ერთხელ (Lanczos) და სვამს 20x20 (1x), 40x40 (2x), 60x60 (3x)
ტილოს ზუსტ ცენტრში, მთელ პიქსელზე. ამის შემდეგ ბრაუზერს აღარაფრის
გადიდება/გადაწევა არ სჭირდება (s=1, offset=0) და ხატულა არ ბუნდდება.

გაშვება:  python3 scripts/build-icons.py <ico-ების საქაღალდე>
"""
import sys, os
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons", "ui")

# სახელი -> (ico ფაილი, სასურველი ზომა CSS პიქსელში: შიგთავსის უდიდესი გვერდი)
# ზომები იგივეა, რაც ადრე ხელით იყო მორგებული (ძველი FIT-ის s * შიგთავსი).
ICONS = {
    "x":          ("x.ico",          16.1),
    "plus":       ("_.ico",          16.5),
    "edit":       ("edit.ico",       17.1),
    "send-url":   ("sendURL.ico",    19.0),
    "results":    ("results.ico",    19.0),
    "check":      ("check.ico",      17.5),
    "profile":    ("profile.ico",    17.4),
    "red-button": ("red_button.ico", 19.4),
    "log-out":    ("log_out.ico",    16.8),
    "feedback":   ("feedback.ico",   17.6),
}

def even(v):
    return max(2, int(round(v / 2.0)) * 2)

def render(src, src_per_css, target_css, k):
    """src: RGBA სურათი; src_per_css: რამდენი src-პიქსელია 1 CSS პიქსელზე."""
    a = src.getchannel("A").point(lambda v: 255 if v > 8 else 0)
    bb = a.getbbox()
    crop = src.crop(bb)
    w, h = crop.size
    scale = (target_css * k) / max(w, h)
    nw, nh = even(w * scale), even(h * scale)
    pm = crop.convert("RGBa")
    pm = pm.resize((nw, nh), Image.LANCZOS) if (nw, nh) != (w, h) else pm
    rs = pm.convert("RGBA")
    canvas = Image.new("RGBA", (20 * k, 20 * k), (0, 0, 0, 0))
    canvas.alpha_composite(rs, ((20 * k - nw) // 2, (20 * k - nh) // 2))
    return canvas

for name, (fn, target) in ICONS.items():
    src = Image.open(os.path.join(SRC, fn)).convert("RGBA")
    assert src.size == (20, 20), (fn, src.size)
    for k, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        render(src, 1, target, k).save(os.path.join(OUT, f"{name}{suffix}.png"))

# მწვანე თოლია: წყარო არის არსებული 60x60 (@3x) ფაილი (ორიგინალი ინახება .orig-ში)
g_src_path = os.path.join(os.path.dirname(__file__), "icon-sources", "check-green@3x.orig.png")
g = Image.open(g_src_path).convert("RGBA")
for k, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
    render(g, 3, ICONS["check"][1], k).save(os.path.join(OUT, f"check-green{suffix}.png"))
print("ok")
