#!/usr/bin/env python3
"""Populate the official SAIF 2026 (18+/Deep Evergreen) poster template with ATHAR content.

Works directly on the template's slide XML (never text_frame.text = ...) so every existing
run/paragraph's font, size and color survives; new paragraphs are cloned from the template's own
placeholder paragraph so they inherit its exact formatting DNA.
"""
import copy
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
def qn(tag):
    return f'{{{A}}}{tag}'

INK = "0E3F3C"      # Deep Evergreen (18+ category color, matches template)
ACCENT = "1C7293"   # a supporting teal used only for figure captions (not template's own field color)
GRAY = "5A6472"

ROOT = "/home/user/-2/saif-competition-materials"
TEMPLATE = f"{ROOT}/05-poster-saif2026/template/SAIF_Poster_Template_18plus.pptx"
OUT = f"{ROOT}/05-poster-saif2026/ATHAR_SAIF_Poster.pptx"
FIGDIR = f"{ROOT}/05-poster-saif2026/figures"

prs = Presentation(TEMPLATE)
slide = prs.slides[0]

def shape(sid):
    for s in slide.shapes:
        if s.shape_id == sid:
            return s
    raise KeyError(sid)

# ---------------------------------------------------------------------------
# 0. Delete the guidance slide (slide 2) -- its own on-slide text says to
#    delete it before exporting.
# ---------------------------------------------------------------------------
xml_slides = prs.slides._sldIdLst
for sld in list(xml_slides)[1:]:
    r_id = sld.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
    prs.part.drop_rel(r_id)
    xml_slides.remove(sld)

# ---------------------------------------------------------------------------
# Paragraph / run helpers -- clone the box's own placeholder paragraph so every
# new paragraph inherits the template's exact font family, size, color, spacing.
# ---------------------------------------------------------------------------
def get_ref_paragraph(shp):
    txBody = shp.text_frame._txBody
    ps = txBody.findall(qn('p'))
    return copy.deepcopy(ps[0])

def clear_paragraphs(shp):
    txBody = shp.text_frame._txBody
    for p in txBody.findall(qn('p')):
        txBody.remove(p)
    return txBody

def make_run(ref_r, text, bold=None, italic=None, size=None, color=None):
    r = copy.deepcopy(ref_r)
    rPr = r.find(qn('rPr'))
    t = r.find(qn('t'))
    t.text = text
    if text != text.strip():
        t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    if bold is not None:
        rPr.set('b', '1' if bold else '0')
    if italic is not None:
        rPr.set('i', '1' if italic else '0')
    if size is not None:
        rPr.set('sz', str(int(round(size * 100))))
    if color is not None:
        sf = rPr.find(qn('solidFill'))
        clr = sf.find(qn('srgbClr'))
        clr.set('val', color)
    return r

def fill_paragraphs(shp, specs):
    """specs: list of dicts.
       Each dict: {"runs": [{"text","bold","italic","size","color"}, ...],
                   "align": "l"/"ctr", "space_before": pt, "space_after": pt}
       A dict may use "text"/"bold"/"italic"/"size"/"color" directly as shorthand
       for a single-run paragraph."""
    ref_p = get_ref_paragraph(shp)
    ref_pPr_template = ref_p.find(qn('pPr'))
    ref_r_template = ref_p.find(qn('r'))
    txBody = clear_paragraphs(shp)
    for spec in specs:
        newp = copy.deepcopy(ref_p)
        pPr = newp.find(qn('pPr'))
        old_r = newp.find(qn('r'))
        newp.remove(old_r)
        runs = spec.get('runs')
        if runs is None:
            runs = [{k: spec[k] for k in ('text', 'bold', 'italic', 'size', 'color') if k in spec}]
        for rs in runs:
            r = make_run(ref_r_template, rs.get('text', ''), rs.get('bold'), rs.get('italic'),
                         rs.get('size'), rs.get('color'))
            newp.append(r)
        if spec.get('align') is not None:
            pPr.set('algn', spec['align'])
        if spec.get('space_before') is not None:
            spcBef = pPr.find(qn('spcBef'))
            spcBef.find(qn('spcPts')).set('val', str(int(spec['space_before'] * 100)))
        if spec.get('space_after') is not None:
            spcAft = pPr.find(qn('spcAft'))
            spcAft.find(qn('spcPts')).set('val', str(int(spec['space_after'] * 100)))
        txBody.append(newp)

