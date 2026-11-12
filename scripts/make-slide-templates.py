"""One-off: write the built-in Soạn bài slide templates to public/templates/.

Run with `python3 scripts/make-slide-templates.py` (needs python-pptx) and
commit the .pptx files. The browser fills the {{field}} placeholders
(lib/slides/fill.ts); a teacher can download a template, restyle it in
PowerPoint or Google Slides and upload it back.
"""
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

INK = RGBColor(0x0F, 0x17, 0x2A)
SOFT = RGBColor(0x47, 0x55, 0x69)
ACCENT = RGBColor(0xB4, 0x53, 0x09)
PAPER = RGBColor(0xFF, 0xFB, 0xEB)
W, H = Inches(13.333), Inches(7.5)


def new_deck():
    prs = Presentation()
    prs.slide_width, prs.slide_height = W, H
    return prs


def blank(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = PAPER
    return slide


def text(slide, x, y, w, h, value, size, color=INK, bold=False):
    box = slide.shapes.add_textbox(x, y, w, h)
    frame = box.text_frame
    frame.word_wrap = True
    frame.vertical_anchor = MSO_ANCHOR.MIDDLE
    para = frame.paragraphs[0]
    para.alignment = PP_ALIGN.CENTER
    run = para.add_run()
    run.text = value
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    return box


def title_slide(prs):
    s = blank(prs)
    text(s, Inches(1), Inches(2.4), Inches(11.333), Inches(1.6), "{{bai}}", 54, INK, True)
    text(s, Inches(1), Inches(4.1), Inches(11.333), Inches(0.8), "Từ mới · 生词", 28, ACCENT)


def word_slide(prs, with_answer=True):
    s = blank(prs)
    text(s, Inches(0.5), Inches(0.3), Inches(2), Inches(0.6), "{{so}}", 18, SOFT)
    if not with_answer:
        text(s, Inches(1), Inches(1.5), Inches(11.333), Inches(4), "{{chu}}", 160, INK)
        return
    text(s, Inches(1), Inches(0.6), Inches(11.333), Inches(2.4), "{{chu}}", 120, INK)
    text(s, Inches(1), Inches(3.0), Inches(11.333), Inches(0.8), "{{pinyin}}  ·  {{hanviet}}", 36, ACCENT, True)
    text(s, Inches(1), Inches(3.8), Inches(11.333), Inches(0.8), "{{nghia}}", 30, INK)
    text(s, Inches(1), Inches(5.0), Inches(11.333), Inches(0.7), "{{vidu}}", 28, INK)
    text(s, Inches(1), Inches(5.65), Inches(11.333), Inches(0.5), "{{vidu_pinyin}}", 18, SOFT)
    text(s, Inches(1), Inches(6.15), Inches(11.333), Inches(0.6), "{{vidu_nghia}}", 20, SOFT)


# "Thẻ từ": a title slide, then one slide per word.
prs = new_deck()
title_slide(prs)
word_slide(prs)
prs.save("public/templates/the-tu.pptx")

# "Hỏi – đáp": per word, the character alone, then the answer.
prs = new_deck()
title_slide(prs)
word_slide(prs, with_answer=False)
word_slide(prs)
prs.save("public/templates/hoi-dap.pptx")
