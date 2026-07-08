#!/usr/bin/env python3
from pathlib import Path
import re
import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    KeepTogether,
    Preformatted,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "balanceos-worldview.md"
OUT = ROOT / "docs" / "BalanceOS_Worldview.pdf"

PAGE_W, PAGE_H = A4
MARGIN_X = 22 * mm
MARGIN_TOP = 23 * mm
MARGIN_BOTTOM = 22 * mm
ACCENT = colors.HexColor("#E6B325")
INK = colors.HexColor("#151515")
MUTED = colors.HexColor("#66666A")
SOFT = colors.HexColor("#F5F1E7")
DARK = colors.HexColor("#111114")

FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_ITAL = "/System/Library/Fonts/Supplemental/Arial Italic.ttf"
MONO = "/System/Library/Fonts/SFNSMono.ttf"

for name, path in [
    ("BOSRegular", FONT_REG),
    ("BOSBold", FONT_BOLD),
    ("BOSItalic", FONT_ITAL),
    ("BOSMono", MONO),
]:
    if not Path(path).exists():
        raise SystemExit(f"Missing font: {path}")
    pdfmetrics.registerFont(TTFont(name, path))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="BOSBody", parent=styles["Normal"], fontName="BOSRegular", fontSize=10.7,
    leading=16.2, textColor=INK, spaceAfter=7, alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="BOSBodySmall", parent=styles["BOSBody"], fontSize=9.4, leading=13.4, textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="BOSCoverKicker", parent=styles["Normal"], fontName="BOSBold", fontSize=10.5,
    leading=14, textColor=ACCENT, alignment=TA_CENTER, uppercase=True, spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="BOSCoverTitle", parent=styles["Normal"], fontName="BOSBold", fontSize=35,
    leading=39, textColor=colors.white, alignment=TA_CENTER, spaceAfter=14,
))
styles.add(ParagraphStyle(
    name="BOSCoverSub", parent=styles["Normal"], fontName="BOSRegular", fontSize=14.5,
    leading=21, textColor=colors.HexColor("#E8E2D6"), alignment=TA_CENTER, spaceAfter=28,
))
styles.add(ParagraphStyle(
    name="BOSH1", parent=styles["Heading1"], fontName="BOSBold", fontSize=21.5,
    leading=26, textColor=INK, spaceBefore=4, spaceAfter=11, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="BOSH2", parent=styles["Heading2"], fontName="BOSBold", fontSize=15.2,
    leading=19, textColor=INK, spaceBefore=12, spaceAfter=7, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="BOSH3", parent=styles["Heading3"], fontName="BOSBold", fontSize=12.2,
    leading=16, textColor=colors.HexColor("#2B2B2F"), spaceBefore=9, spaceAfter=5, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="BOSBullet", parent=styles["BOSBody"], leftIndent=13, firstLineIndent=-8, bulletIndent=0,
    spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="BOSQuote", parent=styles["BOSBody"], fontName="BOSItalic", fontSize=12.2,
    leading=18.2, textColor=colors.HexColor("#29251D"), leftIndent=12, rightIndent=8,
    borderColor=ACCENT, borderWidth=1.4, borderPadding=7, spaceBefore=7, spaceAfter=11,
))
styles.add(ParagraphStyle(
    name="BOSCode", parent=styles["Code"], fontName="BOSMono", fontSize=8.6,
    leading=12, textColor=colors.HexColor("#242424"), backColor=colors.HexColor("#F7F4EC"),
    borderColor=colors.HexColor("#E7DEC9"), borderWidth=0.6, borderPadding=7,
    leftIndent=0, rightIndent=0, spaceBefore=6, spaceAfter=9,
))
styles.add(ParagraphStyle(
    name="BOSChapterNo", parent=styles["Normal"], fontName="BOSBold", fontSize=9.5,
    leading=12, textColor=ACCENT, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="BOSTOC", parent=styles["BOSBodySmall"], fontSize=9.5, leading=12.5, spaceAfter=2,
))


