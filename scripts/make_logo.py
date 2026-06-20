#!/usr/bin/env python3
"""Premium BalanceOS bot logo — a glass "Siri / Apple-Intelligence" orb with
living colour mist (teal · cyan · violet · indigo), a crisp catchlight, a cool
Fresnel rim, on a deep gradient field with a coloured glow. Pure stdlib → PNG.

Renders at 2× then box-downsamples for clean anti-aliasing."""
import math, struct, zlib

SS = 2                 # supersample
OUT = 512
N = OUT * SS
CX = CY = N / 2.0
R = N * 0.355          # orb radius (set per-variant in render())

def clamp(v, lo=0.0, hi=1.0): return lo if v < lo else hi if v > hi else v
def smooth(t): t = clamp(t); return t * t * (3 - 2 * t)
def mix(a, b, t): return (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t)

# Glass body ramp (deep → slate → light) — kept deeper so the colour mist reads.
DEEP = (0x16, 0x24, 0x42)
MID  = (0x4e, 0x7e, 0xc0)
LITE = (0xcf, 0xe1, 0xf8)
HI   = (255, 255, 255)
# Living mist blobs (local-x, local-y, sigma, colour, strength) — vivid & varied,
# like the in-app Siri orb: teal / cyan / violet / magenta / mint swirling inside.
MIST = [
    (0.32, -0.30, 0.44, (0x35, 0xe6, 0xdc), 0.92),   # teal, upper-right
    (-0.34, 0.32, 0.50, (0x86, 0x6c, 0xf4), 0.88),   # violet, lower-left
    (0.02, 0.20, 0.58, (0x46, 0xa6, 0xff), 0.60),    # cyan-blue, centre
    (-0.20, -0.30, 0.34, (0xd6, 0x6c, 0xe8), 0.52),  # magenta accent, upper-left
    (0.40, 0.34, 0.34, (0x52, 0xf0, 0xae), 0.44),    # mint glint, lower-right
]
GLOW = (0x66, 0x9a, 0xe0)        # halo around the orb
BG_TOP = (0x10, 0x1d, 0x3a)      # field centre-top
BG_EDG = (0x05, 0x07, 0x0e)      # field edge

# light dir (up-left-front)
_l = (-0.46, -0.55, 0.70); _ll = math.sqrt(sum(c*c for c in _l))
LX, LY, LZ = _l[0]/_ll, _l[1]/_ll, _l[2]/_ll

def blob(dx, dy, bx, by, s):
    d2 = ((dx-bx)**2 + (dy-by)**2) / (s*s)
    return math.exp(-d2) if d2 < 14 else 0.0

def screen(c, t, k):   # screen-blend colour t into c by weight k
    return (c[0] + (255-c[0])*(t[0]/255.0)*k,
            c[1] + (255-c[1])*(t[1]/255.0)*k,
            c[2] + (255-c[2])*(t[2]/255.0)*k)

def shade(x, y):
    dx = (x - CX) / R; dy = (y - CY) / R
    d2 = dx*dx + dy*dy
    dist = math.hypot(x - CX, y - CY)
    # background field + vignette
    diag = math.hypot(N*0.62, N*0.62)
    t = smooth(dist / diag)
    r, g, b = mix(BG_TOP, BG_EDG, t)
    vig = smooth((y / N - 0.5) * 0.7 + 0.5)
    r, g, b = mix((r, g, b), BG_EDG, vig * 0.22)
    # outer glow (also under the orb edge so the silhouette melts into light)
    gd = max(0.0, (dist - R) / (R * 0.95))
    if gd < 1.8:
        halo = math.exp(-gd * 2.1) * 0.7
        r, g, b = mix((r, g, b), GLOW, halo)
    if d2 <= 1.0:
        nz = math.sqrt(max(0.0, 1.0 - d2))
        diff = clamp(dx*LX + dy*LY + nz*LZ)
        # glassy body
        if diff < 0.5:
            base = mix(DEEP, MID, smooth(diff / 0.5))
        else:
            base = mix(MID, LITE, smooth((diff - 0.5) / 0.5))
        cr, cg, cb = base
        surf = 0.35 + 0.65 * nz                      # mist reads stronger face-on
        for (bx, by, s, col, st) in MIST:
            w = blob(dx, dy, bx, by, s) * st * surf
            if w > 0.001:
                cr, cg, cb = screen((cr, cg, cb), col, w)
        # crisp, tight specular catchlight (small dot, not a broad white wash)
        spec = diff ** 95
        cr += (HI[0]-cr)*spec; cg += (HI[1]-cg)*spec; cb += (HI[2]-cb)*spec
        # cool Fresnel rim → melts the silhouette into light (no dark outline)
        fres = (1.0 - nz) ** 2.0
        cr += (0xe6-cr)*fres*0.55; cg += (0xf0-cg)*fres*0.55; cb += (0xff-cb)*fres*0.55
        edge = clamp((1.0 - math.sqrt(d2)) * R / 2.2)
        er, eg, eb = mix((r, g, b), GLOW, math.exp(-gd*2.1)*0.7)  # glowing edge bg
        r = er + (cr-er)*edge; g = eg + (cg-eg)*edge; b = eb + (cb-eb)*edge
    return (r, g, b)

def _chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag+data) & 0xffffffff)

def render(orb_frac, out_path):
    global R
    R = N * orb_frac
    big = [[shade(x, y) for x in range(N)] for y in range(N)]   # hi-res
    raw = bytearray()
    for oy in range(OUT):
        raw.append(0)
        for ox in range(OUT):
            R0 = G0 = B0 = 0.0
            for j in range(SS):
                for i in range(SS):
                    px = big[oy*SS+j][ox*SS+i]
                    R0 += px[0]; G0 += px[1]; B0 += px[2]
            n = SS*SS
            raw += bytes((int(clamp(R0/n,0,255)), int(clamp(G0/n,0,255)), int(clamp(B0/n,0,255))))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", OUT, OUT, 8, 2, 0, 0, 0)
    open(out_path, "wb").write(
        sig + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + _chunk(b"IEND", b""))
    print("wrote", out_path, OUT, "x", OUT, "(orb", orb_frac, ")")

if __name__ == "__main__":
    render(0.355, "icons/bot-avatar.png")      # Telegram bot avatar (circular crop)
    render(0.345, "icons/icon-512.png")        # PWA / home-screen icon (full-bleed)
    render(0.270, "icons/icon-512-maskable.png")  # maskable: smaller orb for safe zone
