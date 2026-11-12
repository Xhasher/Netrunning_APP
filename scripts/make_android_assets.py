"""Genera icone e splash screen Android in resources/android/res.

Uso: python3 scripts/make_android_assets.py   (richiede Pillow)
Il workflow di build copia poi resources/android/res dentro il progetto Android.
"""
from pathlib import Path
from PIL import Image, ImageDraw

BG = (7, 7, 12, 255)
CYAN = (0, 240, 255, 255)
YELLOW = (252, 238, 10, 255)
PINK = (255, 42, 109, 255)
OUT = Path(__file__).resolve().parent.parent / 'resources' / 'android' / 'res'
SS = 4  # supersampling per bordi lisci


def glyph(size: int) -> Image.Image:
    """Il simbolo ">_" del prompt, su sfondo trasparente, in un quadrato size×size."""
    s = size * SS
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    w = max(2, int(s * 0.11))
    # chevron ">"
    d.line([(s * 0.16, s * 0.22), (s * 0.48, s * 0.50), (s * 0.16, s * 0.78)], fill=CYAN, width=w, joint='curve')
    # cursore "_"
    d.rectangle([s * 0.54, s * 0.70, s * 0.88, s * 0.70 + w], fill=YELLOW)
    # piccolo accento rosa
    d.rectangle([s * 0.54, s * 0.22, s * 0.62, s * 0.22 + w * 0.6], fill=PINK)
    return img.resize((size, size), Image.LANCZOS)


def legacy(size: int, round_: bool) -> Image.Image:
    s = size * SS
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if round_:
        d.ellipse([0, 0, s - 1, s - 1], fill=BG)
    else:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.18, fill=BG)
    img = img.resize((size, size), Image.LANCZOS)
    g = glyph(int(size * 0.62))
    img.alpha_composite(g, ((size - g.width) // 2, (size - g.height) // 2))
    return img


def save(img: Image.Image, rel: str) -> None:
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    img.save(p, optimize=True)


MIPMAPS = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for dpi, n in MIPMAPS.items():
    save(legacy(n, False), f'mipmap-{dpi}/ic_launcher.png')
    save(legacy(n, True), f'mipmap-{dpi}/ic_launcher_round.png')
    fg = n * 108 // 48
    img = Image.new('RGBA', (fg, fg), (0, 0, 0, 0))
    g = glyph(int(fg * 0.42))  # dentro la "zona sicura" delle icone adattive
    img.alpha_composite(g, ((fg - g.width) // 2, (fg - g.height) // 2))
    save(img, f'mipmap-{dpi}/ic_launcher_foreground.png')

SPLASH = {
    'drawable': (480, 320),
    'drawable-land-mdpi': (480, 320), 'drawable-land-hdpi': (800, 480), 'drawable-land-xhdpi': (1280, 720),
    'drawable-land-xxhdpi': (1600, 960), 'drawable-land-xxxhdpi': (1920, 1280),
    'drawable-port-mdpi': (320, 480), 'drawable-port-hdpi': (480, 800), 'drawable-port-xhdpi': (720, 1280),
    'drawable-port-xxhdpi': (960, 1600), 'drawable-port-xxxhdpi': (1280, 1920),
}
for folder, (w, h) in SPLASH.items():
    img = Image.new('RGBA', (w, h), BG)
    g = glyph(int(min(w, h) * 0.28))
    img.alpha_composite(g, ((w - g.width) // 2, (h - g.height) // 2))
    save(img.convert('RGB'), f'{folder}/splash.png')

(OUT / 'values').mkdir(parents=True, exist_ok=True)
(OUT / 'values' / 'ic_launcher_background.xml').write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#07070C</color>\n</resources>\n'
)
print('ok:', OUT)