def esc(s: str) -> str:
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # lightweight markdown emphasis
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`([^`]+)`", r"<font name='BOSMono' size='8.7'>\1</font>", s)
    return s


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # restrained orbit motif
    cx, cy = PAGE_W / 2, PAGE_H * 0.55
    for r, alpha in [(170, 0.15), (118, 0.18), (64, 0.23)]:
        canvas.setStrokeColor(colors.Color(0.95, 0.78, 0.25, alpha=alpha))
        canvas.setLineWidth(1.0)
        canvas.circle(cx, cy, r)
    canvas.setFillColor(colors.Color(0.95, 0.78, 0.25, alpha=0.16))
    canvas.circle(cx, cy, 42, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.circle(cx, cy, 16, fill=1, stroke=0)
    canvas.restoreState()


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # top hairline
    canvas.setStrokeColor(colors.HexColor("#E8E2D5"))
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN_X, PAGE_H - 14 * mm, PAGE_W - MARGIN_X, PAGE_H - 14 * mm)
    # footer
    canvas.setFillColor(colors.HexColor("#9B958A"))
    canvas.setFont("BOSRegular", 8)
    canvas.drawString(MARGIN_X, 12 * mm, "BalanceOS Worldview")
    canvas.drawRightString(PAGE_W - MARGIN_X, 12 * mm, str(canvas.getPageNumber() - 1))
    canvas.restoreState()


def draw_dynamic_page(canvas, doc):
    if canvas.getPageNumber() == 1:
        draw_cover(canvas, doc)
    else:
        draw_page(canvas, doc)


class BOSDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, rightMargin=MARGIN_X, leftMargin=MARGIN_X,
                         topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM)
        frame = Frame(MARGIN_X, MARGIN_BOTTOM, PAGE_W - 2*MARGIN_X, PAGE_H - MARGIN_TOP - MARGIN_BOTTOM, id="normal")
        self.addPageTemplates([
            PageTemplate(id="All", frames=[frame], onPage=draw_dynamic_page),
        ])


def parse_markdown(md: str):
    lines = md.splitlines()
    story = []
    headings = []
    para = []
    in_code = False
    code = []
    first_h1 = True
    cover_done = False

    def flush_para():
        nonlocal para
        if para:
            text = " ".join(x.strip() for x in para if x.strip())
            if text:
                story.append(Paragraph(esc(text), styles["BOSBody"]))
            para = []

    # Cover page custom from title/subtitle, then body from second thematic break onward
    story.append(Paragraph("BALANCEOS", styles["BOSCoverKicker"]))
    story.append(Spacer(1, 86*mm))
    story.append(Paragraph("Worldview", styles["BOSCoverTitle"]))
    story.append(Paragraph("Операционная система состояния, доверия и реальной жизни", styles["BOSCoverSub"]))
    story.append(Paragraph("Рабочая продуктовая конституция", styles["BOSCoverKicker"]))
    story.append(PageBreak())
    story.append(Paragraph("Содержание", styles["BOSH1"]))

    h1s = []
    for line in lines:
        m = re.match(r"^#\s+(.+)", line)
        if m and not m.group(1).startswith("BalanceOS Worldview"):
            h1s.append(m.group(1).strip())
    for h in h1s:
        story.append(Paragraph(esc(h), styles["BOSTOC"]))
    story.append(PageBreak())

    skip_until_first_rule = True
    passed_first_rule = False
    for raw in lines:
        line = raw.rstrip()
        if skip_until_first_rule:
            if line.strip() == "---":
                skip_until_first_rule = False
            continue
        if line.strip() == "---":
            flush_para()
            story.append(Spacer(1, 8))
            continue
        if line.strip().startswith("```"):
            flush_para()
            if not in_code:
                in_code = True
                code = []
            else:
                story.append(Preformatted("\n".join(code), styles["BOSCode"]))
                in_code = False
                code = []
            continue
        if in_code:
            code.append(line)
            continue
        if not line.strip():
            flush_para()
            continue
        m = re.match(r"^(#{1,3})\s+(.+)", line)
        if m:
            flush_para()
            level = len(m.group(1))
            title = m.group(2).strip()
            if level == 1:
                if not first_h1:
                    story.append(PageBreak())
                first_h1 = False
                num = re.match(r"^(\d+)\.\s+", title)
                if num:
                    story.append(Paragraph("ГЛАВА " + num.group(1), styles["BOSChapterNo"]))
                story.append(Paragraph(esc(title), styles["BOSH1"]))
            elif level == 2:
                story.append(Paragraph(esc(title), styles["BOSH2"]))
            else:
                story.append(Paragraph(esc(title), styles["BOSH3"]))
            continue
        if line.startswith(">"):
            flush_para()
            q = line.lstrip("> ").strip()
            story.append(Paragraph(esc(q), styles["BOSQuote"]))
            continue
        b = re.match(r"^[-–—]\s+(.+)", line.strip())
        if b:
            flush_para()
            story.append(Paragraph(esc(b.group(1)), styles["BOSBullet"], bulletText="•"))
            continue
        para.append(line)
    flush_para()
    return story


def main():
    md = SRC.read_text(encoding="utf-8")
    doc = BOSDoc(str(OUT))
    story = parse_markdown(md)
    # Use cover template for first page, body for the rest.
    doc.build(story)
    print(OUT)

if __name__ == "__main__":
    main()
