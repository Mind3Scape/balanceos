#!/usr/bin/env python3
"""Render the BalanceOS welcome animation frames (960×540).

A breathing, slowly colour-morphing glass orb on a soft light field, with a few
drifting particles — the brand's calm "state" feeling. Pure stdlib writes PNG
frames; ffmpeg (see scripts/build_gif.sh) turns them into a clean GIF + MP4."""
import math, struct, zlib, os

W, H = 960, 540
FRAMES = 28
CX, CY = W / 2.0, H / 2.0
R0 = 150.0

def clamp(v, lo=0.0, hi=1.0): return lo if v < lo else hi if v > hi else v
def smooth(t): t = clamp(t); return t * t * (3 - 2 * t)

HI=(255,255,255); LITE=(0xdb,0xe6,0xf6); MID=(0x7a,0xa4,0xd0); DEEP=(0x24,0x3b,0x5c)
TEAL=(0x96,0xe0,0xe4); VIOL=(0x96,0xa2,0xec); GLOW=(0x7a,0xa4,0xd0)
BG_C=(0xee,0xf3,0xfc); BG_E=(0xd6,0xe1,0xf2)

_lx,_ly,_lz = -0.46,-0.56,0.69
_ll = math.sqrt(_lx*_lx+_ly*_ly+_lz*_lz)
LX,LY,LZ = _lx/_ll,_ly/_ll,_lz/_ll

PARTS = [( (i*2.39996)%(2*math.pi), 200+ (i*53 % 150), 0.5+ (i%5)*0.12, i%3 ) for i in range(20)]

def blob(dx,dy,bx,by,s):
    d2=((dx-bx)**2+(dy-by)**2)/(s*s)
    return math.exp(-d2) if d2<12 else 0.0

def build_bg():
    bg=bytearray(W*H*3); diag=math.hypot(W*0.62,H*0.62); i=0
    for y in range(H):
        for x in range(W):
            d=math.hypot(x-CX,y-CY)/diag; t=smooth(d)
            bg[i]=int(BG_C[0]+(BG_E[0]-BG_C[0])*t)
            bg[i+1]=int(BG_C[1]+(BG_E[1]-BG_C[1])*t)
            bg[i+2]=int(BG_C[2]+(BG_E[2]-BG_C[2])*t); i+=3
    return bg

def orb_px(x,y,R,hue,br,bgc,bb):
    dx=(x-CX)/R; dy=(y-CY)/R; d2=dx*dx+dy*dy; dist=math.hypot(x-CX,y-CY)
    if d2>1.0:
        gd=(dist-R)/(R*0.95)
        if gd>=1.7: return None
        halo=math.exp(-gd*2.3)*0.66
        return (br+(GLOW[0]-br)*halo, bgc+(GLOW[1]-bgc)*halo, bb+(GLOW[2]-bb)*halo)
    nz=math.sqrt(max(0.0,1.0-d2)); diff=clamp(dx*LX+dy*LY+nz*LZ)
    if diff<0.5:
        k=smooth(diff/0.5); base=(DEEP[0]+(MID[0]-DEEP[0])*k,DEEP[1]+(MID[1]-DEEP[1])*k,DEEP[2]+(MID[2]-DEEP[2])*k)
    else:
        k=smooth((diff-0.5)/0.5); base=(MID[0]+(LITE[0]-MID[0])*k,MID[1]+(LITE[1]-MID[1])*k,MID[2]+(LITE[2]-MID[2])*k)
    cr,cg,cb=base
    a1=hue*2*math.pi
    mt=blob(dx,dy,0.34*math.cos(a1),0.30*math.sin(a1),0.5)*0.34*(0.4+0.6*nz)
    mv=blob(dx,dy,-0.34*math.cos(a1+2.1),0.34*math.sin(a1+2.1),0.55)*0.30*(0.4+0.6*nz)
    cr+=(TEAL[0]-cr)*mt+(VIOL[0]-cr)*mv; cg+=(TEAL[1]-cg)*mt+(VIOL[1]-cg)*mv; cb+=(TEAL[2]-cb)*mt+(VIOL[2]-cb)*mv
    spec=diff**44; cr+=(HI[0]-cr)*spec; cg+=(HI[1]-cg)*spec; cb+=(HI[2]-cb)*spec
    fres=(1.0-nz)**2.0; cr+=(0xe2-cr)*fres*0.55; cg+=(0xee-cg)*fres*0.55; cb+=(0xff-cb)*fres*0.55
    edge=clamp((1.0-math.sqrt(d2))*R/2.0)
    gd=max(0.0,(dist-R)/(R*0.95)); halo=math.exp(-gd*2.3)*0.66
    er=br+(GLOW[0]-br)*halo; eg=bgc+(GLOW[1]-bgc)*halo; eb=bb+(GLOW[2]-bb)*halo
    return (er+(cr-er)*edge, eg+(cg-eg)*edge, eb+(cb-eb)*edge)

