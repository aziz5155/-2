# Status — ATHAR SAIF 2026 poster rebuild

## Blocked: cannot reach the official template

This sandbox's network egress is restricted to an allowlist (package registries, GitHub, Anthropic
APIs, etc.). General web domains are denied by the outbound proxy. Confirmed blocked in this
session, each with a `403` at the proxy's CONNECT step:

- `s.tuwaiq.edu.sa` (the template guide short link) — **this is the one that actually blocks
  progress on the template itself.**
- `doi.org`, `arxiv.org`, `h3geo.org` — reference-verification links (not blocking; see below).

This is not specific to that one link — it is every external website in this environment. There is
no retry or workaround on my end that gets around it; a different link would fail the same way.

### What I need from you (pick whichever is easiest)

1. **Best:** Download the "18+ / Deep Evergreen" editable template yourself from
   `https://s.tuwaiq.edu.sa/hzv3L` → "Access and download your own copy here", and upload the
   resulting file to me directly (PPTX, or whatever format it opens as — Canva/Google Slides links
   usually offer a "Make a copy" / "Download as PowerPoint" option).
2. If it's a Canva or Google Slides link rather than a direct file, pasting that direct link to me
   also works — I can't follow the Tuwaiq short link, but a `canva.com` or `docs.google.com` link
   may resolve differently depending on what's allowlisted; I'll try it and tell you immediately if
   it's also blocked, rather than guessing.
3. If neither is convenient right now, say so and I will keep working from the content package
   below — but I will not fabricate a look-alike "official template" from a screenshot, per your
   explicit instruction.

## Not blocking, but noted: reference re-verification

I also could not re-fetch `doi.org`, `arxiv.org`, or the three tool-documentation URls to confirm
the bibliographic details you supplied for references [1]–[5] are exactly correct (title, authors,
year, working link). I formatted them exactly as you gave them in `content.md`. If it matters for
judging, have a human click each link once before the file goes to print.

## Done and ready now (does not depend on the template file)

- `content.md` — full English section-by-section text, within your word budgets, plus the two
  equations, the three small tables, the reference list, and all figure captions. This is the
  editorial source to pour into the template once we have it.
- Figures 1–3 (English, poster-legible) — see `figures/` in this folder once built (in progress —
  tracked as a separate step in this same working session).

## Not started / cannot start without the template

- The actual `ATHAR_SAIF_Poster.pdf` (36×48in, one page, real vector text) and the editable
  source file — these have to be built *inside* the real template's canvas, fixed elements, logos
  and identity fields, not recreated from a description. I will not ship a from-scratch redesign
  and call it the official template.
- Final QR code — waiting on a public, no-login reference/appendix link per your instruction; I
  have not fabricated one.
- Project ID and Booth Number — not yet issued, left blank in `content.md` as instructed.
