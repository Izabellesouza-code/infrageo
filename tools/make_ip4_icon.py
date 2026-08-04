from __future__ import annotations

from pathlib import Path

from PIL import Image


def _remove_white_background(im: Image.Image, threshold: int = 245) -> Image.Image:
    out = im.convert("RGBA")
    px = out.load()
    w, h = out.size
    t = int(threshold)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and r >= t and g >= t and b >= t:
                px[x, y] = (r, g, b, 0)
    return out


def _tight_crop_alpha(im: Image.Image, pad: int = 12) -> Image.Image:
    a = im.getchannel("A")
    bbox = a.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.size[0], r + pad)
    b = min(im.size[1], b + pad)
    return im.crop((l, t, r, b))


def build_ip4_icon(src: Path, dst: Path, *, threshold: int = 245, out_size: int = 256, pad: int = 12) -> None:
    base = Image.open(src)
    im = _remove_white_background(base, threshold=threshold)
    im = _tight_crop_alpha(im, pad=pad)

    # Reempacota em um quadrado para ficar bem legível em tamanhos pequenos.
    w, h = im.size
    side = max(w, h)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(im, ((side - w) // 2, (side - h) // 2), im)

    # Redimensiona mantendo nitidez (LANCZOS)
    square = square.resize((out_size, out_size), resample=Image.Resampling.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    square.save(dst, optimize=True)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    src = root / "assets" / "IP4_icone.png"
    dst = root / "static" / "images" / "ip4.png"
    build_ip4_icon(src, dst)
    print(f"wrote {dst} ({dst.stat().st_size} bytes)")

