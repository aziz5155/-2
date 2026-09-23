# Status — ATHAR SAIF 2026 poster

## Delivered

**`ATHAR_SAIF_Poster.pptx`** — the real official 18+/Deep Evergreen template
(`SAIF_Poster_Template_18plus.pptx`, as you uploaded it), populated with ATHAR's content. Built by
editing the template's own slide XML directly — every new paragraph clones the template's own
placeholder paragraph, so it inherits its exact font (IBM Plex Sans Arabic, embedded in the file),
size, color and spacing. Nothing was redrawn from a screenshot. Confirmed:

- Slide size is exactly 36in × 48in (verified from the template's own `<p:sldSz>`, unchanged).
- The guidance slide (slide 2, which itself says "delete before exporting your poster") is removed.
- All six required sections present, in the template's own order and headings: Introduction,
  Methodology, Results, Innovation, Conclusion, Future Work & References.
- Fixed elements untouched: all logos (they live in the slide layout, never touched), the QR code
  and Booth Number placeholders (still blank — no fake QR/number invented), Country Flag
  placeholder (see below), the identity field positions and the Deep Evergreen `#0E3F3C` category
  color.
- Content is English-only, split cleanly into: proposed design vs. worked example vs. what's
  actually built (Design-Stage Outputs) — no invented metrics, no "validated"/"field-tested"
  language.
- Both equations shown compactly (weight update in full; region-ranking described in words per
  your own instruction to keep the poster readable and put the full formula in the appendix).
- Three new figures (system architecture; observation-time late-evidence processing; two-map
  design-stage search-update illustration) placed under Methodology/Results with numbered English
  captions.
- Two compact tables (Innovation scope comparison; Future Work evaluation plan) as real native
  PowerPoint tables, not images.
- Structural validation passed (`validate.py --original`, baselined against your uploaded
  template) and a text sweep found no leftover "Text here" / Lorem / TODO placeholders.

## Could not do in this sandbox — needs your action

**I cannot render or export a PDF here.** LibreOffice is broken at a bootstrap level in this
environment — confirmed with strace: it fails to load *any* file, including a blank test PPTX and
a plain `.txt` file, with a fresh profile, so it's not specific to this poster. There is no
PowerPoint installed either. This means:

1. **I could not generate `ATHAR_SAIF_Poster.pdf` myself.** Please open `ATHAR_SAIF_Poster.pptx`
   in real PowerPoint or Google Slides and export to PDF yourself (File → Export/Download → PDF).
   Because the slide is already the true 36×48in size, exporting at 100%/default scale gives you
   the exact print-ready PDF with real vector text — do not print-to-image.
2. **I could not visually proof the layout.** All text placement was computed from the template's
   own XML geometry plus a deliberately conservative (wide-character) text-wrap estimate, not a
   real rendering. Every section's estimated content height was checked against its available box
   height before I shipped this (all passed, with the tightest margin ~0.3in in Methodology) — but
   please open the file yourself and check for text slightly overflowing a box, since that's the
   one failure mode I could not rule out with certainty. If Methodology text overflows slightly,
   the fix is small: nudge Figure 1 down a little, or trim a few words from the bridge paragraph.
3. **Country Flag placeholder left untouched** (still says "Country Flag Here"). I have no network
   access in this sandbox to fetch a real Saudi flag asset, and did not want to hand-draw a
   national flag (risk of getting the calligraphy wrong). Please drop in an official flag image
   yourself, or tell me to just replace the placeholder with the text "Saudi Arabia" instead.
4. **QR code and Booth Number**: still the template's own blank placeholders, per your instruction
   not to fabricate them. Fill these in once the Project ID/Booth Number are issued and you have a
   public reference URL (`references.md` in this folder is the standalone appendix ready to
   publish and link).
5. **ID field** currently reads "ID: pending" — replace once issued.

## Compliance checklist (from your acceptance tests)

- [x] English-only added content
- [x] 36×48in, portrait, unchanged from template
- [x] Deep Evergreen category color (18+), matches your registration basis
- [x] Six sections present, template's own headings, no renamed/added top-level sections
- [x] Fixed elements/logos untouched (they're in the layout, not the slide)
- [x] Full approved project name in Innovation Title
- [x] No fabricated identity data (ID/Booth/QR left open, flagged above)
- [ ] **PDF is the print file** — blocked, needs you to export it (see above)
- [x] Funnel-structured Introduction with explicit Objective + research question
- [x] Methodology tied to figures, each technique's role stated, no decorative tech names
- [x] observed_at vs. received_at vs. evaluation-time (16:40) kept distinct throughout
- [x] Every output labeled by type (proposed / worked example / Design-Stage Output)
- [x] Results carries no invented numbers; explicit "Quantitative performance has not yet been
      evaluated" and "Schematic illustration; regions are not computed experimental output"
- [x] Innovation states contribution without unsupported priority claims
- [x] Conclusion does not outrun Results
- [x] Future Work tied to current readiness, three verifiable stages
- [x] References [1]-[5] present; **not** re-verified live (this sandbox also blocks doi.org/
      arxiv.org/h3geo.org) — have a human click each once before print
- [ ] **Visual proof pass** — blocked, needs you to open the file (see above)
