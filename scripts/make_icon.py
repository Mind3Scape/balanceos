#!/usr/bin/env python3
"""Generate the BalanceOS app icon: the in-app glass orb (airy slate sphere,
white catchlight, a hint of living colour mist) glowing on deep navy. Pure
stdlib — writes RGBA PNGs by hand (no Pillow/cairo needed)."""
import zlib, struct, math

def lerp(a, b, t): return a + (b - a) * t
def clamp(v, lo=0.0, hi=1.0): return lo if v < lo else hi if v > hi else v
def smooth(t): t = clamp(t); return t * t * (3 - 2 * t)
def mix(c1, c2, t): return tuple(lerp(c1[i], c2[i], t) for i in range(3))

# Orb palette — matches the in-app SiriOrb "awake" tint.
HI   = (0xff, 0xff, 0xff)   # specular white
LITE = (0xdb, 0xe6, 0xf6)   # light periwinkle
MID  = (0x7a, 0xa4, 0xd0)   # slate blue
DEEP = (0x24, 0x3b, 0x5c)   # deep navy edge
TEAL = (0x96, 0xe0, 0xe4)   # mist blob 1
VIOL = (0x96, 0xa2, 0xec)   # mist blob 2
GLOW = (0x7a, 0xa4, 0xd0)   # outer halo
BG_TOP = (0x10, 0x1c, 0x36) # background centre-top
BG_EDG = (0x05, 0x07, 0x0d) # background edge

# Light direction (up-left-front), normalised.
_lx, _ly, _lz = -0.48, -0.58, 0.66
_ll = math.sqrt(_lx*_lx + _ly*_ly + _lz*_lz)
LX, LY, LZ = _lx/_ll, _ly/_ll, _lz/_ll

def blob(dx, dy, bx, by, s):
    d2 = ((dx-bx)**2 + (dy-by)**2) / (s*s)
    return math.exp(-d2)

def render(size, orb_frac, path):
    cx = cy = size / 2.0
    R = size * orb_frac
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # PNG filter: None
        for x in range(size):
            px = x + 0.5; py = y + 0.5
            # ---- background: soft radial navy + gentle downward vignette ----
            br = math.hypot(px - cx, py - cy) / (size * 0.72)
            bcol = mix(BG_TOP, BG_EDG, smooth(br))
            vig = smooth((py / size - 0.5) * 0.6 + 0.5)
            bcol = mix(bcol, BG_EDG, vig * 0.25)
            r, g, b = bcol
            a = 255.0

            dx = (px - cx) / R; dy = (py - cy) / R
            d2 = dx*dx + dy*dy
            dist = math.hypot(px - cx, py - cy)

            # ---- outer glow (halo) — also painted UNDER the orb so the
            # anti-aliased silhouette blends into light, never a dark ring ----
            gd = max(0.0, (dist - R) / (R * 0.95))
            if gd < 1.7:
                halo = math.exp(-gd * 2.2) * 0.72
                r = r + (GLOW[0] - r) * halo
                g = g + (GLOW[1] - g) * halo
                b = b + (GLOW[2] - b) * halo

            # ---- the sphere ----
            if d2 <= 1.0:
                nz = math.sqrt(max(0.0, 1.0 - d2))
                diff = clamp(dx*LX + dy*LY + nz*LZ)      # diffuse term
                # base colour: deep -> mid -> light along the light gradient
                if diff < 0.5:
                    base = mix(DEEP, MID, smooth(diff / 0.5))
                else:
                    base = mix(MID, LITE, smooth((diff - 0.5) / 0.5))
                cr, cg, cb = base
                # living colour mist (two soft blobs), modulated by surface
                m_t = blob(dx, dy, 0.34, -0.30, 0.5) * 0.36 * (0.4 + 0.6*nz)
                m_v = blob(dx, dy, -0.34, 0.34, 0.55) * 0.32 * (0.4 + 0.6*nz)
                cr = cr + (TEAL[0]-cr)*m_t + (VIOL[0]-cr)*m_v
                cg = cg + (TEAL[1]-cg)*m_t + (VIOL[1]-cg)*m_v
                cb = cb + (TEAL[2]-cb)*m_t + (VIOL[2]-cb)*m_v
                # tight specular catchlight (top-left)
                spec = clamp(dx*LX + dy*LY + nz*LZ)
                spec = spec ** 42
                cr += (HI[0]-cr)*spec; cg += (HI[1]-cg)*spec; cb += (HI[2]-cb)*spec
                # luminous Fresnel rim at the silhouette — keeps the edge bright
                # so it melts into the glow (no dark cut-out ring / outline)
                fres = (1.0 - nz) ** 2.0
                cr = cr + (0xe2-cr)*fres*0.55
                cg = cg + (0xee-cg)*fres*0.55
                cb = cb + (0xff-cb)*fres*0.55
                # anti-aliased edge -> blend onto the (glowing) background
                edge = clamp((1.0 - math.sqrt(d2)) * R / 2.0)
                r = lerp(r, cr, edge); g = lerp(g, cg, edge); b = lerp(b, cb, edge)

            raw += bytes((int(clamp(r,0,255)), int(clamp(g,0,255)),
                          int(clamp(b,0,255)), int(a)))
    _write_png(path, size, size, raw)

def _chunk(tag, data):
    c = struct.pack(">I", len(data)) + tag + data
    return c + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

def _write_png(path, w, h, raw):
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", idat) + _chunk(b"IEND", b""))
    print("wrote", path)

if __name__ == "__main__":
    render(512, 0.345, "icons/icon-512.png")
    render(512, 0.265, "icons/icon-512-maskable.png")  # smaller orb: maskable safe zone
    print("done")