def set_single_run_text(shp, text):
    p = shp.text_frame.paragraphs[0]
    p.runs[0].text = text

def estimate_text_height(shp, avail_w_in, char_w_factor=0.58):
    """Conservative (wide-character) estimate of a text box's rendered height in
    inches, used to place figures/tables below it without a real layout engine."""
    total = 0.0
    for p in shp.text_frame.paragraphs:
        pPr = p._p.find(qn('pPr'))
        sb = pPr.find(qn('spcBef'))
        sbpts = sb.find(qn('spcPts'))
        space_before_pt = int(sbpts.get('val')) / 100 if sbpts is not None and sbpts.get('val') else 0
        total += space_before_pt / 72
        text = ''.join(r.text for r in p.runs)
        maxsize = max((r.font.size.pt if r.font.size else 24) for r in p.runs) if p.runs else 24
        chars_per_line = max(1, avail_w_in / (maxsize * char_w_factor / 72))
        nlines = max(1, -(-len(text) // int(chars_per_line)))
        total += nlines * (maxsize * 1.25) / 72
    return total

# ---------------------------------------------------------------------------
# 1. Header: two-line title ("ATHAR -- ..." + subtitle), grow the header band,
#    then shift every shape below it down by the same amount so all the
#    relative gaps between rows stay exactly what the template designed.
# ---------------------------------------------------------------------------
DELTA = Inches(0.45)

title_box = shape(29)
title_box.height = Inches(1.864)
fill_paragraphs(title_box, [
    {"text": "ATHAR — Smart Assistant for Missing-Person Search", "bold": True, "size": 44},
    {"text": "Bayesian Search-Area Prioritization Using Trip Context and Delayed Location Evidence",
     "bold": False, "italic": True, "size": 24, "space_before": 4},
])

header_bg = shape(28)
header_bg.height = header_bg.height + DELTA

for sid in [30, 31, 32, 52, 53, 33, 34, 35, 36, 41, 42, 37, 38, 39, 40, 43, 44,
            45, 46, 47, 48, 49, 50, 51]:
    s = shape(sid)
    s.top = s.top + DELTA

# ---------------------------------------------------------------------------
# 2. Student name / ID
# ---------------------------------------------------------------------------
name_box = shape(30)
fill_paragraphs(name_box, [
    {"text": "Student Name: ABDULAZIZ KHALID ALJURAID", "size": 44},
    {"text": "King Saud University", "italic": True, "size": 26, "space_before": 4},
])

id_box = shape(31)
fill_paragraphs(id_box, [{"text": "ID: pending", "size": 40}])

# Country flag (id 32), Booth Number (id 52) and QR Code (id 53) placeholders
# are left exactly as the template ships them -- see STATUS.md for why.

# ---------------------------------------------------------------------------
# 3. Introduction
# ---------------------------------------------------------------------------
intro = shape(41)
fill_paragraphs(intro, [
    {"text": "Missing-traveler search requires combining incomplete location evidence with "
             "trip context. Terrain-aware Bayesian models represent uncertain movement [1], "
             "while out-of-sequence measurement research addresses delayed observations [2]. "
             "Under intermittent connectivity, a received fix may describe a past position, "
             "not the traveler's current location.", "size": 28},
    {"text": "Objective: ", "bold": True, "size": 28, "space_before": 14,
     "runs": [
         {"text": "Objective: ", "bold": True, "size": 28},
         {"text": "specify a reproducible framework for updating search regions using "
                  "observation-time evidence, and ranking candidate areas by model weight "
                  "and estimated search effort.", "bold": False, "size": 28},
     ]},
    {"text": "“Can observation-time updates improve ground-truth inclusion at a fixed "
             "search-area budget, compared with receipt-time updates?”",
     "italic": True, "size": 32, "space_before": 20},
])

# ---------------------------------------------------------------------------
# 4. Methodology -- short bridge text + Eq.1 + ranking-in-words, figures below
# ---------------------------------------------------------------------------
method = shape(42)
fill_paragraphs(method, [
    {"text": "ATHAR combines a trip plan, a timestamped evidence log, and a road-and-terrain "
             "motion model (Figure 1), deduplicating fixes and propagating vehicle, walking "
             "and stationary states over time.", "size": 22},
    {"text": "Eq. 1 — Evidence weight update", "bold": True, "size": 19, "space_before": 8},
    {"text": "w′(s) = [ L(e|s) · w(s) ] / Σ [ L(e|s*) · w(s*) ]",
     "bold": True, "size": 22, "space_before": 3},
    {"text": "w = prior weight · w′ = updated weight · L = evidence compatibility, "
             "applied at the evidence's observed time.", "size": 15, "space_before": 3},
    {"text": "A late fix restores a checkpoint and replays evidence (Figure 2). Regions are "
             "then ranked by weight relative to access and search time (full formula in the "
             "appendix).", "size": 22, "space_before": 8},
])

# ---------------------------------------------------------------------------
# 5. Results -- short text, Figure 3 below
# ---------------------------------------------------------------------------
results = shape(43)
fill_paragraphs(results, [
    {"text": "Current outputs comprise a system architecture, interface mock-ups and a "
             "specified evidence-update workflow (Design-Stage Outputs). Quantitative "
             "performance has not yet been evaluated.", "size": 26},
    {"text": "Legend: Observed fix — Planned route — Estimated search region",
     "italic": True, "size": 20, "space_before": 10},
])

# ---------------------------------------------------------------------------
# 6. Innovation -- short text; Table 2 added later
# ---------------------------------------------------------------------------
innovation = shape(44)
fill_paragraphs(innovation, [
    {"text": "The proposed contribution is an auditable workflow linking pre-trip context, "
             "observation-time evidence replay, and effort-aware search-area ranking. "
             "Recorded locations stay distinct from current estimates, and every priority "
             "update traces back to its evidence and assumptions.", "size": 28},
    {"text": "A proposed system design — not a claim of priority over Bayesian search "
             "modeling or out-of-sequence estimation generally.", "italic": True, "size": 22,
     "space_before": 10},
])

# ---------------------------------------------------------------------------
# 7. Conclusion
# ---------------------------------------------------------------------------
conclusion = shape(49)
fill_paragraphs(conclusion, [
    {"text": "ATHAR defines a design-stage framework for organizing trip evidence and "
             "updating search priorities under intermittent connectivity. The current "
             "contribution is a documented computational workflow and interface concept; "
             "its operational benefit remains to be established through implementation and "
             "comparative evaluation.", "size": 30},
    {"text": "Estimates support human review and do not establish live location after "
             "disconnection.", "italic": True, "size": 24, "space_before": 12},
])

# ---------------------------------------------------------------------------
# 8. Future Work & References -- 3 stages; Table 3 added later
# ---------------------------------------------------------------------------
future = shape(50)
fill_paragraphs(future, [
    {"runs": [{"text": "1. Implementation — ", "bold": True, "size": 23},
              {"text": "build an executable pipeline for evidence intake, region updates "
                       "and incident-card generation.", "size": 23}]},
    {"runs": [{"text": "2. Controlled evaluation — ", "bold": True, "size": 23},
              {"text": "replay known trips under message delay, disconnection and "
                       "measurement noise, comparing methods.", "size": 23}],
     "space_before": 8},
    {"runs": [{"text": "3. Supervised usability assessment — ", "bold": True, "size": 23},
              {"text": "evaluate clarity of priorities with domain reviewers, after "
                       "computational verification.", "size": 23}],
     "space_before": 8},
    {"text": "Full reference list [1]–[5] and the evaluation appendix are linked via the "
             "QR code above.", "italic": True, "size": 18, "space_before": 10},
])

# ---------------------------------------------------------------------------
# 9. Acknowledgments -- append the statement after the template's own label
# ---------------------------------------------------------------------------
ack = shape(51)
ref_p = ack.text_frame.paragraphs[0]._p
ref_r = ref_p.find(qn('r'))
label_r = make_run(ref_r, "Acknowledgments Statement: ", bold=True)
stmt_r = make_run(ref_r, "No external funding or institutional support to acknowledge.", bold=False)
old_r = ref_p.find(qn('r'))
ref_p.remove(old_r)
ref_p.append(label_r)
ref_p.append(stmt_r)

# ---------------------------------------------------------------------------
# 10. Figures -- inserted as pictures below each section's text, at sizes that
#     preserve each PNG's native aspect ratio (no distortion). Captions are
#     small italic textboxes spanning the section's full column width.
# ---------------------------------------------------------------------------
def add_caption(left, top, width, num, title, body):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(0.9))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    r1 = p.add_run()
    r1.text = f"{num}. {title} "
    r1.font.bold = True
    r1.font.size = Pt(18)
    r1.font.color.rgb = RGBColor.from_string(INK)
    r1.font.name = "IBM Plex Sans Arabic Medium"
    r2 = p.add_run()
    r2.text = body
    r2.font.bold = False
    r2.font.italic = True
    r2.font.size = Pt(18)
    r2.font.color.rgb = RGBColor.from_string(GRAY)
    r2.font.name = "IBM Plex Sans Arabic"
    return tb

def estimate_caption_height(title, body, width_in, size=18, char_w_factor=0.58):
    text = title + " " + body
    chars_per_line = max(1, width_in / (size * char_w_factor / 72))
    nlines = max(1, -(-len(text) // int(chars_per_line)))
    return nlines * (size * 1.25) / 72 + 0.06

INSET = 0.1
GAP = 0.14

def check_fits(label, bottom_in, box):
    box_bottom = box.top / 914400 + box.height / 914400 - INSET
    status = "OK" if bottom_in <= box_bottom else "!! OVERFLOW !!"
    print(f"{label}: content bottom={bottom_in:.2f}in  box bottom={box_bottom:.2f}in  {status}")

method = shape(42)
m_left = method.left / 914400
m_w = method.width / 914400
m_top = method.top / 914400
text_h = estimate_text_height(method, m_w - 2 * INSET)
fig1_top = m_top + INSET + text_h + 0.3
fig1_h = 4.3
fig1_w = fig1_h * (3543 / 2421)
slide.shapes.add_picture(f"{FIGDIR}/figure1-architecture.png",
                          Inches(m_left), Inches(fig1_top), Inches(fig1_w), Inches(fig1_h))
cap1_title = "Proposed system architecture."
cap1_body = ("Data flow from intake through analysis to the monitor interface; the "
             "highlighted arrow marks the recompute trigger. Design-stage architecture.")
cap1_top = fig1_top + fig1_h + GAP
add_caption(m_left, cap1_top, m_w, 1, cap1_title, cap1_body)
cap1_h = estimate_caption_height(cap1_title, cap1_body, m_w)

fig2_top = cap1_top + cap1_h + GAP
fig2_h = 1.8
fig2_w = fig2_h * 3.0
slide.shapes.add_picture(f"{FIGDIR}/figure2-late-evidence.png",
                          Inches(m_left), Inches(fig2_top), Inches(fig2_w), Inches(fig2_h))
cap2_title = "Observation-time processing of delayed evidence."
cap2_body = ("Restore → Insert → Replay → Predict → Publish. Design-stage "
             "workflow, not a measured run.")
cap2_top = fig2_top + fig2_h + GAP
add_caption(m_left, cap2_top, m_w, 2, cap2_title, cap2_body)
cap2_h = estimate_caption_height(cap2_title, cap2_body, m_w)
check_fits("Methodology (text+fig1+cap1+fig2+cap2)", cap2_top + cap2_h, method)

results = shape(43)
r_left = results.left / 914400
r_w = results.width / 914400
r_top = results.top / 914400
rtext_h = estimate_text_height(results, r_w - 2 * INSET)
fig3_h = 7.0
fig3_w = fig3_h * (3543 / 1772)
fig3_top = r_top + INSET + rtext_h + 0.3
fig3_left = r_left + (r_w - fig3_w) / 2
slide.shapes.add_picture(f"{FIGDIR}/figure3-search-update.png",
                          Inches(fig3_left), Inches(fig3_top), Inches(fig3_w), Inches(fig3_h))
cap3_title = "Design-stage search-update illustration."
cap3_body = ("Two maps at 16:40: (A) before the 16:20 fix is inserted; (B) after it is "
             "replayed. Schematic illustration; regions are not computed experimental output.")
cap3_top = fig3_top + fig3_h + GAP
add_caption(r_left, cap3_top, r_w, 3, cap3_title, cap3_body)
cap3_h = estimate_caption_height(cap3_title, cap3_body, r_w)
check_fits("Results (text+fig3+cap3)", cap3_top + cap3_h, results)

# ---------------------------------------------------------------------------
# 11. Table 2 (Innovation) -- scope comparison
# ---------------------------------------------------------------------------
innovation = shape(44)
i_w = innovation.width / 914400
itext_h = estimate_text_height(innovation, i_w - 2 * INSET)
t2_left = innovation.left / 914400 + 0.14
t2_top = innovation.top / 914400 + INSET + itext_h + 0.3
t2_w = 13.5
rows2 = [
    ["", "Last-known\nlocation view", "Receipt-time\nbaseline", "ATHAR\n(proposed)"],
    ["Uses trip context", "No", "No", "Proposed"],
    ["Orders by observation time", "No", "No", "Proposed"],
    ["Distinguishes recorded vs.\nestimated position", "No", "Partial", "Proposed"],
    ["Ranks by access + search effort", "No", "No", "Proposed"],
]
gtbl = slide.shapes.add_table(len(rows2), 4, Inches(t2_left), Inches(t2_top),
                               Inches(t2_w), Inches(0.85 * len(rows2))).table
gtbl.columns[0].width = Inches(4.8)
for c in (1, 2, 3):
    gtbl.columns[c].width = Inches(2.9)
for ri, row in enumerate(rows2):
    gtbl.rows[ri].height = Inches(0.85)
    for ci, val in enumerate(row):
        cell = gtbl.cell(ri, ci)
        cell.margin_left = cell.margin_right = Inches(0.08)
        cell.margin_top = cell.margin_bottom = Inches(0.04)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor.from_string(INK if ri == 0 else "FFFFFF")
        tf = cell.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER if ci > 0 else PP_ALIGN.LEFT
        r = p.add_run()
        r.text = val
        r.font.size = Pt(15 if ri == 0 else 16)
        r.font.bold = (ri == 0) or (ci > 0 and val == "Proposed")
        r.font.name = "IBM Plex Sans Arabic Medium"
        r.font.color.rgb = RGBColor.from_string("FFFFFF" if ri == 0 else INK)
check_fits("Innovation (text+table2)", t2_top + 0.85 * len(rows2), innovation)

# ---------------------------------------------------------------------------
# 12. Table 3 (Future Work) -- evaluation plan
# ---------------------------------------------------------------------------
future = shape(50)
f_w = future.width / 914400
ftext_h = estimate_text_height(future, f_w - 2 * INSET)
t3_left = future.left / 914400 + 0.14
t3_top = future.top / 914400 + INSET + ftext_h + 0.3
t3_w = 13.5
rows3 = [
    ["Evaluation plan", ""],
    ["Metrics", "Ground-truth inclusion at matched budget · arrival-order consistency · "
                "recalculation latency · incident-card prep time"],
    ["Baselines", "Last-known circle · road/time access radius · receipt-time processing · "
                  "full observation-time processing (proposed)"],
    ["Ablations", "Without trip plan · without temporal replay"],
]
ttbl = slide.shapes.add_table(len(rows3), 2, Inches(t3_left), Inches(t3_top),
                               Inches(t3_w), Inches(0.55 * 3 + 0.5)).table
ttbl.columns[0].width = Inches(2.6)
ttbl.columns[1].width = Inches(10.9)
ttbl.rows[0].height = Inches(0.5)
for ri in range(1, 4):
    ttbl.rows[ri].height = Inches(0.7)
# header row: merge visually by just styling row 0 as a single bold bar
hdr_cell = ttbl.cell(0, 0)
hdr_cell.merge(ttbl.cell(0, 1))
for ri, row in enumerate(rows3):
    for ci, val in enumerate(row):
        if ri == 0 and ci == 1:
            continue
        cell = ttbl.cell(ri, ci)
        cell.margin_left = cell.margin_right = Inches(0.08)
        cell.margin_top = cell.margin_bottom = Inches(0.04)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor.from_string(INK if ri == 0 else "FFFFFF")
        tf = cell.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.LEFT
        r = p.add_run()
        r.text = val
        r.font.size = Pt(16 if ri == 0 else 14)
        r.font.bold = (ri == 0) or ci == 0
        r.font.name = "IBM Plex Sans Arabic Medium"
        r.font.color.rgb = RGBColor.from_string("FFFFFF" if ri == 0 else INK)
check_fits("Future Work (text+table3)", t3_top + 0.55 * 3 + 0.5, future)

# ---------------------------------------------------------------------------
# 13. Self-check the text-only boxes too (Introduction, Conclusion)
# ---------------------------------------------------------------------------
intro_h = estimate_text_height(intro, intro.width / 914400 - 2 * INSET)
check_fits("Introduction (text only)", intro.top / 914400 + INSET + intro_h, intro)
concl_h = estimate_text_height(conclusion, conclusion.width / 914400 - 2 * INSET)
check_fits("Conclusion (text only)", conclusion.top / 914400 + INSET + concl_h, conclusion)

prs.save(OUT)
print("Saved", OUT)
print("Slides remaining:", len(prs.slides._sldIdLst))