def _chunk(tag,data):
    return struct.pack(">I",len(data))+tag+data+struct.pack(">I",zlib.crc32(tag+data)&0xffffffff)
def write_png(path,raw):
    sig=b"\x89PNG\r\n\x1a\n"; ihdr=struct.pack(">IIBBBBB",W,H,8,2,0,0,0)  # RGB
    open(path,"wb").write(sig+_chunk(b"IHDR",ihdr)+_chunk(b"IDAT",zlib.compress(bytes(raw),6))+_chunk(b"IEND",b""))

def main():
    os.makedirs("frames", exist_ok=True)
    print("field…"); bg=build_bg()
    BB=int(R0*2.7)
    x0,x1=max(0,int(CX-BB)),min(W,int(CX+BB)); y0,y1=max(0,int(CY-BB)),min(H,int(CY+BB))
    for fr in range(FRAMES):
        ph=fr/FRAMES; R=R0*(1+0.045*math.sin(ph*2*math.pi)); hue=ph
        buf=bytearray(bg)                     # start from the static field
        for y in range(y0,y1):
            row=y*W
            for x in range(x0,x1):
                bi=(row+x)*3
                px=orb_px(x,y,R,hue,buf[bi],buf[bi+1],buf[bi+2])
                if px is not None:
                    buf[bi]=int(clamp(px[0],0,255)); buf[bi+1]=int(clamp(px[1],0,255)); buf[bi+2]=int(clamp(px[2],0,255))
        # drifting particles (soft additive dots) — a little life around the orb
        for (a0,rad,sp,h) in PARTS:
            ang=a0+ph*2*math.pi*sp*0.4
            pxc=CX+math.cos(ang)*rad; pyc=CY+math.sin(ang)*rad*0.62
            col=[(255,255,255),(207,225,255),(155,162,236)][h]
            rr=3
            for yy in range(int(pyc-rr),int(pyc+rr+1)):
                if yy<0 or yy>=H: continue
                for xx in range(int(pxc-rr),int(pxc+rr+1)):
                    if xx<0 or xx>=W: continue
                    dd=((xx-pxc)**2+(yy-pyc)**2)/(rr*rr)
                    if dd>1: continue
                    w=(1-dd)*0.5; bi=(yy*W+xx)*3
                    buf[bi]=int(buf[bi]+(col[0]-buf[bi])*w); buf[bi+1]=int(buf[bi+1]+(col[1]-buf[bi+1])*w); buf[bi+2]=int(buf[bi+2]+(col[2]-buf[bi+2])*w)
        # PNG needs a filter byte (0) per scanline
        raw=bytearray()
        for y in range(H):
            raw.append(0); raw += buf[y*W*3:(y+1)*W*3]
        write_png("frames/f%03d.png" % fr, raw)
        print("frame", fr+1, "/", FRAMES)
    print("done — frames/f000..%03d.png" % (FRAMES-1))

if __name__ == "__main__":
    main()
